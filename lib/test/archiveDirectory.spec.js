"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const chai_1 = require("chai");
const error_1 = require("../error");
const archiveDirectory_1 = require("../archiveDirectory");
const SOME_FIXTURE_DIRECTORY = (0, path_1.resolve)(__dirname, "./fixtures/config-imports");
describe("archiveDirectory", () => {
    it("should archive happy little directories", async () => {
        const result = await (0, archiveDirectory_1.archiveDirectory)(SOME_FIXTURE_DIRECTORY, {});
        (0, chai_1.expect)(result.source).to.equal(SOME_FIXTURE_DIRECTORY);
        (0, chai_1.expect)(result.size).to.be.greaterThan(0);
    });
    it("should throw a happy little error if the directory doesn't exist", async () => {
        await (0, chai_1.expect)((0, archiveDirectory_1.archiveDirectory)((0, path_1.resolve)(__dirname, "foo"), {})).to.be.rejectedWith(error_1.FirebaseError);
    });
});
//# sourceMappingURL=archiveDirectory.spec.js.map