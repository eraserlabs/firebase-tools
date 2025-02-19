"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuntimeChoice = exports.DEPRECATED_NODE_VERSION_INFO = exports.UNSUPPORTED_NODE_VERSION_PACKAGE_JSON_MSG = exports.UNSUPPORTED_NODE_VERSION_FIREBASE_JSON_MSG = exports.RUNTIME_NOT_SET = void 0;
const path = require("path");
const clc = require("colorette");
const error_1 = require("../../../../error");
const track_1 = require("../../../../track");
const runtimes = require("../../runtimes");
const cjson = require("cjson");
const ENGINE_RUNTIMES = {
    6: "nodejs6",
    8: "nodejs8",
    10: "nodejs10",
    12: "nodejs12",
    14: "nodejs14",
    16: "nodejs16",
    18: "nodejs18",
};
const ENGINE_RUNTIMES_NAMES = Object.values(ENGINE_RUNTIMES);
exports.RUNTIME_NOT_SET = "`runtime` field is required but was not found in firebase.json.\n" +
    "To fix this, add the following lines to the `functions` section of your firebase.json:\n" +
    '"runtime": "nodejs16"\n';
exports.UNSUPPORTED_NODE_VERSION_FIREBASE_JSON_MSG = clc.bold(`functions.runtime value is unsupported. ` +
    `Valid choices are: ${clc.bold("nodejs{10|12|14|16}")}.`);
exports.UNSUPPORTED_NODE_VERSION_PACKAGE_JSON_MSG = clc.bold(`package.json in functions directory has an engines field which is unsupported. ` +
    `Valid choices are: ${clc.bold('{"node": 10|12|14|16}')}`);
exports.DEPRECATED_NODE_VERSION_INFO = `\n\nDeploys to runtimes below Node.js 10 are now disabled in the Firebase CLI. ` +
    `${clc.bold(`Existing Node.js 8 functions ${clc.underline("will stop executing at a future date")}`)}. Update existing functions to Node.js 10 or greater as soon as possible.`;
function getRuntimeChoiceFromPackageJson(sourceDir) {
    const packageJsonPath = path.join(sourceDir, "package.json");
    let loaded;
    try {
        loaded = cjson.load(packageJsonPath);
    }
    catch (err) {
        throw new error_1.FirebaseError(`Unable to load ${packageJsonPath}: ${err}`);
    }
    const engines = loaded.engines;
    if (!engines || !engines.node) {
        throw new error_1.FirebaseError(exports.RUNTIME_NOT_SET);
    }
    return ENGINE_RUNTIMES[engines.node];
}
function getRuntimeChoice(sourceDir, runtimeFromConfig) {
    const runtime = runtimeFromConfig || getRuntimeChoiceFromPackageJson(sourceDir);
    const errorMessage = (runtimeFromConfig
        ? exports.UNSUPPORTED_NODE_VERSION_FIREBASE_JSON_MSG
        : exports.UNSUPPORTED_NODE_VERSION_PACKAGE_JSON_MSG) + exports.DEPRECATED_NODE_VERSION_INFO;
    if (!runtime || !ENGINE_RUNTIMES_NAMES.includes(runtime)) {
        void (0, track_1.track)("functions_runtime_notices", "package_missing_runtime");
        throw new error_1.FirebaseError(errorMessage, { exit: 1 });
    }
    if (runtimes.isDeprecatedRuntime(runtime) || !runtimes.isValidRuntime(runtime)) {
        void (0, track_1.track)("functions_runtime_notices", `${runtime}_deploy_prohibited`);
        throw new error_1.FirebaseError(errorMessage, { exit: 1 });
    }
    return runtime;
}
exports.getRuntimeChoice = getRuntimeChoice;
