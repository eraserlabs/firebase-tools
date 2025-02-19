"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpointFromFunction = exports.functionFromEndpoint = exports.deleteFunction = exports.updateFunction = exports.listAllFunctions = exports.listFunctions = exports.getFunction = exports.createFunction = exports.generateUploadUrl = exports.mebibytes = exports.API_VERSION = void 0;
const clc = require("colorette");
const apiv2_1 = require("../apiv2");
const error_1 = require("../error");
const api_1 = require("../api");
const logger_1 = require("../logger");
const v2_1 = require("../functions/events/v2");
const backend = require("../deploy/functions/backend");
const runtimes = require("../deploy/functions/runtimes");
const proto = require("./proto");
const utils = require("../utils");
const projectConfig = require("../functions/projectConfig");
const constants_1 = require("../functions/constants");
exports.API_VERSION = "v2";
const client = new apiv2_1.Client({
    urlPrefix: api_1.functionsV2Origin,
    auth: true,
    apiVersion: exports.API_VERSION,
});
const BYTES_PER_UNIT = {
    "": 1,
    k: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12,
    Ki: 1 << 10,
    Mi: 1 << 20,
    Gi: 1 << 30,
    Ti: 1 << 40,
};
function mebibytes(memory) {
    const re = /^([0-9]+(\.[0-9]*)?)(Ki|Mi|Gi|Ti|k|M|G|T|([eE]([0-9]+)))?$/;
    const matches = re.exec(memory);
    if (!matches) {
        throw new Error(`Invalid memory quantity "${memory}""`);
    }
    const quantity = Number.parseFloat(matches[1]);
    let bytes;
    if (matches[5]) {
        bytes = quantity * Math.pow(10, Number.parseFloat(matches[5]));
    }
    else {
        const suffix = matches[3] || "";
        bytes = quantity * BYTES_PER_UNIT[suffix];
    }
    return bytes / (1 << 20);
}
exports.mebibytes = mebibytes;
function functionsOpLogReject(funcName, type, err) {
    var _a, _b, _c, _d;
    utils.logWarning(clc.bold(clc.yellow("functions:")) + ` ${err === null || err === void 0 ? void 0 : err.message}`);
    if (((_b = (_a = err === null || err === void 0 ? void 0 : err.context) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.statusCode) === 429) {
        utils.logWarning(`${clc.bold(clc.yellow("functions:"))} got "Quota Exceeded" error while trying to ${type} ${funcName}. Waiting to retry...`);
    }
    else if (err === null || err === void 0 ? void 0 : err.message.includes("If you recently started to use Eventarc, it may take a few minutes before all necessary permissions are propagated to the Service Agent")) {
        utils.logWarning(`${clc.bold(clc.yellow("functions:"))} since this is your first time using functions v2, we need a little bit longer to finish setting everything up, please retry the deployment in a few minutes.`);
    }
    else {
        utils.logWarning(clc.bold(clc.yellow("functions:")) + " failed to " + type + " function " + funcName);
    }
    throw new error_1.FirebaseError(`Failed to ${type} function ${funcName}`, {
        original: err,
        status: (_d = (_c = err === null || err === void 0 ? void 0 : err.context) === null || _c === void 0 ? void 0 : _c.response) === null || _d === void 0 ? void 0 : _d.statusCode,
        context: { function: funcName },
    });
}
async function generateUploadUrl(projectId, location) {
    try {
        const res = await client.post(`projects/${projectId}/locations/${location}/functions:generateUploadUrl`);
        return res.body;
    }
    catch (err) {
        logger_1.logger.info("\n\nThere was an issue deploying your functions. Verify that your project has a Google App Engine instance setup at https://console.cloud.google.com/appengine and try again. If this issue persists, please contact support.");
        throw err;
    }
}
exports.generateUploadUrl = generateUploadUrl;
async function createFunction(cloudFunction) {
    const components = cloudFunction.name.split("/");
    const functionId = components.splice(-1, 1)[0];
    try {
        const res = await client.post(components.join("/"), cloudFunction, { queryParams: { functionId } });
        return res.body;
    }
    catch (err) {
        throw functionsOpLogReject(cloudFunction.name, "create", err);
    }
}
exports.createFunction = createFunction;
async function getFunction(projectId, location, functionId) {
    const name = `projects/${projectId}/locations/${location}/functions/${functionId}`;
    const res = await client.get(name);
    return res.body;
}
exports.getFunction = getFunction;
async function listFunctions(projectId, region) {
    const res = await listFunctionsInternal(projectId, region);
    if (res.unreachable.includes(region)) {
        throw new error_1.FirebaseError(`Cloud Functions region ${region} is unavailable`);
    }
    return res.functions;
}
exports.listFunctions = listFunctions;
async function listAllFunctions(projectId) {
    return await listFunctionsInternal(projectId, "-");
}
exports.listAllFunctions = listAllFunctions;
async function listFunctionsInternal(projectId, region) {
    const functions = [];
    const unreacahble = new Set();
    let pageToken = "";
    while (true) {
        const url = `projects/${projectId}/locations/${region}/functions`;
        const opts = { queryParams: { filter: `environment="GEN_2"` } };
        if (pageToken !== "") {
            opts.queryParams = Object.assign(Object.assign({}, opts.queryParams), { pageToken });
        }
        const res = await client.get(url, opts);
        functions.push(...(res.body.functions || []));
        for (const region of res.body.unreachable || []) {
            unreacahble.add(region);
        }
        if (!res.body.nextPageToken) {
            return {
                functions,
                unreachable: Array.from(unreacahble),
            };
        }
        pageToken = res.body.nextPageToken;
    }
}
async function updateFunction(cloudFunction) {
    const fieldMasks = proto.fieldMasks(cloudFunction, "labels", "serviceConfig.environmentVariables", "serviceConfig.secretEnvironmentVariables");
    try {
        const queryParams = {
            updateMask: fieldMasks.join(","),
        };
        const res = await client.patch(cloudFunction.name, cloudFunction, { queryParams });
        return res.body;
    }
    catch (err) {
        throw functionsOpLogReject(cloudFunction.name, "update", err);
    }
}
exports.updateFunction = updateFunction;
async function deleteFunction(cloudFunction) {
    try {
        const res = await client.delete(cloudFunction);
        return res.body;
    }
    catch (err) {
        throw functionsOpLogReject(cloudFunction, "update", err);
    }
}
exports.deleteFunction = deleteFunction;
function functionFromEndpoint(endpoint, source) {
    var _a, _b;
    if (endpoint.platform !== "gcfv2") {
        throw new error_1.FirebaseError("Trying to create a v2 CloudFunction with v1 API. This should never happen");
    }
    if (!runtimes.isValidRuntime(endpoint.runtime)) {
        throw new error_1.FirebaseError("Failed internal assertion. Trying to deploy a new function with a deprecated runtime." +
            " This should never happen");
    }
    const gcfFunction = {
        name: backend.functionName(endpoint),
        buildConfig: {
            runtime: endpoint.runtime,
            entryPoint: endpoint.entryPoint,
            source: {
                storageSource: source,
            },
            environmentVariables: {},
        },
        serviceConfig: {},
    };
    proto.copyIfPresent(gcfFunction, endpoint, "labels");
    proto.copyIfPresent(gcfFunction.serviceConfig, endpoint, "environmentVariables", "secretEnvironmentVariables", "ingressSettings", "timeoutSeconds");
    proto.renameIfPresent(gcfFunction.serviceConfig, endpoint, "serviceAccountEmail", "serviceAccount");
    const mem = endpoint.availableMemoryMb || backend.DEFAULT_MEMORY;
    gcfFunction.serviceConfig.availableMemory = mem > 1024 ? `${mem / 1024}Gi` : `${mem}Mi`;
    proto.renameIfPresent(gcfFunction.serviceConfig, endpoint, "minInstanceCount", "minInstances");
    proto.renameIfPresent(gcfFunction.serviceConfig, endpoint, "maxInstanceCount", "maxInstances");
    proto.renameIfPresent(gcfFunction.serviceConfig, endpoint, "maxInstanceRequestConcurrency", "concurrency");
    proto.convertIfPresent(gcfFunction.serviceConfig, endpoint, "availableCpu", "cpu", (cpu) => {
        return String(cpu);
    });
    if (endpoint.vpc) {
        proto.renameIfPresent(gcfFunction.serviceConfig, endpoint.vpc, "vpcConnector", "connector");
        proto.renameIfPresent(gcfFunction.serviceConfig, endpoint.vpc, "vpcConnectorEgressSettings", "egressSettings");
    }
    else if (endpoint.vpc === null) {
        gcfFunction.serviceConfig.vpcConnector = null;
        gcfFunction.serviceConfig.vpcConnectorEgressSettings = null;
    }
    if (backend.isEventTriggered(endpoint)) {
        gcfFunction.eventTrigger = {
            eventType: endpoint.eventTrigger.eventType,
        };
        if (gcfFunction.eventTrigger.eventType === v2_1.PUBSUB_PUBLISH_EVENT) {
            if (!((_a = endpoint.eventTrigger.eventFilters) === null || _a === void 0 ? void 0 : _a.topic)) {
                throw new error_1.FirebaseError("Error: Pub/Sub event trigger is missing topic: " +
                    JSON.stringify(endpoint.eventTrigger, null, 2));
            }
            gcfFunction.eventTrigger.pubsubTopic = endpoint.eventTrigger.eventFilters.topic;
            gcfFunction.eventTrigger.eventFilters = [];
            for (const [attribute, value] of Object.entries(endpoint.eventTrigger.eventFilters)) {
                if (attribute === "topic")
                    continue;
                gcfFunction.eventTrigger.eventFilters.push({ attribute, value });
            }
        }
        else {
            gcfFunction.eventTrigger.eventFilters = [];
            for (const [attribute, value] of Object.entries(endpoint.eventTrigger.eventFilters || {})) {
                gcfFunction.eventTrigger.eventFilters.push({ attribute, value });
            }
            for (const [attribute, value] of Object.entries(endpoint.eventTrigger.eventFilterPathPatterns || {})) {
                gcfFunction.eventTrigger.eventFilters.push({
                    attribute,
                    value,
                    operator: "match-path-pattern",
                });
            }
        }
        proto.renameIfPresent(gcfFunction.eventTrigger, endpoint.eventTrigger, "triggerRegion", "region");
        proto.copyIfPresent(gcfFunction.eventTrigger, endpoint.eventTrigger, "channel");
        if (endpoint.eventTrigger.retry) {
            logger_1.logger.warn("Cannot set a retry policy on Cloud Function", endpoint.id);
        }
        gcfFunction.serviceConfig.environmentVariables = Object.assign(Object.assign({}, gcfFunction.serviceConfig.environmentVariables), { FUNCTION_SIGNATURE_TYPE: "cloudevent" });
    }
    else if (backend.isScheduleTriggered(endpoint)) {
        gcfFunction.labels = Object.assign(Object.assign({}, gcfFunction.labels), { "deployment-scheduled": "true" });
    }
    else if (backend.isTaskQueueTriggered(endpoint)) {
        gcfFunction.labels = Object.assign(Object.assign({}, gcfFunction.labels), { "deployment-taskqueue": "true" });
    }
    else if (backend.isCallableTriggered(endpoint)) {
        gcfFunction.labels = Object.assign(Object.assign({}, gcfFunction.labels), { "deployment-callable": "true" });
    }
    else if (backend.isBlockingTriggered(endpoint)) {
        gcfFunction.labels = Object.assign(Object.assign({}, gcfFunction.labels), { [constants_1.BLOCKING_LABEL]: constants_1.BLOCKING_EVENT_TO_LABEL_KEY[endpoint.blockingTrigger.eventType] });
    }
    const codebase = endpoint.codebase || projectConfig.DEFAULT_CODEBASE;
    if (codebase !== projectConfig.DEFAULT_CODEBASE) {
        gcfFunction.labels = Object.assign(Object.assign({}, gcfFunction.labels), { [constants_1.CODEBASE_LABEL]: codebase });
    }
    else {
        (_b = gcfFunction.labels) === null || _b === void 0 ? true : delete _b[constants_1.CODEBASE_LABEL];
    }
    if (endpoint.hash) {
        gcfFunction.labels = Object.assign(Object.assign({}, gcfFunction.labels), { [constants_1.HASH_LABEL]: endpoint.hash });
    }
    return gcfFunction;
}
exports.functionFromEndpoint = functionFromEndpoint;
function endpointFromFunction(gcfFunction) {
    var _a, _b, _c, _d, _e, _f;
    const [, project, , region, , id] = gcfFunction.name.split("/");
    let trigger;
    if (((_a = gcfFunction.labels) === null || _a === void 0 ? void 0 : _a["deployment-scheduled"]) === "true") {
        trigger = {
            scheduleTrigger: {},
        };
    }
    else if (((_b = gcfFunction.labels) === null || _b === void 0 ? void 0 : _b["deployment-taskqueue"]) === "true") {
        trigger = {
            taskQueueTrigger: {},
        };
    }
    else if (((_c = gcfFunction.labels) === null || _c === void 0 ? void 0 : _c["deployment-callable"]) === "true") {
        trigger = {
            callableTrigger: {},
        };
    }
    else if ((_d = gcfFunction.labels) === null || _d === void 0 ? void 0 : _d[constants_1.BLOCKING_LABEL]) {
        trigger = {
            blockingTrigger: {
                eventType: constants_1.BLOCKING_LABEL_KEY_TO_EVENT[gcfFunction.labels[constants_1.BLOCKING_LABEL]],
            },
        };
    }
    else if (gcfFunction.eventTrigger) {
        const eventFilters = {};
        const eventFilterPathPatterns = {};
        if (gcfFunction.eventTrigger.pubsubTopic) {
            eventFilters.topic = gcfFunction.eventTrigger.pubsubTopic;
        }
        else {
            for (const eventFilter of gcfFunction.eventTrigger.eventFilters || []) {
                if (eventFilter.operator === "match-path-pattern") {
                    eventFilterPathPatterns[eventFilter.attribute] = eventFilter.value;
                }
                else {
                    eventFilters[eventFilter.attribute] = eventFilter.value;
                }
            }
        }
        trigger = {
            eventTrigger: {
                eventType: gcfFunction.eventTrigger.eventType,
                retry: false,
            },
        };
        if (Object.keys(eventFilters).length) {
            trigger.eventTrigger.eventFilters = eventFilters;
        }
        if (Object.keys(eventFilterPathPatterns).length) {
            trigger.eventTrigger.eventFilterPathPatterns = eventFilterPathPatterns;
        }
        proto.copyIfPresent(trigger.eventTrigger, gcfFunction.eventTrigger, "channel");
        proto.renameIfPresent(trigger.eventTrigger, gcfFunction.eventTrigger, "region", "triggerRegion");
    }
    else {
        trigger = { httpsTrigger: {} };
    }
    if (!runtimes.isValidRuntime(gcfFunction.buildConfig.runtime)) {
        logger_1.logger.debug("GCFv2 function has a deprecated runtime:", JSON.stringify(gcfFunction, null, 2));
    }
    const endpoint = Object.assign(Object.assign({ platform: "gcfv2", id,
        project,
        region }, trigger), { entryPoint: gcfFunction.buildConfig.entryPoint, runtime: gcfFunction.buildConfig.runtime, uri: gcfFunction.serviceConfig.uri });
    proto.copyIfPresent(endpoint, gcfFunction.serviceConfig, "ingressSettings", "environmentVariables", "secretEnvironmentVariables", "timeoutSeconds");
    proto.renameIfPresent(endpoint, gcfFunction.serviceConfig, "serviceAccount", "serviceAccountEmail");
    proto.convertIfPresent(endpoint, gcfFunction.serviceConfig, "availableMemoryMb", "availableMemory", (prod) => {
        if (prod === null) {
            logger_1.logger.debug("Prod should always return a valid memory amount");
            return prod;
        }
        const mem = mebibytes(prod);
        if (!backend.isValidMemoryOption(mem)) {
            logger_1.logger.warn("Converting a function to an endpoint with an invalid memory option", mem);
        }
        return mem;
    });
    proto.renameIfPresent(endpoint, gcfFunction.serviceConfig, "minInstances", "minInstanceCount");
    proto.renameIfPresent(endpoint, gcfFunction.serviceConfig, "maxInstances", "maxInstanceCount");
    proto.copyIfPresent(endpoint, gcfFunction, "labels");
    if (gcfFunction.serviceConfig.vpcConnector) {
        endpoint.vpc = { connector: gcfFunction.serviceConfig.vpcConnector };
        proto.renameIfPresent(endpoint.vpc, gcfFunction.serviceConfig, "egressSettings", "vpcConnectorEgressSettings");
    }
    endpoint.codebase = ((_e = gcfFunction.labels) === null || _e === void 0 ? void 0 : _e[constants_1.CODEBASE_LABEL]) || projectConfig.DEFAULT_CODEBASE;
    if ((_f = gcfFunction.labels) === null || _f === void 0 ? void 0 : _f[constants_1.HASH_LABEL]) {
        endpoint.hash = gcfFunction.labels[constants_1.HASH_LABEL];
    }
    const serviceName = gcfFunction.serviceConfig.service;
    if (!serviceName) {
        logger_1.logger.debug("Got a v2 function without a service name." +
            "Maybe we've migrated to using the v2 API everywhere and missed this code");
    }
    else {
        endpoint.runServiceId = utils.last(serviceName.split("/"));
    }
    return endpoint;
}
exports.endpointFromFunction = endpointFromFunction;
