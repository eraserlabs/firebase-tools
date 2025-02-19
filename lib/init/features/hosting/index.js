"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doSetup = void 0;
const clc = require("colorette");
const fs = require("fs");
const rimraf_1 = require("rimraf");
const apiv2_1 = require("../../../apiv2");
const github_1 = require("./github");
const prompt_1 = require("../../../prompt");
const logger_1 = require("../../../logger");
const frameworks_1 = require("../../../frameworks");
const experiments = require("../../../experiments");
const path_1 = require("path");
const INDEX_TEMPLATE = fs.readFileSync(__dirname + "/../../../../templates/init/hosting/index.html", "utf8");
const MISSING_TEMPLATE = fs.readFileSync(__dirname + "/../../../../templates/init/hosting/404.html", "utf8");
const DEFAULT_IGNORES = ["firebase.json", "**/.*", "**/node_modules/**"];
async function doSetup(setup, config) {
    var _a;
    setup.hosting = {};
    let discoveredFramework = experiments.isEnabled("webframeworks")
        ? await (0, frameworks_1.discover)(config.projectDir, false)
        : undefined;
    if (experiments.isEnabled("webframeworks")) {
        if (discoveredFramework) {
            const name = frameworks_1.WebFrameworks[discoveredFramework.framework].name;
            await (0, prompt_1.promptOnce)({
                name: "useDiscoveredFramework",
                type: "confirm",
                default: true,
                message: `Detected an existing ${name} codebase in the current directory, should we use this?`,
            }, setup.hosting);
        }
        if (setup.hosting.useDiscoveredFramework) {
            setup.hosting.source = ".";
            setup.hosting.useWebFrameworks = true;
        }
        else {
            await (0, prompt_1.promptOnce)({
                name: "useWebFrameworks",
                type: "confirm",
                default: false,
                message: `Do you want to use a web framework? (${clc.bold("experimental")})`,
            }, setup.hosting);
        }
    }
    if (setup.hosting.useWebFrameworks) {
        await (0, prompt_1.promptOnce)({
            name: "source",
            type: "input",
            default: "hosting",
            message: "What folder would you like to use for your web application's root directory?",
        }, setup.hosting);
        if (setup.hosting.source !== ".")
            delete setup.hosting.useDiscoveredFramework;
        discoveredFramework = await (0, frameworks_1.discover)((0, path_1.join)(config.projectDir, setup.hosting.source));
        if (discoveredFramework) {
            const name = frameworks_1.WebFrameworks[discoveredFramework.framework].name;
            await (0, prompt_1.promptOnce)({
                name: "useDiscoveredFramework",
                type: "confirm",
                default: true,
                message: `Detected an existing ${name} codebase in ${setup.hosting.source}, should we use this?`,
            }, setup.hosting);
        }
        if (setup.hosting.useDiscoveredFramework && discoveredFramework) {
            setup.hosting.webFramework = discoveredFramework.framework;
        }
        else {
            const choices = [];
            for (const value in frameworks_1.WebFrameworks) {
                if (frameworks_1.WebFrameworks[value]) {
                    const { name, init } = frameworks_1.WebFrameworks[value];
                    if (init)
                        choices.push({ name, value });
                }
            }
            const defaultChoice = (_a = choices.find(({ value }) => value === (discoveredFramework === null || discoveredFramework === void 0 ? void 0 : discoveredFramework.framework))) === null || _a === void 0 ? void 0 : _a.value;
            await (0, prompt_1.promptOnce)({
                name: "whichFramework",
                type: "list",
                message: "Please choose the framework:",
                default: defaultChoice,
                choices,
            }, setup.hosting);
            if (discoveredFramework)
                (0, rimraf_1.sync)(setup.hosting.source);
            await frameworks_1.WebFrameworks[setup.hosting.whichFramework].init(setup, config);
        }
        await (0, prompt_1.promptOnce)({
            name: "region",
            type: "list",
            message: "In which region would you like to host server-side content, if applicable?",
            default: frameworks_1.DEFAULT_REGION,
            choices: frameworks_1.ALLOWED_SSR_REGIONS,
        }, setup.hosting);
        setup.config.hosting = {
            source: setup.hosting.source,
            ignore: DEFAULT_IGNORES,
            frameworksBackend: {
                region: setup.hosting.region,
            },
        };
    }
    else {
        logger_1.logger.info();
        logger_1.logger.info(`Your ${clc.bold("public")} directory is the folder (relative to your project directory) that`);
        logger_1.logger.info(`will contain Hosting assets to be uploaded with ${clc.bold("firebase deploy")}. If you`);
        logger_1.logger.info("have a build process for your assets, use your build's output directory.");
        logger_1.logger.info();
        await (0, prompt_1.prompt)(setup.hosting, [
            {
                name: "public",
                type: "input",
                default: "public",
                message: "What do you want to use as your public directory?",
            },
            {
                name: "spa",
                type: "confirm",
                default: false,
                message: "Configure as a single-page app (rewrite all urls to /index.html)?",
            },
        ]);
        setup.config.hosting = {
            public: setup.hosting.public,
            ignore: DEFAULT_IGNORES,
        };
    }
    await (0, prompt_1.promptOnce)({
        name: "github",
        type: "confirm",
        default: false,
        message: "Set up automatic builds and deploys with GitHub?",
    }, setup.hosting);
    if (!setup.hosting.useWebFrameworks) {
        if (setup.hosting.spa) {
            setup.config.hosting.rewrites = [{ source: "**", destination: "/index.html" }];
        }
        else {
            await config.askWriteProjectFile(`${setup.hosting.public}/404.html`, MISSING_TEMPLATE);
        }
        const c = new apiv2_1.Client({ urlPrefix: "https://www.gstatic.com", auth: false });
        const response = await c.get("/firebasejs/releases.json");
        await config.askWriteProjectFile(`${setup.hosting.public}/index.html`, INDEX_TEMPLATE.replace(/{{VERSION}}/g, response.body.current.version));
    }
    if (setup.hosting.github) {
        return (0, github_1.initGitHub)(setup);
    }
}
exports.doSetup = doSetup;
