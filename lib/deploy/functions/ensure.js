"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretAccess = exports.cloudBuildEnabled = exports.defaultServiceAccount = void 0;
const clc = require("colorette");
const ensureApiEnabled_1 = require("../../ensureApiEnabled");
const error_1 = require("../../error");
const utils_1 = require("../../utils");
const secretManager_1 = require("../../gcp/secretManager");
const projects_1 = require("../../management/projects");
const functional_1 = require("../../functional");
const track_1 = require("../../track");
const backend = require("./backend");
const FAQ_URL = "https://firebase.google.com/support/faq#functions-runtime";
const CLOUD_BUILD_API = "cloudbuild.googleapis.com";
async function defaultServiceAccount(e) {
    const metadata = await (0, projects_1.getFirebaseProject)(e.project);
    if (e.platform === "gcfv1") {
        return `${metadata.projectId}@appspot.gserviceaccount.com`;
    }
    else if (e.platform === "gcfv2") {
        return `${metadata.projectNumber}-compute@developer.gserviceaccount.com`;
    }
    (0, functional_1.assertExhaustive)(e.platform);
}
exports.defaultServiceAccount = defaultServiceAccount;
function nodeBillingError(projectId) {
    void (0, track_1.track)("functions_runtime_notices", "nodejs10_billing_error");
    return new error_1.FirebaseError(`Cloud Functions deployment requires the pay-as-you-go (Blaze) billing plan. To upgrade your project, visit the following URL:

https://console.firebase.google.com/project/${projectId}/usage/details

For additional information about this requirement, see Firebase FAQs:

${FAQ_URL}`, { exit: 1 });
}
function nodePermissionError(projectId) {
    void (0, track_1.track)("functions_runtime_notices", "nodejs10_permission_error");
    return new error_1.FirebaseError(`Cloud Functions deployment requires the Cloud Build API to be enabled. The current credentials do not have permission to enable APIs for project ${clc.bold(projectId)}.

Please ask a project owner to visit the following URL to enable Cloud Build:

https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com?project=${projectId}

For additional information about this requirement, see Firebase FAQs:
${FAQ_URL}
`);
}
function isPermissionError(e) {
    var _a, _b, _c;
    return ((_c = (_b = (_a = e.context) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.status) === "PERMISSION_DENIED";
}
async function cloudBuildEnabled(projectId) {
    try {
        await (0, ensureApiEnabled_1.ensure)(projectId, CLOUD_BUILD_API, "functions");
    }
    catch (e) {
        if ((0, error_1.isBillingError)(e)) {
            throw nodeBillingError(projectId);
        }
        else if (isPermissionError(e)) {
            throw nodePermissionError(projectId);
        }
        throw e;
    }
}
exports.cloudBuildEnabled = cloudBuildEnabled;
async function secretsToServiceAccounts(b) {
    const secretsToSa = {};
    for (const e of backend.allEndpoints(b)) {
        const sa = e.serviceAccount || (await module.exports.defaultServiceAccount(e));
        for (const s of e.secretEnvironmentVariables || []) {
            const serviceAccounts = secretsToSa[s.secret] || new Set();
            serviceAccounts.add(sa);
            secretsToSa[s.secret] = serviceAccounts;
        }
    }
    return secretsToSa;
}
async function secretAccess(projectId, wantBackend, haveBackend) {
    var _a, _b;
    const ensureAccess = async (secret, serviceAccounts) => {
        (0, utils_1.logLabeledBullet)("functions", `ensuring ${clc.bold(serviceAccounts.join(", "))} access to secret ${clc.bold(secret)}.`);
        await (0, secretManager_1.ensureServiceAgentRole)({ name: secret, projectId }, serviceAccounts, "roles/secretmanager.secretAccessor");
        (0, utils_1.logLabeledSuccess)("functions", `ensured ${clc.bold(serviceAccounts.join(", "))} access to ${clc.bold(secret)}.`);
    };
    const wantSecrets = await secretsToServiceAccounts(wantBackend);
    const haveSecrets = await secretsToServiceAccounts(haveBackend);
    for (const [secret, serviceAccounts] of Object.entries(haveSecrets)) {
        for (const serviceAccount of serviceAccounts) {
            (_a = wantSecrets[secret]) === null || _a === void 0 ? void 0 : _a.delete(serviceAccount);
        }
        if (((_b = wantSecrets[secret]) === null || _b === void 0 ? void 0 : _b.size) === 0) {
            delete wantSecrets[secret];
        }
    }
    const ensure = [];
    for (const [secret, serviceAccounts] of Object.entries(wantSecrets)) {
        ensure.push(ensureAccess(secret, Array.from(serviceAccounts)));
    }
    await Promise.all(ensure);
}
exports.secretAccess = secretAccess;
