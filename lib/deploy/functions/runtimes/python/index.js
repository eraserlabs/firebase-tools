"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Delegate = exports.getPythonBinary = exports.tryCreateDelegate = exports.LATEST_VERSION = void 0;
const fs = require("fs");
const path = require("path");
const node_fetch_1 = require("node-fetch");
const util_1 = require("util");
const portfinder = require("portfinder");
const runtimes = require("..");
const discovery = require("../discovery");
const logger_1 = require("../../../../logger");
const python_1 = require("../../../../functions/python");
const error_1 = require("../../../../error");
exports.LATEST_VERSION = "python310";
async function tryCreateDelegate(context) {
    const requirementsTextPath = path.join(context.sourceDir, "requirements.txt");
    if (!(await (0, util_1.promisify)(fs.exists)(requirementsTextPath))) {
        logger_1.logger.debug("Customer code is not Python code.");
        return;
    }
    const runtime = context.runtime ? context.runtime : exports.LATEST_VERSION;
    if (!runtimes.isValidRuntime(runtime)) {
        throw new error_1.FirebaseError(`Runtime ${runtime} is not a valid Python runtime`);
    }
    return Promise.resolve(new Delegate(context.projectId, context.sourceDir, runtime));
}
exports.tryCreateDelegate = tryCreateDelegate;
function getPythonBinary(runtime) {
    if (process.platform === "win32") {
        return "python.exe";
    }
    if (runtime === "python310") {
        return "python3.10";
    }
    else if (runtime === "python311") {
        return "python3.11";
    }
    return "python";
}
exports.getPythonBinary = getPythonBinary;
class Delegate {
    constructor(projectId, sourceDir, runtime) {
        this.projectId = projectId;
        this.sourceDir = sourceDir;
        this.runtime = runtime;
        this.name = "python";
        this._bin = "";
        this._modulesDir = "";
    }
    get bin() {
        if (this._bin === "") {
            this._bin = this.getPythonBinary();
        }
        return this._bin;
    }
    async modulesDir() {
        var _a;
        if (!this._modulesDir) {
            const child = (0, python_1.runWithVirtualEnv)([
                this.bin,
                "-c",
                '"import firebase_functions; import os; print(os.path.dirname(firebase_functions.__file__))"',
            ], this.sourceDir, {});
            let out = "";
            (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (chunk) => {
                const chunkString = chunk.toString();
                out = out + chunkString;
                logger_1.logger.debug(`stdout: ${chunkString}`);
            });
            await new Promise((resolve, reject) => {
                child.on("exit", resolve);
                child.on("error", reject);
            });
            this._modulesDir = out.trim();
        }
        return this._modulesDir;
    }
    getPythonBinary() {
        return getPythonBinary(this.runtime);
    }
    validate() {
        return Promise.resolve();
    }
    watch() {
        return Promise.resolve(() => Promise.resolve());
    }
    async build() {
        return Promise.resolve();
    }
    async serveAdmin(port, envs) {
        var _a, _b;
        const modulesDir = await this.modulesDir();
        const envWithAdminPort = Object.assign(Object.assign({}, envs), { ADMIN_PORT: port.toString() });
        const args = [this.bin, path.join(modulesDir, "private", "serving.py")];
        logger_1.logger.debug(`Running admin server with args: ${JSON.stringify(args)} and env: ${JSON.stringify(envWithAdminPort)} in ${this.sourceDir}`);
        const childProcess = (0, python_1.runWithVirtualEnv)(args, this.sourceDir, envWithAdminPort);
        (_a = childProcess.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (chunk) => {
            const chunkString = chunk.toString();
            logger_1.logger.debug(`stdout: ${chunkString}`);
        });
        (_b = childProcess.stderr) === null || _b === void 0 ? void 0 : _b.on("data", (chunk) => {
            const chunkString = chunk.toString();
            logger_1.logger.debug(`stderr: ${chunkString}`);
        });
        return Promise.resolve(async () => {
            await (0, node_fetch_1.default)(`http://127.0.0.1:${port}/__/quitquitquit`);
            const quitTimeout = setTimeout(() => {
                if (!childProcess.killed) {
                    childProcess.kill("SIGKILL");
                }
            }, 10000);
            clearTimeout(quitTimeout);
        });
    }
    async discoverBuild(_configValues, envs) {
        let discovered = await discovery.detectFromYaml(this.sourceDir, this.projectId, this.runtime);
        if (!discovered) {
            const adminPort = await portfinder.getPortPromise({
                port: 8081,
            });
            const killProcess = await this.serveAdmin(adminPort, envs);
            try {
                discovered = await discovery.detectFromPort(adminPort, this.projectId, this.runtime);
            }
            finally {
                await killProcess();
            }
        }
        return discovered;
    }
}
exports.Delegate = Delegate;
