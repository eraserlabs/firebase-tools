"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushToDisk = exports.assertEnabled = exports.enableExperimentsFromCliEnvVariable = exports.setEnabled = exports.isEnabled = exports.experimentNameAutocorrect = exports.isValidExperiment = exports.ALL_EXPERIMENTS = void 0;
const colorette_1 = require("colorette");
const leven = require("leven");
const configstore_1 = require("./configstore");
const error_1 = require("./error");
function experiments(exp) {
    return Object.freeze(exp);
}
exports.ALL_EXPERIMENTS = experiments({
    experiments: {
        shortDescription: "enables the experiments family of commands",
    },
    rtdbrules: {
        shortDescription: "Advanced security rules management",
    },
    rtdbmanagement: {
        shortDescription: "Use new endpoint to administer realtime database instances",
    },
    ext: {
        shortDescription: `Enables the ${(0, colorette_1.bold)("ext:sources:create")} command`,
    },
    extdev: {
        shortDescription: `Enables the ${(0, colorette_1.bold)("ext:dev")} family of commands`,
        docsUri: "https://firebase.google.com/docs/extensions/alpha/overview-build-extensions",
    },
    pythonfunctions: {
        shortDescription: "Python support for Cloud Functions for Firebase",
        fullDescription: "Adds the ability to initializea and deploy Cloud " +
            "Functions for Firebase in Python. While this feature is experimental " +
            "breaking API changes are allowed in MINOR API revisions",
    },
    deletegcfartifacts: {
        shortDescription: `Add the ${(0, colorette_1.bold)("functions:deletegcfartifacts")} command to purge docker build images`,
        fullDescription: `Add the ${(0, colorette_1.bold)("functions:deletegcfartifacts")}` +
            "command. Google Cloud Functions creates Docker images when building your " +
            "functions. Cloud Functions for Firebase automatically cleans up these " +
            "images for you on deploy. Customers who predated this cleanup, or customers " +
            "who also deploy Google Cloud Functions with non-Firebase tooling may have " +
            "old Docker images stored in either Google Container Repository or Artifact " +
            `Registry. The ${(0, colorette_1.bold)("functions:deletegcfartifacts")} command ` +
            "will delete all Docker images created by Google Cloud Functions irrespective " +
            "of how that image was created.",
        public: true,
    },
    functionsparams: {
        shortDescription: "Adds support for paramaterizing functions deployments",
        default: true,
    },
    emulatoruisnapshot: {
        shortDescription: "Load pre-release versions of the emulator UI",
    },
    webframeworks: {
        shortDescription: "Native support for popular web frameworks",
        fullDescription: "Adds support for popular web frameworks such as Next.js " +
            "Angular, React, Svelte, and Vite-compatible frameworks. Firebase is " +
            "committed to support these platforms long-term, but a manual migration " +
            "may be required when the non-experimental support for these frameworks " +
            "is released",
        docsUri: "https://firebase.google.com/docs/hosting/frameworks-overview",
        public: true,
    },
    pintags: {
        shortDescription: "Adds the pinTag option to Run and Functions rewrites",
        fullDescription: "Adds support for the 'pinTag' boolean on Runction and Run rewrites for " +
            "Firebase Hosting. With this option, newly released hosting sites will be " +
            "bound to the current latest version of their referenced functions or services. " +
            "This option depends on Run pinned traffic targets, of which only 2000 can " +
            "exist per region. firebase-tools aggressively garbage collects tags it creates " +
            "if any service exceeds 500 tags, but it is theoretically possible that a project " +
            "exceeds the region-wide limit of tags and an old site version fails",
    },
    crossservicerules: {
        shortDescription: "Allow Firebase Rules to reference resources in other services",
    },
    internaltesting: {
        shortDescription: "Exposes Firebase CLI commands intended for internal testing purposes.",
        fullDescription: "Exposes Firebase CLI commands intended for internal testing purposes. " +
            "These commands are not meant for public consumption and may break or disappear " +
            "without a notice.",
    },
});
function isValidExperiment(name) {
    return Object.keys(exports.ALL_EXPERIMENTS).includes(name);
}
exports.isValidExperiment = isValidExperiment;
function experimentNameAutocorrect(malformed) {
    if (isValidExperiment(malformed)) {
        throw new error_1.FirebaseError("Assertion failed: experimentNameAutocorrect given actual experiment name", { exit: 2 });
    }
    return Object.keys(exports.ALL_EXPERIMENTS).filter((name) => leven(name, malformed) < malformed.length * 0.4);
}
exports.experimentNameAutocorrect = experimentNameAutocorrect;
let localPreferencesCache = undefined;
function localPreferences() {
    if (!localPreferencesCache) {
        localPreferencesCache = (configstore_1.configstore.get("previews") || {});
        for (const key of Object.keys(localPreferencesCache)) {
            if (!isValidExperiment(key)) {
                delete localPreferencesCache[key];
            }
        }
    }
    return localPreferencesCache;
}
function isEnabled(name) {
    var _a, _b, _c;
    return (_c = (_a = localPreferences()[name]) !== null && _a !== void 0 ? _a : (_b = exports.ALL_EXPERIMENTS[name]) === null || _b === void 0 ? void 0 : _b.default) !== null && _c !== void 0 ? _c : false;
}
exports.isEnabled = isEnabled;
function setEnabled(name, to) {
    if (to === null) {
        delete localPreferences()[name];
    }
    else {
        localPreferences()[name] = to;
    }
}
exports.setEnabled = setEnabled;
function enableExperimentsFromCliEnvVariable() {
    const experiments = process.env.FIREBASE_CLI_EXPERIMENTS || "";
    for (const experiment of experiments.split(",")) {
        if (isValidExperiment(experiment)) {
            setEnabled(experiment, true);
        }
    }
}
exports.enableExperimentsFromCliEnvVariable = enableExperimentsFromCliEnvVariable;
function assertEnabled(name, task) {
    if (!isEnabled(name)) {
        throw new error_1.FirebaseError(`Cannot ${task} because the experiment ${(0, colorette_1.bold)(name)} is not enabled. To enable ${(0, colorette_1.bold)(name)} run ${(0, colorette_1.bold)(`firebase experiments:enable ${name}`)}`);
    }
}
exports.assertEnabled = assertEnabled;
function flushToDisk() {
    configstore_1.configstore.set("previews", localPreferences());
}
exports.flushToDisk = flushToDisk;
