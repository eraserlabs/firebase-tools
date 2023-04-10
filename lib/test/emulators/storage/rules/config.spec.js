"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rc_1 = require("../../../../rc");
const config_1 = require("../../../../emulator/storage/rules/config");
const fixtures_1 = require("../../fixtures");
const error_1 = require("../../../../error");
const persistence_1 = require("../../../../emulator/storage/persistence");
const PROJECT_ID = "test-project";
describe("Storage Rules Config", () => {
    const tmpDir = (0, fixtures_1.createTmpDir)("storage-files");
    const persistence = new persistence_1.Persistence(tmpDir);
    const resolvePath = (fileName) => fileName;
    it("should parse rules config for single target", () => {
        const rulesFile = "storage.rules";
        const rulesContent = Buffer.from(fixtures_1.StorageRulesFiles.readWriteIfTrue.content);
        const path = persistence.appendBytes(rulesFile, rulesContent);
        const config = getOptions({
            data: { storage: { rules: path } },
            path: resolvePath,
        });
        const result = (0, config_1.getStorageRulesConfig)(PROJECT_ID, config);
        (0, chai_1.expect)(result.name).to.equal(path);
        (0, chai_1.expect)(result.content).to.contain("allow read, write: if true");
    });
    it("should use default config for project IDs using demo- prefix if no rules file exists", () => {
        const config = getOptions({
            data: {},
            path: resolvePath,
        });
        const result = (0, config_1.getStorageRulesConfig)("demo-projectid", config);
        (0, chai_1.expect)(result.name).to.contain("templates/emulators/default_storage.rules");
        (0, chai_1.expect)(result.content).to.contain("allow read, write;");
    });
    it("should use provided config for project IDs using demo- prefix if the provided config exists", () => {
        const rulesFile = "storage.rules";
        const rulesContent = Buffer.from(fixtures_1.StorageRulesFiles.readWriteIfTrue.content);
        const path = persistence.appendBytes(rulesFile, rulesContent);
        const config = getOptions({
            data: { storage: { rules: path } },
            path: resolvePath,
        });
        const result = (0, config_1.getStorageRulesConfig)("demo-projectid", config);
        (0, chai_1.expect)(result.name).to.equal(path);
        (0, chai_1.expect)(result.content).to.contain("allow read, write: if true");
    });
    it("should parse rules file for multiple targets", () => {
        const mainRulesContent = Buffer.from(fixtures_1.StorageRulesFiles.readWriteIfTrue.content);
        const otherRulesContent = Buffer.from(fixtures_1.StorageRulesFiles.readWriteIfAuth.content);
        const mainRulesPath = persistence.appendBytes("storage_main.rules", mainRulesContent);
        const otherRulesPath = persistence.appendBytes("storage_other.rules", otherRulesContent);
        const config = getOptions({
            data: {
                storage: [
                    { target: "main", rules: mainRulesPath },
                    { target: "other", rules: otherRulesPath },
                ],
            },
            path: resolvePath,
        });
        config.rc.applyTarget(PROJECT_ID, "storage", "main", ["bucket_0", "bucket_1"]);
        config.rc.applyTarget(PROJECT_ID, "storage", "other", ["bucket_2"]);
        const result = (0, config_1.getStorageRulesConfig)(PROJECT_ID, config);
        (0, chai_1.expect)(result.length).to.equal(3);
        (0, chai_1.expect)(result[0].resource).to.eql("bucket_0");
        (0, chai_1.expect)(result[0].rules.name).to.equal(mainRulesPath);
        (0, chai_1.expect)(result[0].rules.content).to.contain("allow read, write: if true");
        (0, chai_1.expect)(result[1].resource).to.eql("bucket_1");
        (0, chai_1.expect)(result[1].rules.name).to.equal(mainRulesPath);
        (0, chai_1.expect)(result[1].rules.content).to.contain("allow read, write: if true");
        (0, chai_1.expect)(result[2].resource).to.eql("bucket_2");
        (0, chai_1.expect)(result[2].rules.name).to.equal(otherRulesPath);
        (0, chai_1.expect)(result[2].rules.content).to.contain("allow read, write: if request.auth!=null");
    });
    it("should throw FirebaseError when storage config is missing", () => {
        const config = getOptions({ data: {}, path: resolvePath });
        (0, chai_1.expect)(() => (0, config_1.getStorageRulesConfig)(PROJECT_ID, config)).to.throw(error_1.FirebaseError, "Cannot start the Storage emulator without rules file specified in firebase.json: run 'firebase init' and set up your Storage configuration");
    });
    it("should throw FirebaseError when rules file is missing", () => {
        const config = getOptions({ data: { storage: {} }, path: resolvePath });
        (0, chai_1.expect)(() => (0, config_1.getStorageRulesConfig)(PROJECT_ID, config)).to.throw(error_1.FirebaseError, "Cannot start the Storage emulator without rules file specified in firebase.json: run 'firebase init' and set up your Storage configuration");
    });
    it("should throw FirebaseError when rules file is invalid", () => {
        const invalidFileName = "foo";
        const config = getOptions({ data: { storage: { rules: invalidFileName } }, path: resolvePath });
        (0, chai_1.expect)(() => (0, config_1.getStorageRulesConfig)(PROJECT_ID, config)).to.throw(error_1.FirebaseError, `File not found: ${resolvePath(invalidFileName)}`);
    });
});
function getOptions(config) {
    return {
        cwd: "/",
        configPath: "/",
        config,
        only: "",
        except: "",
        nonInteractive: false,
        json: false,
        interactive: false,
        debug: false,
        force: false,
        filteredTargets: [],
        rc: new rc_1.RC(),
        project: PROJECT_ID,
    };
}
//# sourceMappingURL=config.spec.js.map