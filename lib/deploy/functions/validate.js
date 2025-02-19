"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretsAreValid = exports.functionIdsAreValid = exports.functionsDirectoryExists = exports.endpointsAreUnique = exports.cpuConfigIsValid = exports.endpointsAreValid = void 0;
const path = require("path");
const clc = require("colorette");
const error_1 = require("../../error");
const secretManager_1 = require("../../gcp/secretManager");
const logger_1 = require("../../logger");
const fsutils = require("../../fsutils");
const backend = require("./backend");
const utils = require("../../utils");
const secrets = require("../../functions/secrets");
const services_1 = require("./services");
function matchingIds(endpoints, filter) {
    return endpoints
        .filter(filter)
        .map((endpoint) => endpoint.id)
        .join(",");
}
const mem = (endpoint) => endpoint.availableMemoryMb || backend.DEFAULT_MEMORY;
const cpu = (endpoint) => {
    var _a;
    return endpoint.cpu === "gcf_gen1"
        ? backend.memoryToGen1Cpu(mem(endpoint))
        : (_a = endpoint.cpu) !== null && _a !== void 0 ? _a : backend.memoryToGen2Cpu(mem(endpoint));
};
function endpointsAreValid(wantBackend) {
    const endpoints = backend.allEndpoints(wantBackend);
    functionIdsAreValid(endpoints);
    for (const ep of endpoints) {
        (0, services_1.serviceForEndpoint)(ep).validateTrigger(ep, wantBackend);
    }
    const gcfV1WithConcurrency = matchingIds(endpoints, (endpoint) => (endpoint.concurrency || 1) !== 1 && endpoint.platform === "gcfv1");
    if (gcfV1WithConcurrency.length) {
        const msg = `Cannot set concurrency on the functions ${gcfV1WithConcurrency} because they are GCF gen 1`;
        throw new error_1.FirebaseError(msg);
    }
    const tooSmallForConcurrency = matchingIds(endpoints, (endpoint) => {
        if ((endpoint.concurrency || 1) === 1) {
            return false;
        }
        return cpu(endpoint) < backend.MIN_CPU_FOR_CONCURRENCY;
    });
    if (tooSmallForConcurrency.length) {
        const msg = "The following functions are configured to allow concurrent " +
            "execution and less than one full CPU. This is not supported: " +
            tooSmallForConcurrency;
        throw new error_1.FirebaseError(msg);
    }
    cpuConfigIsValid(endpoints);
}
exports.endpointsAreValid = endpointsAreValid;
function cpuConfigIsValid(endpoints) {
    const gcfV1WithCPU = matchingIds(endpoints, (endpoint) => endpoint.platform === "gcfv1" && typeof endpoint["cpu"] !== "undefined");
    if (gcfV1WithCPU.length) {
        const msg = `Cannot set CPU on the functions ${gcfV1WithCPU} because they are GCF gen 1`;
        throw new error_1.FirebaseError(msg);
    }
    const invalidCPU = matchingIds(endpoints, (endpoint) => {
        const c = cpu(endpoint);
        if (c < 0.08) {
            return true;
        }
        if (c < 1) {
            return false;
        }
        return ![1, 2, 4, 6, 8].includes(c);
    });
    if (invalidCPU.length) {
        const msg = `The following functions have invalid CPU settings ${invalidCPU}. Valid CPU options are (0.08, 1], 2, 4, 6, 8, or "gcf_gen1"`;
        throw new error_1.FirebaseError(msg);
    }
    const smallCPURegions = ["australia-southeast2", "asia-northeast3", "asia-south2"];
    const tooBigCPUForRegion = matchingIds(endpoints, (endpoint) => smallCPURegions.includes(endpoint.region) && cpu(endpoint) > 4);
    if (tooBigCPUForRegion) {
        const msg = `The functions ${tooBigCPUForRegion} have > 4 CPU in a region that supports a maximum 4 CPU`;
        throw new error_1.FirebaseError(msg);
    }
    const tooSmallCPUSmall = matchingIds(endpoints, (endpoint) => mem(endpoint) > 512 && cpu(endpoint) < 0.5);
    if (tooSmallCPUSmall) {
        const msg = `The functions ${tooSmallCPUSmall} have too little CPU for their memory allocation. A minimum of 0.5 CPU is needed to set a memory limit greater than 512MiB`;
        throw new error_1.FirebaseError(msg);
    }
    const tooSmallCPUBig = matchingIds(endpoints, (endpoint) => mem(endpoint) > 1024 && cpu(endpoint) < 1);
    if (tooSmallCPUBig) {
        const msg = `The functions ${tooSmallCPUSmall} have too little CPU for their memory allocation. A minimum of 1 CPU is needed to set a memory limit greater than 1GiB`;
        throw new error_1.FirebaseError(msg);
    }
    const tooSmallMemory4CPU = matchingIds(endpoints, (endpoint) => cpu(endpoint) === 4 && mem(endpoint) < 2 << 10);
    if (tooSmallMemory4CPU) {
        const msg = `The functions ${tooSmallMemory4CPU} have too little memory for their CPU. Functions with 4 CPU require at least 2GiB`;
        throw new error_1.FirebaseError(msg);
    }
    const tooSmallMemory6CPU = matchingIds(endpoints, (endpoint) => cpu(endpoint) === 6 && mem(endpoint) < 3 << 10);
    if (tooSmallMemory6CPU) {
        const msg = `The functions ${tooSmallMemory6CPU} have too little memory for their CPU. Functions with 6 CPU require at least 3GiB`;
        throw new error_1.FirebaseError(msg);
    }
    const tooSmallMemory8CPU = matchingIds(endpoints, (endpoint) => cpu(endpoint) === 8 && mem(endpoint) < 4 << 10);
    if (tooSmallMemory8CPU) {
        const msg = `The functions ${tooSmallMemory8CPU} have too little memory for their CPU. Functions with 8 CPU require at least 4GiB`;
        throw new error_1.FirebaseError(msg);
    }
}
exports.cpuConfigIsValid = cpuConfigIsValid;
function endpointsAreUnique(backends) {
    const endpointToCodebases = {};
    for (const [codebase, b] of Object.entries(backends)) {
        for (const endpoint of backend.allEndpoints(b)) {
            const key = backend.functionName(endpoint);
            const cs = endpointToCodebases[key] || new Set();
            cs.add(codebase);
            endpointToCodebases[key] = cs;
        }
    }
    const conflicts = {};
    for (const [fn, codebases] of Object.entries(endpointToCodebases)) {
        if (codebases.size > 1) {
            conflicts[fn] = Array.from(codebases);
        }
    }
    if (Object.keys(conflicts).length === 0) {
        return;
    }
    const msgs = Object.entries(conflicts).map(([fn, codebases]) => `${fn}: ${codebases.join(",")}`);
    throw new error_1.FirebaseError("More than one codebase claims following functions:\n\t" + `${msgs.join("\n\t")}`);
}
exports.endpointsAreUnique = endpointsAreUnique;
function functionsDirectoryExists(sourceDir, projectDir) {
    if (!fsutils.dirExistsSync(sourceDir)) {
        const sourceDirName = path.relative(projectDir, sourceDir);
        const msg = `could not deploy functions because the ${clc.bold('"' + sourceDirName + '"')} ` +
            `directory was not found. Please create it or specify a different source directory in firebase.json`;
        throw new error_1.FirebaseError(msg);
    }
}
exports.functionsDirectoryExists = functionsDirectoryExists;
function functionIdsAreValid(functions) {
    const v1FunctionName = /^[a-zA-Z][a-zA-Z0-9_-]{0,62}$/;
    const invalidV1Ids = functions.filter((fn) => {
        return fn.platform === "gcfv1" && !v1FunctionName.test(fn.id);
    });
    if (invalidV1Ids.length !== 0) {
        const msg = `${invalidV1Ids.map((f) => f.id).join(", ")} function name(s) can only contain letters, ` +
            `numbers, hyphens, and not exceed 62 characters in length`;
        throw new error_1.FirebaseError(msg);
    }
    const v2FunctionName = /^[a-z][a-z0-9-]{0,62}$/;
    const invalidV2Ids = functions.filter((fn) => {
        return fn.platform === "gcfv2" && !v2FunctionName.test(fn.id);
    });
    if (invalidV2Ids.length !== 0) {
        const msg = `${invalidV2Ids.map((f) => f.id).join(", ")} v2 function name(s) can only contain lower ` +
            `case letters, numbers, hyphens, and not exceed 62 characters in length`;
        throw new error_1.FirebaseError(msg);
    }
}
exports.functionIdsAreValid = functionIdsAreValid;
async function secretsAreValid(projectId, wantBackend) {
    const endpoints = backend
        .allEndpoints(wantBackend)
        .filter((e) => e.secretEnvironmentVariables && e.secretEnvironmentVariables.length > 0);
    validatePlatformTargets(endpoints);
    await validateSecretVersions(projectId, endpoints);
}
exports.secretsAreValid = secretsAreValid;
const secretsSupportedPlatforms = ["gcfv1", "gcfv2"];
function validatePlatformTargets(endpoints) {
    const unsupported = endpoints.filter((e) => !secretsSupportedPlatforms.includes(e.platform));
    if (unsupported.length > 0) {
        const errs = unsupported.map((e) => `${e.id}[platform=${e.platform}]`);
        throw new error_1.FirebaseError(`Tried to set secret environment variables on ${errs.join(", ")}. ` +
            `Only ${secretsSupportedPlatforms.join(", ")} support secret environments.`);
    }
}
async function validateSecretVersions(projectId, endpoints) {
    const toResolve = new Set();
    for (const s of secrets.of(endpoints)) {
        toResolve.add(s.secret);
    }
    const results = await utils.allSettled(Array.from(toResolve).map(async (secret) => {
        const sv = await (0, secretManager_1.getSecretVersion)(projectId, secret, "latest");
        logger_1.logger.debug(`Resolved secret version of ${clc.bold(secret)} to ${clc.bold(sv.versionId)}.`);
        return sv;
    }));
    const secretVersions = {};
    const errs = [];
    for (const result of results) {
        if (result.status === "fulfilled") {
            const sv = result.value;
            if (sv.state !== "ENABLED") {
                errs.push(new error_1.FirebaseError(`Expected secret ${sv.secret.name}@${sv.versionId} to be in state ENABLED not ${sv.state}.`));
            }
            secretVersions[sv.secret.name] = sv;
        }
        else {
            errs.push(new error_1.FirebaseError(result.reason.message));
        }
    }
    if (errs.length) {
        throw new error_1.FirebaseError("Failed to validate secret versions", { children: errs });
    }
    for (const s of secrets.of(endpoints)) {
        s.version = secretVersions[s.secret].versionId;
        if (!s.version) {
            throw new error_1.FirebaseError("Secret version is unexpectedly undefined. This should never happen.");
        }
    }
}
