"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const checkMinRequiredVersion_1 = require("../checkMinRequiredVersion");
const command_1 = require("../command");
const projectUtils_1 = require("../projectUtils");
const logger_1 = require("../logger");
const extensionsHelper_1 = require("../extensions/extensionsHelper");
const requirePermissions_1 = require("../requirePermissions");
exports.command = new command_1.Command("ext:sources:create <sourceLocation>")
    .description(`create a extension source from sourceLocation`)
    .help("sourceLocation can be a local directory containing an extension, or URL pointing to a zipped extension. " +
    'If using a URL, you can specify a root folder for the extension by adding "#<extensionRoot>". ' +
    "For example, if your extension.yaml is in the my/extension directory of the archive, " +
    "you should use sourceUrl#my/extension. If no extensionRoot is specified, / is assumed.")
    .before(requirePermissions_1.requirePermissions, ["firebaseextensions.sources.create"])
    .before(extensionsHelper_1.ensureExtensionsApiEnabled)
    .before(checkMinRequiredVersion_1.checkMinRequiredVersion, "extDevMinVersion")
    .action(async (sourceLocation, options) => {
    const projectId = (0, projectUtils_1.needProjectId)(options);
    const res = await (0, extensionsHelper_1.createSourceFromLocation)(projectId, sourceLocation);
    logger_1.logger.info(`Extension source creation successful for ${res.spec.name}! Your new source is ${res.name}`);
    return res;
});
