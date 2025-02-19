"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const clc = require("colorette");
const marked_1 = require("marked");
const TerminalRenderer = require("marked-terminal");
const command_1 = require("../command");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const refs = require("../extensions/refs");
const localHelper_1 = require("../extensions/localHelper");
const publishHelpers_1 = require("../extensions/publishHelpers");
const requireAuth_1 = require("../requireAuth");
const error_1 = require("../error");
const utils = require("../utils");
marked_1.marked.setOptions({
    renderer: new TerminalRenderer(),
});
exports.command = new command_1.Command("ext:dev:publish <extensionRef>")
    .description(`publish a new version of an extension`)
    .option(`-s, --stage <stage>`, `release stage (supports "rc", "alpha", "beta", and "stable")`)
    .withForce()
    .help("if you have not previously published a version of this extension, this will " +
    "create the extension. If you have previously published a version of this extension, this version must " +
    "be greater than previous versions.")
    .before(requireAuth_1.requireAuth)
    .action(async (extensionRef, options) => {
    var _a;
    const { publisherId, extensionId, version } = refs.parse(extensionRef);
    if (version) {
        throw new error_1.FirebaseError(`The input extension reference must be of the format ${clc.bold("<publisherId>/<extensionId>")}. Version should not be supplied and will be inferred directly from extension.yaml. Please increment the version in extension.yaml if you would like to bump/specify a version.`);
    }
    if (!publisherId || !extensionId) {
        throw new error_1.FirebaseError(`Error parsing publisher ID and extension ID from extension reference '${clc.bold(extensionRef)}'. Please use the format '${clc.bold("<publisherId>/<extensionId>")}'.`);
    }
    const extensionYamlDirectory = (0, localHelper_1.findExtensionYaml)(process.cwd());
    const res = await (0, extensionsHelper_1.publishExtensionVersionFromLocalSource)({
        publisherId,
        extensionId,
        rootDirectory: extensionYamlDirectory,
        nonInteractive: options.nonInteractive,
        force: options.force,
        stage: (_a = options.stage) !== null && _a !== void 0 ? _a : "stable",
    });
    if (res) {
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, (0, marked_1.marked)(`[Install Link](${(0, publishHelpers_1.consoleInstallLink)(res.ref)})`));
    }
    return res;
});
