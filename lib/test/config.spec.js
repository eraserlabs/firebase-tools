"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const config_1 = require("../config");
function fixtureDir(name) {
    return path.resolve(__dirname, "./fixtures/" + name);
}
describe("Config", () => {
    describe("#load", () => {
        it("should load a cjson file when configPath is specified", () => {
            const config = config_1.Config.load({
                cwd: __dirname,
                configPath: "./fixtures/valid-config/firebase.json",
            });
            (0, chai_1.expect)(config).to.not.be.null;
            if (config) {
                (0, chai_1.expect)(config.get("database.rules")).to.eq("config/security-rules.json");
            }
        });
    });
    describe("#parseFile", () => {
        it("should load a cjson file", () => {
            const config = new config_1.Config({}, { cwd: fixtureDir("config-imports") });
            (0, chai_1.expect)(config.parseFile("hosting", "hosting.json").public).to.equal(".");
        });
        it("should error out for an unknown file", () => {
            const config = new config_1.Config({}, { cwd: fixtureDir("config-imports") });
            (0, chai_1.expect)(() => {
                config.parseFile("hosting", "i-dont-exist.json");
            }).to.throw("Imported file i-dont-exist.json does not exist");
        });
        it("should error out for an unrecognized extension", () => {
            const config = new config_1.Config({}, { cwd: fixtureDir("config-imports") });
            (0, chai_1.expect)(() => {
                config.parseFile("hosting", "unsupported.txt");
            }).to.throw("unsupported.txt is not of a supported config file type");
        });
    });
    describe("#materialize", () => {
        it("should assign unaltered if an object is found", () => {
            const config = new config_1.Config({ example: { foo: "bar" } }, {});
            (0, chai_1.expect)(config.materialize("example").foo).to.equal("bar");
        });
        it("should prevent top-level key duplication", () => {
            const config = new config_1.Config({ rules: "rules.json" }, { cwd: fixtureDir("dup-top-level") });
            (0, chai_1.expect)(config.materialize("rules")).to.deep.equal({ ".read": true });
        });
    });
});
//# sourceMappingURL=config.spec.js.map