"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtension = exports.deleteExtension = exports.unpublishExtension = exports.publishExtensionVersion = exports.undeprecateExtensionVersion = exports.deprecateExtensionVersion = exports.registerPublisherProfile = exports.getPublisherProfile = exports.listExtensionVersions = exports.listExtensions = exports.getExtensionVersion = exports.getSource = exports.createSource = exports.updateInstanceFromRegistry = exports.updateInstance = exports.configureInstance = exports.listInstances = exports.getInstance = exports.deleteInstance = exports.createInstance = void 0;
const yaml = require("js-yaml");
const clc = require("colorette");
const marked_1 = require("marked");
const apiv2_1 = require("../apiv2");
const api_1 = require("../api");
const error_1 = require("../error");
const logger_1 = require("../logger");
const operationPoller = require("../operation-poller");
const refs = require("./refs");
const VERSION = "v1beta";
const PAGE_SIZE_MAX = 100;
const apiClient = new apiv2_1.Client({ urlPrefix: api_1.extensionsOrigin, apiVersion: VERSION });
async function createInstanceHelper(projectId, instanceId, config, validateOnly = false) {
    const createRes = await apiClient.post(`/projects/${projectId}/instances/`, {
        name: `projects/${projectId}/instances/${instanceId}`,
        config,
    }, {
        queryParams: {
            validateOnly: validateOnly ? "true" : "false",
        },
    });
    if (validateOnly) {
        return createRes.body;
    }
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api_1.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: createRes.body.name,
        masterTimeout: 600000,
    });
    return pollRes;
}
async function createInstance(args) {
    var _a, _b, _c;
    const config = {
        params: args.params,
        systemParams: (_a = args.systemParams) !== null && _a !== void 0 ? _a : {},
        allowedEventTypes: args.allowedEventTypes,
        eventarcChannel: args.eventarcChannel,
    };
    if (args.extensionSource && args.extensionVersionRef) {
        throw new error_1.FirebaseError("ExtensionSource and ExtensionVersion both provided, but only one should be.");
    }
    else if (args.extensionSource) {
        config.source = { name: (_b = args.extensionSource) === null || _b === void 0 ? void 0 : _b.name };
    }
    else if (args.extensionVersionRef) {
        const ref = refs.parse(args.extensionVersionRef);
        config.extensionRef = refs.toExtensionRef(ref);
        config.extensionVersion = (_c = ref.version) !== null && _c !== void 0 ? _c : "";
    }
    else {
        throw new error_1.FirebaseError("No ExtensionVersion or ExtensionSource provided but one is required.");
    }
    if (args.allowedEventTypes) {
        config.allowedEventTypes = args.allowedEventTypes;
    }
    if (args.eventarcChannel) {
        config.eventarcChannel = args.eventarcChannel;
    }
    return createInstanceHelper(args.projectId, args.instanceId, config, args.validateOnly);
}
exports.createInstance = createInstance;
async function deleteInstance(projectId, instanceId) {
    const deleteRes = await apiClient.delete(`/projects/${projectId}/instances/${instanceId}`);
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api_1.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: deleteRes.body.name,
        masterTimeout: 600000,
    });
    return pollRes;
}
exports.deleteInstance = deleteInstance;
async function getInstance(projectId, instanceId) {
    try {
        const res = await apiClient.get(`/projects/${projectId}/instances/${instanceId}`);
        return res.body;
    }
    catch (err) {
        if (err.status === 404) {
            throw new error_1.FirebaseError(`Extension instance '${clc.bold(instanceId)}' not found in project '${clc.bold(projectId)}'.`, { status: 404 });
        }
        throw err;
    }
}
exports.getInstance = getInstance;
async function listInstances(projectId) {
    const instances = [];
    const getNextPage = async (pageToken = "") => {
        const res = await apiClient.get(`/projects/${projectId}/instances`, {
            queryParams: {
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.instances)) {
            instances.push(...res.body.instances);
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return instances;
}
exports.listInstances = listInstances;
async function configureInstance(args) {
    var _a;
    const reqBody = {
        projectId: args.projectId,
        instanceId: args.instanceId,
        updateMask: "config.params",
        validateOnly: (_a = args.validateOnly) !== null && _a !== void 0 ? _a : false,
        data: {
            config: {
                params: args.params,
            },
        },
    };
    if (args.canEmitEvents) {
        if (args.allowedEventTypes === undefined || args.eventarcChannel === undefined) {
            throw new error_1.FirebaseError(`This instance is configured to emit events, but either allowed event types or eventarc channel is undefined.`);
        }
        reqBody.data.config.allowedEventTypes = args.allowedEventTypes;
        reqBody.data.config.eventarcChannel = args.eventarcChannel;
    }
    reqBody.updateMask += ",config.allowed_event_types,config.eventarc_channel";
    if (args.systemParams) {
        reqBody.data.config.systemParams = args.systemParams;
        reqBody.updateMask += ",config.system_params";
    }
    return patchInstance(reqBody);
}
exports.configureInstance = configureInstance;
async function updateInstance(args) {
    var _a;
    const body = {
        config: {
            source: { name: args.extensionSource.name },
        },
    };
    let updateMask = "config.source.name";
    if (args.params) {
        body.config.params = args.params;
        updateMask += ",config.params";
    }
    if (args.systemParams) {
        body.config.systemParams = args.systemParams;
        updateMask += ",config.system_params";
    }
    if (args.canEmitEvents) {
        if (args.allowedEventTypes === undefined || args.eventarcChannel === undefined) {
            throw new error_1.FirebaseError(`This instance is configured to emit events, but either allowed event types or eventarc channel is undefined.`);
        }
        body.config.allowedEventTypes = args.allowedEventTypes;
        body.config.eventarcChannel = args.eventarcChannel;
    }
    updateMask += ",config.allowed_event_types,config.eventarc_channel";
    return patchInstance({
        projectId: args.projectId,
        instanceId: args.instanceId,
        updateMask,
        validateOnly: (_a = args.validateOnly) !== null && _a !== void 0 ? _a : false,
        data: body,
    });
}
exports.updateInstance = updateInstance;
async function updateInstanceFromRegistry(args) {
    var _a;
    const ref = refs.parse(args.extRef);
    const body = {
        config: {
            extensionRef: refs.toExtensionRef(ref),
            extensionVersion: ref.version,
        },
    };
    let updateMask = "config.extension_ref,config.extension_version";
    if (args.params) {
        body.config.params = args.params;
        updateMask += ",config.params";
    }
    if (args.systemParams) {
        body.config.systemParams = args.systemParams;
        updateMask += ",config.system_params";
    }
    if (args.canEmitEvents) {
        if (args.allowedEventTypes === undefined || args.eventarcChannel === undefined) {
            throw new error_1.FirebaseError(`This instance is configured to emit events, but either allowed event types or eventarc channel is undefined.`);
        }
        body.config.allowedEventTypes = args.allowedEventTypes;
        body.config.eventarcChannel = args.eventarcChannel;
    }
    updateMask += ",config.allowed_event_types,config.eventarc_channel";
    return patchInstance({
        projectId: args.projectId,
        instanceId: args.instanceId,
        updateMask,
        validateOnly: (_a = args.validateOnly) !== null && _a !== void 0 ? _a : false,
        data: body,
    });
}
exports.updateInstanceFromRegistry = updateInstanceFromRegistry;
async function patchInstance(args) {
    const updateRes = await apiClient.patch(`/projects/${args.projectId}/instances/${args.instanceId}`, args.data, {
        queryParams: {
            updateMask: args.updateMask,
            validateOnly: args.validateOnly ? "true" : "false",
        },
    });
    if (args.validateOnly) {
        return updateRes;
    }
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api_1.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: updateRes.body.name,
        masterTimeout: 600000,
    });
    return pollRes;
}
function populateResourceProperties(spec) {
    if (spec) {
        spec.resources.forEach((r) => {
            try {
                if (r.propertiesYaml) {
                    r.properties = yaml.safeLoad(r.propertiesYaml);
                }
            }
            catch (err) {
                logger_1.logger.debug(`[ext] failed to parse resource properties yaml: ${err}`);
            }
        });
    }
}
async function createSource(projectId, packageUri, extensionRoot) {
    const createRes = await apiClient.post(`/projects/${projectId}/sources/`, {
        packageUri,
        extensionRoot,
    });
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api_1.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: createRes.body.name,
        masterTimeout: 600000,
    });
    if (pollRes.spec) {
        populateResourceProperties(pollRes.spec);
    }
    return pollRes;
}
exports.createSource = createSource;
async function getSource(sourceName) {
    const res = await apiClient.get(`/${sourceName}`);
    if (res.body.spec) {
        populateResourceProperties(res.body.spec);
    }
    return res.body;
}
exports.getSource = getSource;
async function getExtensionVersion(extensionVersionRef) {
    const ref = refs.parse(extensionVersionRef);
    if (!ref.version) {
        throw new error_1.FirebaseError(`ExtensionVersion ref "${extensionVersionRef}" must supply a version.`);
    }
    try {
        const res = await apiClient.get(`/${refs.toExtensionVersionName(ref)}`);
        if (res.body.spec) {
            populateResourceProperties(res.body.spec);
        }
        return res.body;
    }
    catch (err) {
        if (err.status === 404) {
            throw refNotFoundError(ref);
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Failed to query the extension version '${clc.bold(extensionVersionRef)}': ${err}`);
    }
}
exports.getExtensionVersion = getExtensionVersion;
async function listExtensions(publisherId) {
    const extensions = [];
    const getNextPage = async (pageToken = "") => {
        const res = await apiClient.get(`/publishers/${publisherId}/extensions`, {
            queryParams: {
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.extensions)) {
            extensions.push(...res.body.extensions);
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return extensions;
}
exports.listExtensions = listExtensions;
async function listExtensionVersions(ref, filter = "", showPrereleases = false) {
    const { publisherId, extensionId } = refs.parse(ref);
    const extensionVersions = [];
    const getNextPage = async (pageToken = "") => {
        const res = await apiClient.get(`/publishers/${publisherId}/extensions/${extensionId}/versions`, {
            queryParams: {
                filter,
                showPrereleases: String(showPrereleases),
                pageSize: PAGE_SIZE_MAX,
                pageToken,
            },
        });
        if (Array.isArray(res.body.extensionVersions)) {
            extensionVersions.push(...res.body.extensionVersions);
        }
        if (res.body.nextPageToken) {
            await getNextPage(res.body.nextPageToken);
        }
    };
    await getNextPage();
    return extensionVersions;
}
exports.listExtensionVersions = listExtensionVersions;
async function getPublisherProfile(projectId, publisherId) {
    const res = await apiClient.get(`/projects/${projectId}/publisherProfile`, {
        queryParams: publisherId === undefined
            ? undefined
            : {
                publisherId,
            },
    });
    return res.body;
}
exports.getPublisherProfile = getPublisherProfile;
async function registerPublisherProfile(projectId, publisherId) {
    const res = await apiClient.post(`/projects/${projectId}/publisherProfile:register`, {
        publisherId,
    });
    return res.body;
}
exports.registerPublisherProfile = registerPublisherProfile;
async function deprecateExtensionVersion(extensionRef, deprecationMessage) {
    const ref = refs.parse(extensionRef);
    try {
        const res = await apiClient.post(`/${refs.toExtensionVersionName(ref)}:deprecate`, {
            deprecationMessage,
        });
        return res.body;
    }
    catch (err) {
        if (err.status === 403) {
            throw new error_1.FirebaseError(`You are not the owner of extension '${clc.bold(extensionRef)}' and don’t have the correct permissions to deprecate this extension version.` + err, { status: err.status });
        }
        else if (err.status === 404) {
            throw new error_1.FirebaseError(`Extension version ${clc.bold(extensionRef)} was not found.`);
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Error occurred deprecating extension version '${extensionRef}': ${err}`, {
            status: err.status,
        });
    }
}
exports.deprecateExtensionVersion = deprecateExtensionVersion;
async function undeprecateExtensionVersion(extensionRef) {
    const ref = refs.parse(extensionRef);
    try {
        const res = await apiClient.post(`/${refs.toExtensionVersionName(ref)}:undeprecate`);
        return res.body;
    }
    catch (err) {
        if (err.status === 403) {
            throw new error_1.FirebaseError(`You are not the owner of extension '${clc.bold(extensionRef)}' and don’t have the correct permissions to undeprecate this extension version.`, { status: err.status });
        }
        else if (err.status === 404) {
            throw new error_1.FirebaseError(`Extension version ${clc.bold(extensionRef)} was not found.`);
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Error occurred undeprecating extension version '${extensionRef}': ${err}`, {
            status: err.status,
        });
    }
}
exports.undeprecateExtensionVersion = undeprecateExtensionVersion;
async function publishExtensionVersion(extensionVersionRef, packageUri, extensionRoot) {
    const ref = refs.parse(extensionVersionRef);
    if (!ref.version) {
        throw new error_1.FirebaseError(`ExtensionVersion ref "${extensionVersionRef}" must supply a version.`);
    }
    const publishRes = await apiClient.post(`/${refs.toExtensionName(ref)}/versions:publish`, {
        versionId: ref.version,
        packageUri,
        extensionRoot: extensionRoot !== null && extensionRoot !== void 0 ? extensionRoot : "/",
    });
    const pollRes = await operationPoller.pollOperation({
        apiOrigin: api_1.extensionsOrigin,
        apiVersion: VERSION,
        operationResourceName: publishRes.body.name,
        masterTimeout: 600000,
    });
    return pollRes;
}
exports.publishExtensionVersion = publishExtensionVersion;
async function unpublishExtension(extensionRef) {
    const ref = refs.parse(extensionRef);
    if (ref.version) {
        throw new error_1.FirebaseError(`Extension reference "${extensionRef}" must not contain a version.`);
    }
    try {
        await apiClient.post(`/${refs.toExtensionName(ref)}:unpublish`);
    }
    catch (err) {
        if (err.status === 403) {
            throw new error_1.FirebaseError(`You are not the owner of extension '${clc.bold(extensionRef)}' and don’t have the correct permissions to unpublish this extension.`, { status: err.status });
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Error occurred unpublishing extension '${extensionRef}': ${err}`, {
            status: err.status,
        });
    }
}
exports.unpublishExtension = unpublishExtension;
async function deleteExtension(extensionRef) {
    const ref = refs.parse(extensionRef);
    if (ref.version) {
        throw new error_1.FirebaseError(`Extension reference "${extensionRef}" must not contain a version.`);
    }
    try {
        await apiClient.delete(`/${refs.toExtensionName(ref)}`);
    }
    catch (err) {
        if (err.status === 403) {
            throw new error_1.FirebaseError(`You are not the owner of extension '${clc.bold(extensionRef)}' and don’t have the correct permissions to delete this extension.`, { status: err.status });
        }
        else if (err.status === 404) {
            throw new error_1.FirebaseError(`Extension ${clc.bold(extensionRef)} was not found.`);
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Error occurred delete extension '${extensionRef}': ${err}`, {
            status: err.status,
        });
    }
}
exports.deleteExtension = deleteExtension;
async function getExtension(extensionRef) {
    const ref = refs.parse(extensionRef);
    try {
        const res = await apiClient.get(`/${refs.toExtensionName(ref)}`);
        return res.body;
    }
    catch (err) {
        if (err.status === 404) {
            throw refNotFoundError(ref);
        }
        else if (err instanceof error_1.FirebaseError) {
            throw err;
        }
        throw new error_1.FirebaseError(`Failed to query the extension '${clc.bold(extensionRef)}': ${err}`, {
            status: err.status,
        });
    }
}
exports.getExtension = getExtension;
function refNotFoundError(ref) {
    return new error_1.FirebaseError(`The extension reference '${clc.bold(ref.version ? refs.toExtensionVersionRef(ref) : refs.toExtensionRef(ref))}' doesn't exist. This could happen for two reasons:\n` +
        `  -The publisher ID '${clc.bold(ref.publisherId)}' doesn't exist or could be misspelled\n` +
        `  -The name of the ${ref.version ? "extension version" : "extension"} '${clc.bold(ref.version ? `${ref.extensionId}@${ref.version}` : ref.extensionId)}' doesn't exist or could be misspelled\n\n` +
        `Please correct the extension reference and try again. If you meant to install an extension from a local source, please provide a relative path prefixed with '${clc.bold("./")}', '${clc.bold("../")}', or '${clc.bold("~/")}'. Learn more about local extension installation at ${(0, marked_1.marked)("[https://firebase.google.com/docs/extensions/alpha/install-extensions_community#install](https://firebase.google.com/docs/extensions/alpha/install-extensions_community#install).")}`, { status: 404 });
}
