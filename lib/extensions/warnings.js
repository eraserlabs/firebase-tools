"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outOfBandChangesWarning = exports.displayWarningsForDeploy = exports.displayWarningPrompts = void 0;
const marked_1 = require("marked");
const clc = require("colorette");
const types_1 = require("./types");
const displayExtensionInfo_1 = require("./displayExtensionInfo");
const extensionsHelper_1 = require("./extensionsHelper");
const resolveSource_1 = require("./resolveSource");
const deploymentSummary_1 = require("../deploy/extensions/deploymentSummary");
const planner_1 = require("../deploy/extensions/planner");
const functional_1 = require("../functional");
const utils = require("../utils");
const logger_1 = require("../logger");
function displayEAPWarning({ publisherId, sourceDownloadUri, githubLink, }) {
    const publisherNameLink = githubLink ? `[${publisherId}](${githubLink})` : publisherId;
    const warningMsg = `This extension is in preview and is built by a developer in the [Extensions Publisher Early Access Program](http://bit.ly/firex-provider). Its functionality might change in backward-incompatible ways. Since this extension isn't built by Firebase, reach out to ${publisherNameLink} with questions about this extension.`;
    const legalMsg = "\n\nIt is provided “AS IS”, without any warranty, express or implied, from Google. Google disclaims all liability for any damages, direct or indirect, resulting from the use of the extension, and its functionality might change in backward - incompatible ways.";
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, (0, marked_1.marked)(warningMsg + legalMsg));
    (0, displayExtensionInfo_1.printSourceDownloadLink)(sourceDownloadUri);
}
function displayExperimentalWarning() {
    utils.logLabeledBullet(extensionsHelper_1.logPrefix, (0, marked_1.marked)(`${clc.yellow(clc.bold("Important"))}: This extension is ${clc.bold("experimental")} and may not be production-ready. Its functionality might change in backward-incompatible ways before its official release, or it may be discontinued.`));
}
async function displayWarningPrompts(publisherId, launchStage, extensionVersion) {
    const trustedPublishers = await (0, resolveSource_1.getTrustedPublishers)();
    if (!trustedPublishers.includes(publisherId)) {
        displayEAPWarning({
            publisherId,
            sourceDownloadUri: extensionVersion.sourceDownloadUri,
            githubLink: extensionVersion.spec.sourceUrl,
        });
    }
    else if (launchStage === types_1.RegistryLaunchStage.EXPERIMENTAL) {
        displayExperimentalWarning();
    }
    else {
        return;
    }
}
exports.displayWarningPrompts = displayWarningPrompts;
const toListEntry = (i) => {
    var _a, _b, _c, _d;
    const idAndRef = (0, deploymentSummary_1.humanReadable)(i);
    const sourceCodeLink = `\n\t[Source Code](${(_a = i.extensionVersion) === null || _a === void 0 ? void 0 : _a.sourceDownloadUri})`;
    const githubLink = ((_c = (_b = i.extensionVersion) === null || _b === void 0 ? void 0 : _b.spec) === null || _c === void 0 ? void 0 : _c.sourceUrl)
        ? `\n\t[Publisher Contact](${(_d = i.extensionVersion) === null || _d === void 0 ? void 0 : _d.spec.sourceUrl})`
        : "";
    return `${idAndRef}${sourceCodeLink}${githubLink}`;
};
async function displayWarningsForDeploy(instancesToCreate) {
    const trustedPublishers = await (0, resolveSource_1.getTrustedPublishers)();
    const publishedExtensionInstances = instancesToCreate.filter((i) => i.ref);
    for (const i of publishedExtensionInstances) {
        await (0, planner_1.getExtension)(i);
    }
    const [eapExtensions, nonEapExtensions] = (0, functional_1.partition)(publishedExtensionInstances, (i) => { var _a, _b; return !trustedPublishers.includes((_b = (_a = i.ref) === null || _a === void 0 ? void 0 : _a.publisherId) !== null && _b !== void 0 ? _b : ""); });
    const experimental = nonEapExtensions.filter((i) => i.extension.registryLaunchStage === types_1.RegistryLaunchStage.EXPERIMENTAL);
    if (experimental.length) {
        const humanReadableList = experimental.map((i) => `\t${(0, deploymentSummary_1.humanReadable)(i)}`).join("\n");
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, (0, marked_1.marked)(`The following are instances of ${clc.bold("experimental")} extensions.They may not be production-ready. Their functionality may change in backward-incompatible ways before their official release, or they may be discontinued.\n${humanReadableList}\n`, { gfm: false }));
    }
    if (eapExtensions.length) {
        const humanReadableList = eapExtensions.map(toListEntry).join("\n");
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, (0, marked_1.marked)(`These extensions are in preview and are built by a developer in the Extensions Publisher Early Access Program (http://bit.ly/firex-provider). Their functionality might change in backwards-incompatible ways. Since these extensions aren't built by Firebase, reach out to their publisher with questions about them.` +
            ` They are provided “AS IS”, without any warranty, express or implied, from Google.` +
            ` Google disclaims all liability for any damages, direct or indirect, resulting from the use of these extensions\n${humanReadableList}`, { gfm: false }));
    }
    return experimental.length > 0 || eapExtensions.length > 0;
}
exports.displayWarningsForDeploy = displayWarningsForDeploy;
function outOfBandChangesWarning(instanceIds) {
    logger_1.logger.warn("The following instances may have been changed in the Firebase console or by another machine since the last deploy from this machine.\n\t" +
        clc.bold(instanceIds.join("\n\t")) +
        "\nIf you proceed with this deployment, those changes will be overwritten. To avoid this, run `firebase ext:export` to sync these changes to your local extensions manifest.");
}
exports.outOfBandChangesWarning = outOfBandChangesWarning;
