"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const clc = require("colorette");
const marked_1 = require("marked");
const TerminalRenderer = require("marked-terminal");
const displayExtensionInfo_1 = require("../extensions/displayExtensionInfo");
const askUserForEventsConfig = require("../extensions/askUserForEventsConfig");
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
const command_1 = require("../command");
const error_1 = require("../error");
const projectUtils_1 = require("../projectUtils");
const extensionsApi = require("../extensions/extensionsApi");
const refs = require("../extensions/refs");
const warnings_1 = require("../extensions/warnings");
const paramHelper = require("../extensions/paramHelper");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const utils_1 = require("../extensions/utils");
const requirePermissions_1 = require("../requirePermissions");
const utils = require("../utils");
const track_1 = require("../track");
const experiments = require("../experiments");
const manifest = require("../extensions/manifest");
marked_1.marked.setOptions({
    renderer: new TerminalRenderer(),
});
exports.command = new command_1.Command("ext:install [extensionName]")
    .description("install an official extension if [extensionName] or [extensionName@version] is provided; " +
    (experiments.isEnabled("extdev")
        ? "install a local extension if [localPathOrUrl] or [url#root] is provided; install a published extension (not authored by Firebase) if [publisherId/extensionId] is provided "
        : "") +
    "or run with `-i` to see all available extensions.")
    .option("--local", "deprecated")
    .withForce()
    .before(requirePermissions_1.requirePermissions, ["firebaseextensions.instances.create"])
    .before(extensionsHelper_1.ensureExtensionsApiEnabled)
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extMinVersion")
    .before(extensionsHelper_1.diagnoseAndFixProject)
    .action(async (extensionName, options) => {
    var _a;
    const projectId = (0, projectUtils_1.getProjectId)(options);
    const paramsEnvPath = "";
    let learnMore = false;
    if (!extensionName) {
        if (options.interactive) {
            learnMore = true;
            extensionName = await (0, extensionsHelper_1.promptForOfficialExtension)("Which official extension do you wish to install?\n" +
                "  Select an extension, then press Enter to learn more.");
        }
        else {
            throw new error_1.FirebaseError(`Unable to find published extension '${clc.bold(extensionName)}'. ` +
                `Run ${clc.bold("firebase ext:install -i")} to select from the list of all available published extensions.`);
        }
    }
    let source;
    let extensionVersion;
    if ((0, extensionsHelper_1.isUrlPath)(extensionName)) {
        throw new error_1.FirebaseError(`Installing with a source url is no longer supported in the CLI. Please use Firebase Console instead.`);
    }
    if (options.local) {
        utils.logLabeledWarning(extensionsHelper_1.logPrefix, "As of firebase-tools@11.0.0, the `--local` flag is no longer required, as it is the default behavior.");
    }
    if ((0, extensionsHelper_1.isLocalPath)(extensionName)) {
        source = await (0, extensionsHelper_1.createSourceFromLocation)((0, projectUtils_1.needProjectId)({ projectId }), extensionName);
        await (0, displayExtensionInfo_1.displayExtInfo)(extensionName, "", source.spec);
        void (0, track_1.track)("Extension Install", "Install by Source", options.interactive ? 1 : 0);
    }
    else {
        void (0, track_1.track)("Extension Install", "Install by Extension Ref", options.interactive ? 1 : 0);
        extensionName = await (0, extensionsHelper_1.canonicalizeRefInput)(extensionName);
        extensionVersion = await extensionsApi.getExtensionVersion(extensionName);
        await infoExtensionVersion({
            extensionName,
            extensionVersion,
        });
    }
    if (!(await (0, extensionsHelper_1.confirm)({
        nonInteractive: options.nonInteractive,
        force: options.force,
        default: true,
    }))) {
        return;
    }
    if (!source && !extensionVersion) {
        throw new error_1.FirebaseError("Could not find a source. Please specify a valid source to continue.");
    }
    const spec = (_a = source === null || source === void 0 ? void 0 : source.spec) !== null && _a !== void 0 ? _a : extensionVersion === null || extensionVersion === void 0 ? void 0 : extensionVersion.spec;
    if (!spec) {
        throw new error_1.FirebaseError(`Could not find the extension.yaml for extension '${clc.bold(extensionName)}'. Please make sure this is a valid extension and try again.`);
    }
    if (learnMore) {
        utils.logLabeledBullet(extensionsHelper_1.logPrefix, `You selected: ${clc.bold(spec.displayName || "")}.\n` +
            `${spec.description}\n` +
            `View details: https://firebase.google.com/products/extensions/${spec.name}\n`);
    }
    try {
        return installToManifest({
            paramsEnvPath,
            projectId,
            extensionName,
            source,
            extVersion: extensionVersion,
            nonInteractive: options.nonInteractive,
            force: options.force,
        });
    }
    catch (err) {
        if (!(err instanceof error_1.FirebaseError)) {
            throw new error_1.FirebaseError(`Error occurred saving the extension to manifest: ${err.message}`, {
                original: err,
            });
        }
        throw err;
    }
});
async function infoExtensionVersion(args) {
    const ref = refs.parse(args.extensionName);
    const extension = await extensionsApi.getExtension(refs.toExtensionRef(ref));
    await (0, displayExtensionInfo_1.displayExtInfo)(args.extensionName, ref.publisherId, args.extensionVersion.spec, true);
    await (0, warnings_1.displayWarningPrompts)(ref.publisherId, extension.registryLaunchStage, args.extensionVersion);
}
async function installToManifest(options) {
    var _a, _b;
    const { projectId, extensionName, extVersion, source, paramsEnvPath, nonInteractive, force } = options;
    const isLocalSource = (0, extensionsHelper_1.isLocalPath)(extensionName);
    const spec = (_a = extVersion === null || extVersion === void 0 ? void 0 : extVersion.spec) !== null && _a !== void 0 ? _a : source === null || source === void 0 ? void 0 : source.spec;
    if (!spec) {
        throw new error_1.FirebaseError(`Could not find the extension.yaml for ${extensionName}. Please make sure this is a valid extension and try again.`);
    }
    const config = manifest.loadConfig(options);
    let instanceId = spec.name;
    while (manifest.instanceExists(instanceId, config)) {
        instanceId = await (0, extensionsHelper_1.promptForValidInstanceId)(`${spec.name}-${(0, utils_1.getRandomString)(4)}`);
    }
    const paramBindingOptions = await paramHelper.getParams({
        projectId,
        paramSpecs: spec.params.concat((_b = spec.systemParams) !== null && _b !== void 0 ? _b : []),
        nonInteractive,
        paramsEnvPath,
        instanceId,
    });
    const eventsConfig = spec.events
        ? await askUserForEventsConfig.askForEventsConfig(spec.events, "${param:PROJECT_ID}", instanceId)
        : undefined;
    if (eventsConfig) {
        paramBindingOptions.EVENTARC_CHANNEL = { baseValue: eventsConfig.channel };
        paramBindingOptions.ALLOWED_EVENT_TYPES = {
            baseValue: eventsConfig.allowedEventTypes.join(","),
        };
    }
    const ref = extVersion ? refs.parse(extVersion.ref) : undefined;
    await manifest.writeToManifest([
        {
            instanceId,
            ref: !isLocalSource ? ref : undefined,
            localPath: isLocalSource ? extensionName : undefined,
            params: paramBindingOptions,
            extensionSpec: spec,
        },
    ], config, { nonInteractive, force: force !== null && force !== void 0 ? force : false });
    manifest.showPostDeprecationNotice();
}
