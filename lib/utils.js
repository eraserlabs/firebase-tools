"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectableHostname = exports.randomInt = exports.debounce = exports.last = exports.cloneDeep = exports.groupBy = exports.assertIsStringOrUndefined = exports.assertIsNumber = exports.assertIsString = exports.assertDefined = exports.thirtyDaysFromNow = exports.isRunningInWSL = exports.isCloudEnvironment = exports.datetimeString = exports.createDestroyer = exports.promiseWithSpinner = exports.setupLoggers = exports.tryParse = exports.tryStringify = exports.promiseProps = exports.withTimeout = exports.promiseWhile = exports.promiseAllSettled = exports.getFunctionsEventProvider = exports.endpoint = exports.makeActiveProject = exports.streamToString = exports.stringToStream = exports.explainStdin = exports.allSettled = exports.reject = exports.logLabeledError = exports.logLabeledWarning = exports.logWarning = exports.logLabeledBullet = exports.logBullet = exports.logLabeledSuccess = exports.logSuccess = exports.addSubdomain = exports.addDatabaseNamespace = exports.getDatabaseViewDataUrl = exports.getDatabaseUrl = exports.envOverride = exports.getInheritedOption = exports.consoleUrl = exports.envOverrides = void 0;
const _ = require("lodash");
const url = require("url");
const clc = require("colorette");
const ora = require("ora");
const process = require("process");
const stream_1 = require("stream");
const winston = require("winston");
const triple_beam_1 = require("triple-beam");
const assert_1 = require("assert");
const stripAnsi = require("strip-ansi");
const configstore_1 = require("./configstore");
const error_1 = require("./error");
const logger_1 = require("./logger");
const IS_WINDOWS = process.platform === "win32";
const SUCCESS_CHAR = IS_WINDOWS ? "+" : "✔";
const WARNING_CHAR = IS_WINDOWS ? "!" : "⚠";
const ERROR_CHAR = IS_WINDOWS ? "!!" : "⬢";
const THIRTY_DAYS_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;
exports.envOverrides = [];
function consoleUrl(project, path) {
    const api = require("./api");
    return `${api.consoleOrigin}/project/${project}${path}`;
}
exports.consoleUrl = consoleUrl;
function getInheritedOption(options, key) {
    let target = options;
    while (target) {
        if (target[key] !== undefined) {
            return target[key];
        }
        target = target.parent;
    }
}
exports.getInheritedOption = getInheritedOption;
function envOverride(envname, value, coerce) {
    const currentEnvValue = process.env[envname];
    if (currentEnvValue && currentEnvValue.length) {
        exports.envOverrides.push(envname);
        if (coerce) {
            try {
                return coerce(currentEnvValue, value);
            }
            catch (e) {
                return value;
            }
        }
        return currentEnvValue;
    }
    return value;
}
exports.envOverride = envOverride;
function getDatabaseUrl(origin, namespace, pathname) {
    const withPath = url.resolve(origin, pathname);
    return addDatabaseNamespace(withPath, namespace);
}
exports.getDatabaseUrl = getDatabaseUrl;
function getDatabaseViewDataUrl(origin, project, namespace, pathname) {
    const urlObj = new url.URL(origin);
    if (urlObj.hostname.includes("firebaseio") || urlObj.hostname.includes("firebasedatabase")) {
        return consoleUrl(project, `/database/${namespace}/data${pathname}`);
    }
    return getDatabaseUrl(origin, namespace, pathname + ".json");
}
exports.getDatabaseViewDataUrl = getDatabaseViewDataUrl;
function addDatabaseNamespace(origin, namespace) {
    const urlObj = new url.URL(origin);
    if (urlObj.hostname.includes(namespace)) {
        return urlObj.href;
    }
    if (urlObj.hostname.includes("firebaseio") || urlObj.hostname.includes("firebasedatabase")) {
        return addSubdomain(origin, namespace);
    }
    urlObj.searchParams.set("ns", namespace);
    return urlObj.href;
}
exports.addDatabaseNamespace = addDatabaseNamespace;
function addSubdomain(origin, subdomain) {
    return origin.replace("//", `//${subdomain}.`);
}
exports.addSubdomain = addSubdomain;
function logSuccess(message, type = "info", data = undefined) {
    logger_1.logger[type](clc.green(clc.bold(`${SUCCESS_CHAR} `)), message, data);
}
exports.logSuccess = logSuccess;
function logLabeledSuccess(label, message, type = "info", data = undefined) {
    logger_1.logger[type](clc.green(clc.bold(`${SUCCESS_CHAR}  ${label}:`)), message, data);
}
exports.logLabeledSuccess = logLabeledSuccess;
function logBullet(message, type = "info", data = undefined) {
    logger_1.logger[type](clc.cyan(clc.bold("i ")), message, data);
}
exports.logBullet = logBullet;
function logLabeledBullet(label, message, type = "info", data = undefined) {
    logger_1.logger[type](clc.cyan(clc.bold(`i  ${label}:`)), message, data);
}
exports.logLabeledBullet = logLabeledBullet;
function logWarning(message, type = "warn", data = undefined) {
    logger_1.logger[type](clc.yellow(clc.bold(`${WARNING_CHAR} `)), message, data);
}
exports.logWarning = logWarning;
function logLabeledWarning(label, message, type = "warn", data = undefined) {
    logger_1.logger[type](clc.yellow(clc.bold(`${WARNING_CHAR}  ${label}:`)), message, data);
}
exports.logLabeledWarning = logLabeledWarning;
function logLabeledError(label, message, type = "error", data = undefined) {
    logger_1.logger[type](clc.red(clc.bold(`${ERROR_CHAR}  ${label}:`)), message, data);
}
exports.logLabeledError = logLabeledError;
function reject(message, options) {
    return Promise.reject(new error_1.FirebaseError(message, options));
}
exports.reject = reject;
function allSettled(promises) {
    if (!promises.length) {
        return Promise.resolve([]);
    }
    return new Promise((resolve) => {
        let remaining = promises.length;
        const results = [];
        for (let i = 0; i < promises.length; i++) {
            void Promise.resolve(promises[i])
                .then((result) => {
                results[i] = {
                    status: "fulfilled",
                    value: result,
                };
            }, (err) => {
                results[i] = {
                    status: "rejected",
                    reason: err,
                };
            })
                .then(() => {
                if (!--remaining) {
                    resolve(results);
                }
            });
        }
    });
}
exports.allSettled = allSettled;
function explainStdin() {
    if (IS_WINDOWS) {
        throw new error_1.FirebaseError("STDIN input is not available on Windows.", {
            exit: 1,
        });
    }
    if (process.stdin.isTTY) {
        logger_1.logger.info(clc.bold("Note:"), "Reading STDIN. Type JSON data and then press Ctrl-D");
    }
}
exports.explainStdin = explainStdin;
function stringToStream(text) {
    if (!text) {
        return undefined;
    }
    const s = new stream_1.Readable();
    s.push(text);
    s.push(null);
    return s;
}
exports.stringToStream = stringToStream;
function streamToString(s) {
    return new Promise((resolve, reject) => {
        let b = "";
        s.on("error", reject);
        s.on("data", (d) => (b += `${d}`));
        s.once("end", () => resolve(b));
    });
}
exports.streamToString = streamToString;
function makeActiveProject(projectDir, newActive) {
    const activeProjects = configstore_1.configstore.get("activeProjects") || {};
    if (newActive) {
        activeProjects[projectDir] = newActive;
    }
    else {
        _.unset(activeProjects, projectDir);
    }
    configstore_1.configstore.set("activeProjects", activeProjects);
}
exports.makeActiveProject = makeActiveProject;
function endpoint(parts) {
    return `/${parts.join("/")}`;
}
exports.endpoint = endpoint;
function getFunctionsEventProvider(eventType) {
    const parts = eventType.split("/");
    if (parts.length > 1) {
        const provider = last(parts[1].split("."));
        return _.capitalize(provider);
    }
    if (/google.pubsub/.exec(eventType)) {
        return "PubSub";
    }
    else if (/google.storage/.exec(eventType)) {
        return "Storage";
    }
    else if (/google.analytics/.exec(eventType)) {
        return "Analytics";
    }
    else if (/google.firebase.database/.exec(eventType)) {
        return "Database";
    }
    else if (/google.firebase.auth/.exec(eventType)) {
        return "Auth";
    }
    else if (/google.firebase.crashlytics/.exec(eventType)) {
        return "Crashlytics";
    }
    else if (/google.firestore/.exec(eventType)) {
        return "Firestore";
    }
    return _.capitalize(eventType.split(".")[1]);
}
exports.getFunctionsEventProvider = getFunctionsEventProvider;
function promiseAllSettled(promises) {
    const wrappedPromises = promises.map(async (p) => {
        try {
            const val = await Promise.resolve(p);
            return { state: "fulfilled", value: val };
        }
        catch (err) {
            return { state: "rejected", reason: err };
        }
    });
    return Promise.all(wrappedPromises);
}
exports.promiseAllSettled = promiseAllSettled;
async function promiseWhile(action, check, interval = 2500) {
    return new Promise((resolve, promiseReject) => {
        const run = async () => {
            try {
                const res = await action();
                if (check(res)) {
                    return resolve(res);
                }
                setTimeout(run, interval);
            }
            catch (err) {
                return promiseReject(err);
            }
        };
        run();
    });
}
exports.promiseWhile = promiseWhile;
function withTimeout(timeoutMs, promise) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timed out.")), timeoutMs);
        promise.then((value) => {
            clearTimeout(timeout);
            resolve(value);
        }, (err) => {
            clearTimeout(timeout);
            reject(err);
        });
    });
}
exports.withTimeout = withTimeout;
async function promiseProps(obj) {
    const resultObj = {};
    const promises = Object.keys(obj).map(async (key) => {
        const r = await Promise.resolve(obj[key]);
        resultObj[key] = r;
    });
    return Promise.all(promises).then(() => resultObj);
}
exports.promiseProps = promiseProps;
function tryStringify(value) {
    if (typeof value === "string") {
        return value;
    }
    try {
        return JSON.stringify(value);
    }
    catch (_a) {
        return value;
    }
}
exports.tryStringify = tryStringify;
function tryParse(value) {
    if (typeof value !== "string") {
        return value;
    }
    try {
        return JSON.parse(value);
    }
    catch (_a) {
        return value;
    }
}
exports.tryParse = tryParse;
function setupLoggers() {
    if (process.env.DEBUG) {
        logger_1.logger.add(new winston.transports.Console({
            level: "debug",
            format: winston.format.printf((info) => {
                const segments = [info.message, ...(info[triple_beam_1.SPLAT] || [])].map(tryStringify);
                return `${stripAnsi(segments.join(" "))}`;
            }),
        }));
    }
    else if (process.env.IS_FIREBASE_CLI) {
        logger_1.logger.add(new winston.transports.Console({
            level: "info",
            format: winston.format.printf((info) => [info.message, ...(info[triple_beam_1.SPLAT] || [])]
                .filter((chunk) => typeof chunk === "string")
                .join(" ")),
        }));
    }
}
exports.setupLoggers = setupLoggers;
async function promiseWithSpinner(action, message) {
    const spinner = ora(message).start();
    let data;
    try {
        data = await action();
        spinner.succeed();
    }
    catch (err) {
        spinner.fail();
        throw err;
    }
    return data;
}
exports.promiseWithSpinner = promiseWithSpinner;
function createDestroyer(server) {
    const connections = new Set();
    server.on("connection", (conn) => {
        connections.add(conn);
        conn.once("close", () => connections.delete(conn));
    });
    let destroyPromise = undefined;
    return function destroyer() {
        if (!destroyPromise) {
            destroyPromise = new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err)
                        return reject(err);
                    resolve();
                });
                connections.forEach((socket) => socket.destroy());
            });
        }
        return destroyPromise;
    };
}
exports.createDestroyer = createDestroyer;
function datetimeString(d) {
    const day = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    const time = `${d.getHours().toString().padStart(2, "0")}:${d
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
    return `${day} ${time}`;
}
exports.datetimeString = datetimeString;
function isCloudEnvironment() {
    return !!process.env.CODESPACES || !!process.env.GOOGLE_CLOUD_WORKSTATIONS;
}
exports.isCloudEnvironment = isCloudEnvironment;
function isRunningInWSL() {
    return !!process.env.WSL_DISTRO_NAME;
}
exports.isRunningInWSL = isRunningInWSL;
function thirtyDaysFromNow() {
    return new Date(Date.now() + THIRTY_DAYS_IN_MILLISECONDS);
}
exports.thirtyDaysFromNow = thirtyDaysFromNow;
function assertDefined(val, message) {
    if (val === undefined || val === null) {
        throw new assert_1.AssertionError({
            message: message || `expected value to be defined but got "${val}"`,
        });
    }
}
exports.assertDefined = assertDefined;
function assertIsString(val, message) {
    if (typeof val !== "string") {
        throw new assert_1.AssertionError({
            message: message || `expected "string" but got "${typeof val}"`,
        });
    }
}
exports.assertIsString = assertIsString;
function assertIsNumber(val, message) {
    if (typeof val !== "number") {
        throw new assert_1.AssertionError({
            message: message || `expected "number" but got "${typeof val}"`,
        });
    }
}
exports.assertIsNumber = assertIsNumber;
function assertIsStringOrUndefined(val, message) {
    if (!(val === undefined || typeof val === "string")) {
        throw new assert_1.AssertionError({
            message: message || `expected "string" or "undefined" but got "${typeof val}"`,
        });
    }
}
exports.assertIsStringOrUndefined = assertIsStringOrUndefined;
function groupBy(arr, f) {
    return arr.reduce((result, item) => {
        const key = f(item);
        if (result[key]) {
            result[key].push(item);
        }
        else {
            result[key] = [item];
        }
        return result;
    }, {});
}
exports.groupBy = groupBy;
function cloneArray(arr) {
    return arr.map((e) => cloneDeep(e));
}
function cloneObject(obj) {
    const clone = {};
    for (const [k, v] of Object.entries(obj)) {
        clone[k] = cloneDeep(v);
    }
    return clone;
}
function cloneDeep(obj) {
    if (typeof obj !== "object" || !obj) {
        return obj;
    }
    if (obj instanceof RegExp) {
        return RegExp(obj, obj.flags);
    }
    if (obj instanceof Date) {
        return new Date(obj);
    }
    if (Array.isArray(obj)) {
        return cloneArray(obj);
    }
    if (obj instanceof Map) {
        return new Map(obj.entries());
    }
    return cloneObject(obj);
}
exports.cloneDeep = cloneDeep;
function last(arr) {
    if (!Array.isArray(arr)) {
        return undefined;
    }
    return arr[arr.length - 1];
}
exports.last = last;
function debounce(fn, delay, { leading } = {}) {
    let timer;
    return (...args) => {
        if (!timer && leading) {
            fn(...args);
        }
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
exports.debounce = debounce;
function randomInt(min, max) {
    min = Math.floor(min);
    max = Math.ceil(max) + 1;
    return Math.floor(Math.random() * (max - min) + min);
}
exports.randomInt = randomInt;
function connectableHostname(hostname) {
    if (hostname === "0.0.0.0") {
        hostname = "127.0.0.1";
    }
    else if (hostname === "::") {
        hostname = "::1";
    }
    else if (hostname === "[::]") {
        hostname = "[::1]";
    }
    return hostname;
}
exports.connectableHostname = connectableHostname;
