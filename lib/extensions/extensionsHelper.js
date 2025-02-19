"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canonicalizeRefInput = exports.diagnoseAndFixProject = exports.confirm = exports.getSourceOrigin = exports.isLocalOrURLPath = exports.isLocalPath = exports.isUrlPath = exports.instanceIdExists = exports.promptForRepeatInstance = exports.promptForOfficialExtension = exports.displayReleaseNotes = exports.getPublisherProjectFromName = exports.createSourceFromLocation = exports.publishExtensionVersionFromLocalSource = exports.incrementPrereleaseVersion = exports.ensureExtensionsApiEnabled = exports.promptForValidInstanceId = exports.validateSpec = exports.validateCommandLineParams = exports.populateDefaultParams = exports.substituteParams = exports.getFirebaseProjectParams = exports.getDBInstanceFromURL = exports.AUTOPOULATED_PARAM_PLACEHOLDERS = exports.EXTENSIONS_BUCKET_NAME = exports.URL_REGEX = exports.logPrefix = exports.SourceOrigin = exports.SpecParamType = void 0;
const clc = require("colorette");
const ora = require("ora");
const semver = require("semver");
const marked_1 = require("marked");
const TerminalRenderer = require("marked-terminal");
marked_1.marked.setOptions({
    renderer: new TerminalRenderer(),
});
const api_1 = require("../api");
const archiveDirectory_1 = require("../archiveDirectory");
const utils_1 = require("./utils");
const functionsConfig_1 = require("../functionsConfig");
const adminSdkConfig_1 = require("../emulator/adminSdkConfig");
const resolveSource_1 = require("./resolveSource");
const error_1 = require("../error");
const diagnose_1 = require("./diagnose");
const askUserForParam_1 = require("./askUserForParam");
const ensureApiEnabled_1 = require("../ensureApiEnabled");
const storage_1 = require("../gcp/storage");
const projectUtils_1 = require("../projectUtils");
const extensionsApi_1 = require("./extensionsApi");
const refs = require("./refs");
const localHelper_1 = require("./localHelper");
const prompt_1 = require("../prompt");
const logger_1 = require("../logger");
const utils_2 = require("../utils");
const change_log_1 = require("./change-log");
const getProjectNumber_1 = require("../getProjectNumber");
const constants_1 = require("../emulator/constants");
const planner_1 = require("../deploy/extensions/planner");
var SpecParamType;
(function (SpecParamType) {
    SpecParamType["SELECT"] = "select";
    SpecParamType["MULTISELECT"] = "multiSelect";
    SpecParamType["STRING"] = "string";
    SpecParamType["SELECTRESOURCE"] = "selectResource";
    SpecParamType["SECRET"] = "secret";
})(SpecParamType = exports.SpecParamType || (exports.SpecParamType = {}));
var SourceOrigin;
(function (SourceOrigin) {
    SourceOrigin["OFFICIAL_EXTENSION"] = "official extension";
    SourceOrigin["LOCAL"] = "unpublished extension (local source)";
    SourceOrigin["PUBLISHED_EXTENSION"] = "published extension";
    SourceOrigin["PUBLISHED_EXTENSION_VERSION"] = "specific version of a published extension";
    SourceOrigin["URL"] = "unpublished extension (URL source)";
    SourceOrigin["OFFICIAL_EXTENSION_VERSION"] = "specific version of an official extension";
})(SourceOrigin = exports.SourceOrigin || (exports.SourceOrigin = {}));
exports.logPrefix = "extensions";
const VALID_LICENSES = ["apache-2.0"];
exports.URL_REGEX = /^https:/;
exports.EXTENSIONS_BUCKET_NAME = (0, utils_2.envOverride)("FIREBASE_EXTENSIONS_UPLOAD_BUCKET", "firebase-ext-eap-uploads");
const AUTOPOPULATED_PARAM_NAMES = [
    "PROJECT_ID",
    "STORAGE_BUCKET",
    "EXT_INSTANCE_ID",
    "DATABASE_INSTANCE",
    "DATABASE_URL",
];
exports.AUTOPOULATED_PARAM_PLACEHOLDERS = {
    PROJECT_ID: "project-id",
    STORAGE_BUCKET: "project-id.appspot.com",
    EXT_INSTANCE_ID: "extension-id",
    DATABASE_INSTANCE: "project-id-default-rtdb",
    DATABASE_URL: "https://project-id-default-rtdb.firebaseio.com",
};
function getDBInstanceFromURL(databaseUrl = "") {
    const instanceRegex = new RegExp("(?:https://)(.*)(?:.firebaseio.com)");
    const matches = instanceRegex.exec(databaseUrl);
    if (matches && matches.length > 1) {
        return matches[1];
    }
    return "";
}
exports.getDBInstanceFromURL = getDBInstanceFromURL;
async function getFirebaseProjectParams(projectId, emulatorMode = false) {
    var _a, _b;
    if (!projectId) {
        return {};
    }
    const body = emulatorMode
        ? await (0, adminSdkConfig_1.getProjectAdminSdkConfigOrCached)(projectId)
        : await (0, functionsConfig_1.getFirebaseConfig)({ project: projectId });
    const projectNumber = emulatorMode && constants_1.Constants.isDemoProject(projectId)
        ? constants_1.Constants.FAKE_PROJECT_NUMBER
        : await (0, getProjectNumber_1.getProjectNumber)({ projectId });
    const databaseURL = (_a = body === null || body === void 0 ? void 0 : body.databaseURL) !== null && _a !== void 0 ? _a : `https://${projectId}.firebaseio.com`;
    const storageBucket = (_b = body === null || body === void 0 ? void 0 : body.storageBucket) !== null && _b !== void 0 ? _b : `${projectId}.appspot.com`;
    const FIREBASE_CONFIG = JSON.stringify({
        projectId,
        databaseURL,
        storageBucket,
    });
    return {
        PROJECT_ID: projectId,
        PROJECT_NUMBER: projectNumber,
        DATABASE_URL: databaseURL,
        STORAGE_BUCKET: storageBucket,
        FIREBASE_CONFIG,
        DATABASE_INSTANCE: getDBInstanceFromURL(databaseURL),
    };
}
exports.getFirebaseProjectParams = getFirebaseProjectParams;
function substituteParams(original, params) {
    const startingString = JSON.stringify(original);
    const applySubstitution = (str, paramVal, paramKey) => {
        const exp1 = new RegExp("\\$\\{" + paramKey + "\\}", "g");
        const exp2 = new RegExp("\\$\\{param:" + paramKey + "\\}", "g");
        const regexes = [exp1, exp2];
        const substituteRegexMatches = (unsubstituted, regex) => {
            return unsubstituted.replace(regex, paramVal);
        };
        return regexes.reduce(substituteRegexMatches, str);
    };
    const s = Object.entries(params).reduce((str, [key, val]) => applySubstitution(str, val, key), startingString);
    return JSON.parse(s);
}
exports.substituteParams = substituteParams;
function populateDefaultParams(paramVars, paramSpecs) {
    const newParams = paramVars;
    for (const param of paramSpecs) {
        if (!paramVars[param.param]) {
            if (param.default !== undefined && param.required) {
                newParams[param.param] = param.default;
            }
            else if (param.required) {
                throw new error_1.FirebaseError(`${param.param} has not been set in the given params file` +
                    " and there is no default available. Please set this variable before installing again.");
            }
        }
    }
    return newParams;
}
exports.populateDefaultParams = populateDefaultParams;
function validateCommandLineParams(envVars, paramSpec) {
    const paramNames = paramSpec.map((p) => p.param);
    const misnamedParams = Object.keys(envVars).filter((key) => {
        return !paramNames.includes(key) && !AUTOPOPULATED_PARAM_NAMES.includes(key);
    });
    if (misnamedParams.length) {
        logger_1.logger.warn("Warning: The following params were specified in your env file but do not exist in the extension spec: " +
            `${misnamedParams.join(", ")}.`);
    }
    let allParamsValid = true;
    for (const param of paramSpec) {
        if (!(0, askUserForParam_1.checkResponse)(envVars[param.param], param)) {
            allParamsValid = false;
        }
    }
    if (!allParamsValid) {
        throw new error_1.FirebaseError(`Some param values are not valid. Please check your params file.`);
    }
}
exports.validateCommandLineParams = validateCommandLineParams;
function validateSpec(spec) {
    const errors = [];
    if (!spec.name) {
        errors.push("extension.yaml is missing required field: name");
    }
    if (!spec.specVersion) {
        errors.push("extension.yaml is missing required field: specVersion");
    }
    if (!spec.version) {
        errors.push("extension.yaml is missing required field: version");
    }
    if (!spec.license) {
        errors.push("extension.yaml is missing required field: license");
    }
    else {
        const formattedLicense = String(spec.license).toLocaleLowerCase();
        if (!VALID_LICENSES.includes(formattedLicense)) {
            errors.push(`license field in extension.yaml is invalid. Valid value(s): ${VALID_LICENSES.join(", ")}`);
        }
    }
    if (!spec.resources) {
        errors.push("Resources field must contain at least one resource");
    }
    else {
        for (const resource of spec.resources) {
            if (!resource.name) {
                errors.push("Resource is missing required field: name");
            }
            if (!resource.type) {
                errors.push(`Resource${resource.name ? ` ${resource.name}` : ""} is missing required field: type`);
            }
        }
    }
    for (const api of spec.apis || []) {
        if (!api.apiName) {
            errors.push("API is missing required field: apiName");
        }
    }
    for (const role of spec.roles || []) {
        if (!role.role) {
            errors.push("Role is missing required field: role");
        }
    }
    for (const param of spec.params || []) {
        if (!param.param) {
            errors.push("Param is missing required field: param");
        }
        if (!param.label) {
            errors.push(`Param${param.param ? ` ${param.param}` : ""} is missing required field: label`);
        }
        if (param.type && !Object.values(SpecParamType).includes(param.type)) {
            errors.push(`Invalid type ${param.type} for param${param.param ? ` ${param.param}` : ""}. Valid types are ${Object.values(SpecParamType).join(", ")}`);
        }
        if (!param.type || param.type === SpecParamType.STRING) {
            if (param.options) {
                errors.push(`Param${param.param ? ` ${param.param}` : ""} cannot have options because it is type STRING`);
            }
        }
        if (param.type &&
            (param.type === SpecParamType.SELECT || param.type === SpecParamType.MULTISELECT)) {
            if (param.validationRegex) {
                errors.push(`Param${param.param ? ` ${param.param}` : ""} cannot have validationRegex because it is type ${param.type}`);
            }
            if (!param.options) {
                errors.push(`Param${param.param ? ` ${param.param}` : ""} requires options because it is type ${param.type}`);
            }
            for (const opt of param.options || []) {
                if (opt.value === undefined) {
                    errors.push(`Option for param${param.param ? ` ${param.param}` : ""} is missing required field: value`);
                }
            }
        }
        if (param.type && param.type === SpecParamType.SELECTRESOURCE) {
            if (!param.resourceType) {
                errors.push(`Param${param.param ? ` ${param.param}` : ""} must have resourceType because it is type ${param.type}`);
            }
        }
    }
    if (errors.length) {
        const formatted = errors.map((error) => `  - ${error}`);
        const message = `The extension.yaml has the following errors: \n${formatted.join("\n")}`;
        throw new error_1.FirebaseError(message);
    }
}
exports.validateSpec = validateSpec;
async function promptForValidInstanceId(instanceId) {
    let instanceIdIsValid = false;
    let newInstanceId = "";
    const instanceIdRegex = /^[a-z][a-z\d\-]*[a-z\d]$/;
    while (!instanceIdIsValid) {
        newInstanceId = await (0, prompt_1.promptOnce)({
            type: "input",
            default: instanceId,
            message: `Please enter a new name for this instance:`,
        });
        if (newInstanceId.length <= 6 || 45 <= newInstanceId.length) {
            logger_1.logger.info("Invalid instance ID. Instance ID must be between 6 and 45 characters.");
        }
        else if (!instanceIdRegex.test(newInstanceId)) {
            logger_1.logger.info("Invalid instance ID. Instance ID must start with a lowercase letter, " +
                "end with a lowercase letter or number, and only contain lowercase letters, numbers, or -");
        }
        else {
            instanceIdIsValid = true;
        }
    }
    return newInstanceId;
}
exports.promptForValidInstanceId = promptForValidInstanceId;
async function ensureExtensionsApiEnabled(options) {
    const projectId = (0, projectUtils_1.getProjectId)(options);
    if (!projectId) {
        return;
    }
    return await (0, ensureApiEnabled_1.ensure)(projectId, "firebaseextensions.googleapis.com", "extensions", options.markdown);
}
exports.ensureExtensionsApiEnabled = ensureExtensionsApiEnabled;
async function archiveAndUploadSource(extPath, bucketName) {
    const zippedSource = await (0, archiveDirectory_1.archiveDirectory)(extPath, {
        type: "zip",
        ignore: ["node_modules", ".git"],
    });
    const res = await (0, storage_1.uploadObject)(zippedSource, bucketName);
    return `/${res.bucket}/${res.object}`;
}
async function incrementPrereleaseVersion(ref, extensionVersion, stage) {
    var _a;
    const stageOptions = ["stable", "alpha", "beta", "rc"];
    if (!stageOptions.includes(stage)) {
        throw new error_1.FirebaseError(`--stage flag only supports the following values: ${stageOptions}`);
    }
    if (stage !== "stable") {
        const version = semver.parse(extensionVersion);
        if (version.prerelease.length > 0 || version.build.length > 0) {
            throw new error_1.FirebaseError(`Cannot combine the --stage flag with a version with a prerelease annotation in extension.yaml.`);
        }
        let extensionVersions = [];
        try {
            extensionVersions = await (0, extensionsApi_1.listExtensionVersions)(ref, `id="${version.version}"`, true);
        }
        catch (e) {
        }
        const latestVersion = (_a = extensionVersions
            .map((version) => semver.parse(version.spec.version))
            .filter((version) => version.prerelease.length > 0 && version.prerelease[0] === stage)
            .sort((v1, v2) => semver.compare(v1, v2))
            .pop()) !== null && _a !== void 0 ? _a : `${version}-${stage}`;
        return semver.inc(latestVersion, "prerelease", undefined, stage);
    }
    return extensionVersion;
}
exports.incrementPrereleaseVersion = incrementPrereleaseVersion;
async function publishExtensionVersionFromLocalSource(args) {
    const extensionSpec = await (0, localHelper_1.getLocalExtensionSpec)(args.rootDirectory);
    if (extensionSpec.name !== args.extensionId) {
        throw new error_1.FirebaseError(`Extension ID '${clc.bold(args.extensionId)}' does not match the name in extension.yaml '${clc.bold(extensionSpec.name)}'.`);
    }
    const subbedSpec = JSON.parse(JSON.stringify(extensionSpec));
    subbedSpec.params = substituteParams(extensionSpec.params || [], exports.AUTOPOULATED_PARAM_PLACEHOLDERS);
    validateSpec(subbedSpec);
    extensionSpec.version = await incrementPrereleaseVersion(`${args.publisherId}/${args.extensionId}`, extensionSpec.version, args.stage);
    let extension;
    try {
        extension = await (0, extensionsApi_1.getExtension)(`${args.publisherId}/${args.extensionId}`);
    }
    catch (err) {
    }
    let notes;
    try {
        const changes = (0, change_log_1.getLocalChangelog)(args.rootDirectory);
        notes = changes[extensionSpec.version];
    }
    catch (err) {
        throw new error_1.FirebaseError("No CHANGELOG.md file found. " +
            "Please create one and add an entry for this version. " +
            (0, marked_1.marked)("See https://firebase.google.com/docs/extensions/alpha/create-user-docs#writing-changelog for more details."));
    }
    if (!notes && !semver.prerelease(extensionSpec.version) && extension) {
        throw new error_1.FirebaseError(`No entry for version ${extensionSpec.version} found in CHANGELOG.md. ` +
            "Please add one so users know what has changed in this version. " +
            (0, marked_1.marked)("See https://firebase.google.com/docs/extensions/alpha/create-user-docs#writing-changelog for more details."));
    }
    displayReleaseNotes(args.publisherId, args.extensionId, extensionSpec.version, notes);
    if (!(await confirm({
        nonInteractive: args.nonInteractive,
        force: args.force,
        default: false,
    }))) {
        return;
    }
    if (extension &&
        extension.latestVersion &&
        semver.lt(extensionSpec.version, extension.latestVersion)) {
        throw new error_1.FirebaseError(`The version you are trying to publish (${clc.bold(extensionSpec.version)}) is lower than the current version (${clc.bold(extension.latestVersion)}) for the extension '${clc.bold(`${args.publisherId}/${args.extensionId}`)}'. Please make sure this version is greater than the current version (${clc.bold(extension.latestVersion)}) inside of extension.yaml.\n`, { exit: 104 });
    }
    else if (extension &&
        extension.latestVersion &&
        semver.eq(extensionSpec.version, extension.latestVersion)) {
        throw new error_1.FirebaseError(`The version you are trying to publish (${clc.bold(extensionSpec.version)}) already exists for the extension '${clc.bold(`${args.publisherId}/${args.extensionId}`)}'. Please increment the version inside of extension.yaml.\n`, { exit: 103 });
    }
    const ref = `${args.publisherId}/${args.extensionId}@${extensionSpec.version}`;
    let packageUri;
    let objectPath = "";
    const uploadSpinner = ora(" Archiving and uploading extension source code");
    try {
        uploadSpinner.start();
        objectPath = await archiveAndUploadSource(args.rootDirectory, exports.EXTENSIONS_BUCKET_NAME);
        uploadSpinner.succeed(" Uploaded extension source code");
        packageUri = api_1.storageOrigin + objectPath + "?alt=media";
    }
    catch (err) {
        uploadSpinner.fail();
        throw new error_1.FirebaseError(`Failed to archive and upload extension source, ${err}`, {
            original: err,
        });
    }
    const publishSpinner = ora(`Publishing ${clc.bold(ref)}`);
    let res;
    try {
        publishSpinner.start();
        res = await (0, extensionsApi_1.publishExtensionVersion)(ref, packageUri);
        publishSpinner.succeed(` Successfully published ${clc.bold(ref)}`);
    }
    catch (err) {
        publishSpinner.fail();
        if (err.status === 404) {
            throw new error_1.FirebaseError((0, marked_1.marked)(`Couldn't find publisher ID '${clc.bold(args.publisherId)}'. Please ensure that you have registered this ID. To register as a publisher, you can check out the [Firebase documentation](https://firebase.google.com/docs/extensions/alpha/share#register_as_an_extensions_publisher) for step-by-step instructions.`));
        }
        throw err;
    }
    await deleteUploadedSource(objectPath);
    return res;
}
exports.publishExtensionVersionFromLocalSource = publishExtensionVersionFromLocalSource;
async function createSourceFromLocation(projectId, sourceUri) {
    const extensionRoot = "/";
    let packageUri;
    let objectPath = "";
    const spinner = ora(" Archiving and uploading extension source code");
    try {
        spinner.start();
        objectPath = await archiveAndUploadSource(sourceUri, exports.EXTENSIONS_BUCKET_NAME);
        spinner.succeed(" Uploaded extension source code");
        packageUri = api_1.storageOrigin + objectPath + "?alt=media";
        const res = await (0, extensionsApi_1.createSource)(projectId, packageUri, extensionRoot);
        logger_1.logger.debug("Created new Extension Source %s", res.name);
        await deleteUploadedSource(objectPath);
        return res;
    }
    catch (err) {
        spinner.fail();
        throw new error_1.FirebaseError(`Failed to archive and upload extension source from ${sourceUri}, ${err}`, {
            original: err,
        });
    }
}
exports.createSourceFromLocation = createSourceFromLocation;
async function deleteUploadedSource(objectPath) {
    if (objectPath.length) {
        try {
            await (0, storage_1.deleteObject)(objectPath);
            logger_1.logger.debug("Cleaned up uploaded source archive");
        }
        catch (err) {
            logger_1.logger.debug("Unable to clean up uploaded source archive");
        }
    }
}
function getPublisherProjectFromName(publisherName) {
    const publisherNameRegex = /projects\/.+\/publisherProfile/;
    if (publisherNameRegex.test(publisherName)) {
        const [_, projectNumber, __] = publisherName.split("/");
        return Number.parseInt(projectNumber);
    }
    throw new error_1.FirebaseError(`Could not find publisher with name '${publisherName}'.`);
}
exports.getPublisherProjectFromName = getPublisherProjectFromName;
function displayReleaseNotes(publisherId, extensionId, versionId, releaseNotes) {
    const releaseNotesMessage = releaseNotes
        ? ` Release notes for this version:\n${(0, marked_1.marked)(releaseNotes)}\n`
        : "\n";
    const message = `You are about to publish version ${clc.green(versionId)} of ${clc.green(`${publisherId}/${extensionId}`)} to Firebase's registry of extensions.${releaseNotesMessage}` +
        "Once an extension version is published, it cannot be changed. If you wish to make changes after publishing, you will need to publish a new version.\n\n";
    logger_1.logger.info(message);
}
exports.displayReleaseNotes = displayReleaseNotes;
async function promptForOfficialExtension(message) {
    const officialExts = await (0, resolveSource_1.getExtensionRegistry)(true);
    return await (0, prompt_1.promptOnce)({
        name: "input",
        type: "list",
        message,
        choices: (0, utils_1.convertOfficialExtensionsToList)(officialExts),
        pageSize: Object.keys(officialExts).length,
    });
}
exports.promptForOfficialExtension = promptForOfficialExtension;
async function promptForRepeatInstance(projectName, extensionName) {
    const message = `An extension with the ID '${clc.bold(extensionName)}' already exists in the project '${clc.bold(projectName)}'. What would you like to do?`;
    const choices = [
        { name: "Update or reconfigure the existing instance", value: "updateExisting" },
        { name: "Install a new instance with a different ID", value: "installNew" },
        { name: "Cancel extension installation", value: "cancel" },
    ];
    return await (0, prompt_1.promptOnce)({
        type: "list",
        message,
        choices,
    });
}
exports.promptForRepeatInstance = promptForRepeatInstance;
async function instanceIdExists(projectId, instanceId) {
    try {
        await (0, extensionsApi_1.getInstance)(projectId, instanceId);
    }
    catch (err) {
        if (err instanceof error_1.FirebaseError) {
            if (err.status === 404) {
                return false;
            }
            const msg = `Unexpected error when checking if instance ID exists: ${err}`;
            throw new error_1.FirebaseError(msg, {
                original: err,
            });
        }
        else {
            throw err;
        }
    }
    return true;
}
exports.instanceIdExists = instanceIdExists;
function isUrlPath(extInstallPath) {
    return extInstallPath.startsWith("https:");
}
exports.isUrlPath = isUrlPath;
function isLocalPath(extInstallPath) {
    const trimmedPath = extInstallPath.trim();
    return (trimmedPath.startsWith("~/") ||
        trimmedPath.startsWith("./") ||
        trimmedPath.startsWith("../") ||
        trimmedPath.startsWith("/") ||
        [".", ".."].includes(trimmedPath));
}
exports.isLocalPath = isLocalPath;
function isLocalOrURLPath(extInstallPath) {
    return isLocalPath(extInstallPath) || isUrlPath(extInstallPath);
}
exports.isLocalOrURLPath = isLocalOrURLPath;
function getSourceOrigin(sourceOrVersion) {
    if (isLocalPath(sourceOrVersion)) {
        return SourceOrigin.LOCAL;
    }
    if (isUrlPath(sourceOrVersion)) {
        return SourceOrigin.URL;
    }
    if (sourceOrVersion.includes("/")) {
        let ref;
        try {
            ref = refs.parse(sourceOrVersion);
        }
        catch (err) {
        }
        if (ref && ref.publisherId && ref.extensionId && !ref.version) {
            return SourceOrigin.PUBLISHED_EXTENSION;
        }
        else if (ref && ref.publisherId && ref.extensionId && ref.version) {
            return SourceOrigin.PUBLISHED_EXTENSION_VERSION;
        }
    }
    throw new error_1.FirebaseError(`Could not find source '${clc.bold(sourceOrVersion)}'. Check to make sure the source is correct, and then please try again.`);
}
exports.getSourceOrigin = getSourceOrigin;
async function confirm(args) {
    if (!args.nonInteractive && !args.force) {
        const message = `Do you wish to continue?`;
        return await (0, prompt_1.promptOnce)({
            type: "confirm",
            message,
            default: args.default,
        });
    }
    else if (args.nonInteractive && !args.force) {
        throw new error_1.FirebaseError("Pass the --force flag to use this command in non-interactive mode");
    }
    else {
        return true;
    }
}
exports.confirm = confirm;
async function diagnoseAndFixProject(options) {
    const projectId = (0, projectUtils_1.getProjectId)(options);
    if (!projectId) {
        return;
    }
    const ok = await (0, diagnose_1.diagnose)(projectId);
    if (!ok) {
        throw new error_1.FirebaseError("Unable to proceed until all issues are resolved.");
    }
}
exports.diagnoseAndFixProject = diagnoseAndFixProject;
async function canonicalizeRefInput(refInput) {
    let inferredRef = refInput;
    if (refInput.split("/").length < 2) {
        inferredRef = `firebase/${inferredRef}`;
    }
    if (refInput.split("@").length < 2) {
        inferredRef = `${inferredRef}@latest`;
    }
    const ref = refs.parse(inferredRef);
    ref.version = await (0, planner_1.resolveVersion)(ref);
    return refs.toExtensionVersionRef(ref);
}
exports.canonicalizeRefInput = canonicalizeRefInput;
