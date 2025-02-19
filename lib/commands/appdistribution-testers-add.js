"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const command_1 = require("../command");
const utils = require("../utils");
const requireAuth_1 = require("../requireAuth");
const client_1 = require("../appdistribution/client");
const options_parser_util_1 = require("../appdistribution/options-parser-util");
exports.command = new command_1.Command("appdistribution:testers:add [emails...]")
    .description("add testers to project")
    .option("--file <file>", "a path to a file containing a list of tester emails to be added")
    .before(requireAuth_1.requireAuth)
    .action(async (emails, options) => {
    const projectName = await (0, options_parser_util_1.getProjectName)(options);
    const appDistroClient = new client_1.AppDistributionClient();
    const emailsToAdd = (0, options_parser_util_1.getEmails)(emails, options.file);
    utils.logBullet(`Adding ${emailsToAdd.length} testers to project`);
    await appDistroClient.addTesters(projectName, emailsToAdd);
});
