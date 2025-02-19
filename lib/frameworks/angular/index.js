"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ɵcodegenFunctionsDirectory = exports.ɵcodegenPublicDirectory = exports.getDevModeHandle = exports.build = exports.init = exports.discover = exports.type = exports.support = exports.name = void 0;
const path_1 = require("path");
const child_process_1 = require("child_process");
const cross_spawn_1 = require("cross-spawn");
const fs_extra_1 = require("fs-extra");
const promises_1 = require("fs/promises");
const __1 = require("..");
const prompt_1 = require("../../prompt");
const proxy_1 = require("../../hosting/proxy");
const utils_1 = require("../utils");
exports.name = "Angular";
exports.support = "experimental";
exports.type = 3;
const CLI_COMMAND = (0, path_1.join)("node_modules", ".bin", process.platform === "win32" ? "ng.cmd" : "ng");
const DEFAULT_BUILD_SCRIPT = ["ng build"];
async function discover(dir) {
    if (!(await (0, fs_extra_1.pathExists)((0, path_1.join)(dir, "package.json"))))
        return;
    if (!(await (0, fs_extra_1.pathExists)((0, path_1.join)(dir, "angular.json"))))
        return;
    const { serverTarget } = await getContext(dir);
    return { mayWantBackend: !!serverTarget, publicDirectory: (0, path_1.join)(dir, "src", "assets") };
}
exports.discover = discover;
async function init(setup, config) {
    (0, child_process_1.execSync)(`npx --yes -p @angular/cli@latest ng new ${setup.projectId} --directory ${setup.hosting.source} --skip-git`, {
        stdio: "inherit",
        cwd: config.projectDir,
    });
    const useAngularUniversal = await (0, prompt_1.promptOnce)({
        name: "useAngularUniversal",
        type: "confirm",
        default: false,
        message: `Would you like to setup Angular Universal?`,
    });
    if (useAngularUniversal) {
        (0, child_process_1.execSync)("ng add @nguniversal/express-engine --skip-confirmation", {
            stdio: "inherit",
            cwd: (0, path_1.join)(config.projectDir, setup.hosting.source),
        });
    }
}
exports.init = init;
async function build(dir) {
    const { targetStringFromTarget } = (0, __1.relativeRequire)(dir, "@angular-devkit/architect");
    const { architect, browserTarget, prerenderTarget, serverTarget } = await getContext(dir);
    const scheduleTarget = async (target) => {
        const run = await architect.scheduleTarget(target, undefined);
        const { success, error } = await run.output.toPromise();
        if (!success)
            throw new Error(error);
    };
    await (0, utils_1.warnIfCustomBuildScript)(dir, exports.name, DEFAULT_BUILD_SCRIPT);
    if (!browserTarget)
        throw new Error("No build target...");
    if (prerenderTarget) {
        (0, child_process_1.execSync)(`${CLI_COMMAND} run ${targetStringFromTarget(prerenderTarget)}`, {
            cwd: dir,
            stdio: "inherit",
        });
    }
    else {
        await scheduleTarget(browserTarget);
        if (serverTarget)
            await scheduleTarget(serverTarget);
    }
    const wantsBackend = !!serverTarget;
    return { wantsBackend };
}
exports.build = build;
async function getDevModeHandle(dir) {
    const { targetStringFromTarget } = (0, __1.relativeRequire)(dir, "@angular-devkit/architect");
    const { serveTarget } = await getContext(dir);
    if (!serveTarget)
        return;
    const host = new Promise((resolve) => {
        const serve = (0, cross_spawn_1.spawn)(CLI_COMMAND, ["run", targetStringFromTarget(serveTarget), "--host", "localhost"], { cwd: dir });
        serve.stdout.on("data", (data) => {
            process.stdout.write(data);
            const match = data.toString().match(/(http:\/\/localhost:\d+)/);
            if (match)
                resolve(match[1]);
        });
        serve.stderr.on("data", (data) => {
            process.stderr.write(data);
        });
    });
    return (0, proxy_1.proxyRequestHandler)(await host, "Angular Live Development Server", { forceCascade: true });
}
exports.getDevModeHandle = getDevModeHandle;
async function ɵcodegenPublicDirectory(sourceDir, destDir) {
    const { architectHost, browserTarget } = await getContext(sourceDir);
    if (!browserTarget)
        throw new Error("No browser target");
    const browserTargetOptions = await architectHost.getOptionsForTarget(browserTarget);
    if (typeof (browserTargetOptions === null || browserTargetOptions === void 0 ? void 0 : browserTargetOptions.outputPath) !== "string")
        throw new Error("browserTarget output path is not a string");
    const browserOutputPath = browserTargetOptions.outputPath;
    await (0, promises_1.mkdir)(destDir, { recursive: true });
    await (0, fs_extra_1.copy)((0, path_1.join)(sourceDir, browserOutputPath), destDir);
}
exports.ɵcodegenPublicDirectory = ɵcodegenPublicDirectory;
async function ɵcodegenFunctionsDirectory(sourceDir, destDir) {
    var _a;
    const { architectHost, host, serverTarget, browserTarget } = await getContext(sourceDir);
    if (!serverTarget)
        throw new Error("No server target");
    if (!browserTarget)
        throw new Error("No browser target");
    const packageJson = JSON.parse(await host.readFile((0, path_1.join)(sourceDir, "package.json")));
    const serverTargetOptions = await architectHost.getOptionsForTarget(serverTarget);
    if (typeof (serverTargetOptions === null || serverTargetOptions === void 0 ? void 0 : serverTargetOptions.outputPath) !== "string")
        throw new Error("serverTarget output path is not a string");
    const browserTargetOptions = await architectHost.getOptionsForTarget(browserTarget);
    if (typeof (browserTargetOptions === null || browserTargetOptions === void 0 ? void 0 : browserTargetOptions.outputPath) !== "string")
        throw new Error("browserTarget output path is not a string");
    const browserOutputPath = browserTargetOptions.outputPath;
    const serverOutputPath = serverTargetOptions.outputPath;
    await (0, promises_1.mkdir)((0, path_1.join)(destDir, serverOutputPath), { recursive: true });
    await (0, promises_1.mkdir)((0, path_1.join)(destDir, browserOutputPath), { recursive: true });
    await (0, fs_extra_1.copy)((0, path_1.join)(sourceDir, serverOutputPath), (0, path_1.join)(destDir, serverOutputPath));
    await (0, fs_extra_1.copy)((0, path_1.join)(sourceDir, browserOutputPath), (0, path_1.join)(destDir, browserOutputPath));
    const bootstrapScript = `exports.handle = require('./${serverOutputPath}/main.js').app();\n`;
    const bundleDependencies = (_a = serverTargetOptions.bundleDependencies) !== null && _a !== void 0 ? _a : true;
    if (bundleDependencies) {
        const dependencies = {};
        const externalDependencies = serverTargetOptions.externalDependencies || [];
        externalDependencies.forEach((externalDependency) => {
            var _a;
            const packageVersion = (_a = (0, __1.findDependency)(externalDependency)) === null || _a === void 0 ? void 0 : _a.version;
            if (packageVersion) {
                dependencies[externalDependency] = packageVersion;
            }
        });
        packageJson.dependencies = dependencies;
    }
    return { bootstrapScript, packageJson };
}
exports.ɵcodegenFunctionsDirectory = ɵcodegenFunctionsDirectory;
async function getContext(dir) {
    const { NodeJsAsyncHost } = (0, __1.relativeRequire)(dir, "@angular-devkit/core/node");
    const { workspaces } = (0, __1.relativeRequire)(dir, "@angular-devkit/core");
    const { WorkspaceNodeModulesArchitectHost } = (0, __1.relativeRequire)(dir, "@angular-devkit/architect/node");
    const { Architect, targetFromTargetString, targetStringFromTarget } = (0, __1.relativeRequire)(dir, "@angular-devkit/architect");
    const { parse } = (0, __1.relativeRequire)(dir, "jsonc-parser");
    const host = workspaces.createWorkspaceHost(new NodeJsAsyncHost());
    const { workspace } = await workspaces.readWorkspace(dir, host);
    const architectHost = new WorkspaceNodeModulesArchitectHost(workspace, dir);
    const architect = new Architect(architectHost);
    let project = globalThis.NG_DEPLOY_PROJECT;
    let browserTarget;
    let serverTarget;
    let prerenderTarget;
    let serveTarget;
    if (!project) {
        const angularJson = parse(await host.readFile((0, path_1.join)(dir, "angular.json")));
        project = angularJson.defaultProject;
    }
    if (!project) {
        const apps = [];
        workspace.projects.forEach((value, key) => {
            if (value.extensions.projectType === "application")
                apps.push(key);
        });
        if (apps.length === 1)
            project = apps[0];
    }
    if (!project)
        throw new Error("Unable to detirmine the application to deploy, you should use `ng deploy` via @angular/fire.");
    const workspaceProject = workspace.projects.get(project);
    if (!workspaceProject)
        throw new Error(`No project ${project} found.`);
    const deployTargetDefinition = workspaceProject.targets.get("deploy");
    if ((deployTargetDefinition === null || deployTargetDefinition === void 0 ? void 0 : deployTargetDefinition.builder) === "@angular/fire:deploy") {
        const options = deployTargetDefinition.options;
        if (typeof (options === null || options === void 0 ? void 0 : options.prerenderTarget) === "string")
            prerenderTarget = targetFromTargetString(options.prerenderTarget);
        if (typeof (options === null || options === void 0 ? void 0 : options.browserTarget) === "string")
            browserTarget = targetFromTargetString(options.browserTarget);
        if (typeof (options === null || options === void 0 ? void 0 : options.serverTarget) === "string")
            serverTarget = targetFromTargetString(options.serverTarget);
        if (!browserTarget)
            throw new Error("ng-deploy is missing a browser target. Plase check your angular.json.");
        if (prerenderTarget) {
            const prerenderOptions = await architectHost.getOptionsForTarget(prerenderTarget);
            if (targetStringFromTarget(browserTarget) !== (prerenderOptions === null || prerenderOptions === void 0 ? void 0 : prerenderOptions.browserTarget))
                throw new Error("ng-deploy's browserTarget and prerender's browserTarget do not match. Please check your angular.json");
            if (serverTarget && targetStringFromTarget(serverTarget) !== (prerenderOptions === null || prerenderOptions === void 0 ? void 0 : prerenderOptions.serverTarget))
                throw new Error("ng-deploy's serverTarget and prerender's serverTarget do not match. Please check your angular.json");
            if (!serverTarget)
                console.warn("Treating the application as fully rendered. Add a serverTarget to your deploy target in angular.json to utilize server-side rendering.");
        }
    }
    else if (workspaceProject.targets.has("prerender")) {
        const target = workspaceProject.targets.get("prerender");
        const configurations = Object.keys(target.configurations);
        const configuration = configurations.includes("production")
            ? "production"
            : target.defaultConfiguration;
        if (!configuration)
            throw new Error("No production or default configutation found for prerender.");
        if (configuration !== "production")
            console.warn(`Using ${configuration} configuration for the prerender, we suggest adding a production target.`);
        prerenderTarget = { project, target: "prerender", configuration };
        const production = await architectHost.getOptionsForTarget(prerenderTarget);
        if (typeof (production === null || production === void 0 ? void 0 : production.browserTarget) !== "string")
            throw new Error("Prerender browserTarget expected to be string, check your angular.json.");
        browserTarget = targetFromTargetString(production.browserTarget);
        if (typeof (production === null || production === void 0 ? void 0 : production.serverTarget) !== "string")
            throw new Error("Prerender serverTarget expected to be string, check your angular.json.");
        serverTarget = targetFromTargetString(production.serverTarget);
    }
    else {
        if (workspaceProject.targets.has("build")) {
            const target = workspaceProject.targets.get("build");
            const configurations = Object.keys(target.configurations);
            const configuration = configurations.includes("production")
                ? "production"
                : target.defaultConfiguration;
            if (!configuration)
                throw new Error("No production or default configutation found for build.");
            if (configuration !== "production")
                console.warn(`Using ${configuration} configuration for the browser deploy, we suggest adding a production target.`);
            browserTarget = { project, target: "build", configuration };
        }
        if (workspaceProject.targets.has("server")) {
            const target = workspaceProject.targets.get("server");
            const configurations = Object.keys(target.configurations);
            const configuration = configurations.includes("production")
                ? "production"
                : target.defaultConfiguration;
            if (!configuration)
                throw new Error("No production or default configutation found for server.");
            if (configuration !== "production")
                console.warn(`Using ${configuration} configuration for the server deploy, we suggest adding a production target.`);
            serverTarget = { project, target: "server", configuration };
        }
    }
    if (serverTarget && workspaceProject.targets.has("serve-ssr")) {
        const target = workspaceProject.targets.get("serve-ssr");
        const configurations = Object.keys(target.configurations);
        const configuration = configurations.includes("development")
            ? "development"
            : target.defaultConfiguration;
        if (!configuration)
            throw new Error("No development or default configutation found for serve-ssr.");
        if (configuration !== "development")
            console.warn(`Using ${configuration} configuration for the local server, we suggest adding a development target.`);
        serveTarget = { project, target: "serve-ssr", configuration };
    }
    else if (workspaceProject.targets.has("serve")) {
        if (serverTarget)
            console.warn(`No server-ssr target found.`);
        const target = workspaceProject.targets.get("serve");
        const configurations = Object.keys(target.configurations);
        const configuration = configurations.includes("development")
            ? "development"
            : target.defaultConfiguration;
        if (!configuration)
            throw new Error("No development or default configutation found for serve.");
        if (configuration !== "development")
            console.warn(`Using ${configuration} configuration for the local server, we suggest adding a development target.`);
        serveTarget = { project, target: "serve", configuration };
    }
    return {
        architect,
        architectHost,
        host,
        browserTarget,
        prerenderTarget,
        serverTarget,
        serveTarget,
    };
}
