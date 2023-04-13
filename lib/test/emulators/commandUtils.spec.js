"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandUtils = require("../../emulator/commandUtils");
const chai_1 = require("chai");
const error_1 = require("../../error");
const commandUtils_1 = require("../../emulator/commandUtils");
const path = require("path");
const sinon = require("sinon");
describe("commandUtils", () => {
    const testSetExportOnExitOptions = (options) => {
        commandUtils.setExportOnExitOptions(options);
        return options;
    };
    describe("Mocked path resolve", () => {
        const mockCWD = "/a/resolved/path/example";
        const mockDestinationDir = "/path/example";
        let pathStub;
        beforeEach(() => {
            pathStub = sinon.stub(path, "resolve").callsFake((path) => {
                return path === "." ? mockCWD : mockDestinationDir;
            });
        });
        afterEach(() => {
            pathStub.restore();
        });
        it("Should not block if destination contains a match to the CWD", () => {
            const directoryToAllow = mockDestinationDir;
            (0, chai_1.expect)(testSetExportOnExitOptions({ exportOnExit: directoryToAllow }).exportOnExit).to.equal(directoryToAllow);
        });
    });
    const directoriesThatShouldFail = [
        ".",
        "./",
        path.resolve("."),
        path.resolve(".."),
        path.resolve("../.."),
    ];
    directoriesThatShouldFail.forEach((dir) => {
        it(`Should disallow the user to set the current folder (ex: ${dir}) as --export-on-exit option`, () => {
            (0, chai_1.expect)(() => testSetExportOnExitOptions({ exportOnExit: dir })).to.throw(commandUtils_1.EXPORT_ON_EXIT_CWD_DANGER);
            const cwdSubDir = path.join(dir, "some-dir");
            (0, chai_1.expect)(testSetExportOnExitOptions({ exportOnExit: cwdSubDir }).exportOnExit).to.equal(cwdSubDir);
        });
    });
    it("Should disallow the user to set the current folder via the --import flag", () => {
        (0, chai_1.expect)(() => testSetExportOnExitOptions({ import: ".", exportOnExit: true })).to.throw(commandUtils_1.EXPORT_ON_EXIT_CWD_DANGER);
        const cwdSubDir = path.join(".", "some-dir");
        (0, chai_1.expect)(testSetExportOnExitOptions({ import: cwdSubDir, exportOnExit: true }).exportOnExit).to.equal(cwdSubDir);
    });
    it("should validate --export-on-exit options", () => {
        (0, chai_1.expect)(testSetExportOnExitOptions({ import: "./data" }).exportOnExit).to.be.undefined;
        (0, chai_1.expect)(testSetExportOnExitOptions({ import: "./data", exportOnExit: "./data" }).exportOnExit).to.eql("./data");
        (0, chai_1.expect)(testSetExportOnExitOptions({ import: "./data", exportOnExit: "./dataExport" }).exportOnExit).to.eql("./dataExport");
        (0, chai_1.expect)(testSetExportOnExitOptions({ import: "./data", exportOnExit: true }).exportOnExit).to.eql("./data");
        (0, chai_1.expect)(() => testSetExportOnExitOptions({ exportOnExit: true })).to.throw(error_1.FirebaseError, commandUtils_1.EXPORT_ON_EXIT_USAGE_ERROR);
        (0, chai_1.expect)(() => testSetExportOnExitOptions({ import: "", exportOnExit: true })).to.throw(error_1.FirebaseError, commandUtils_1.EXPORT_ON_EXIT_USAGE_ERROR);
        (0, chai_1.expect)(() => testSetExportOnExitOptions({ import: "", exportOnExit: "" })).to.throw(error_1.FirebaseError, commandUtils_1.EXPORT_ON_EXIT_USAGE_ERROR);
    });
    it("should delete the --import option when the dir does not exist together with --export-on-exit", () => {
        (0, chai_1.expect)(testSetExportOnExitOptions({
            import: "./dataDirThatDoesNotExist",
            exportOnExit: "./dataDirThatDoesNotExist",
        }).import).to.be.undefined;
        const options = testSetExportOnExitOptions({
            import: "./dataDirThatDoesNotExist",
            exportOnExit: true,
        });
        (0, chai_1.expect)(options.import).to.be.undefined;
        (0, chai_1.expect)(options.exportOnExit).to.eql("./dataDirThatDoesNotExist");
    });
    it("should not touch the --import option when the dir does not exist but --export-on-exit is not set", () => {
        (0, chai_1.expect)(testSetExportOnExitOptions({
            import: "./dataDirThatDoesNotExist",
        }).import).to.eql("./dataDirThatDoesNotExist");
    });
    it("should keep other unrelated options when using setExportOnExitOptions", () => {
        (0, chai_1.expect)(testSetExportOnExitOptions({
            someUnrelatedOption: "isHere",
        }).someUnrelatedOption).to.eql("isHere");
    });
});
//# sourceMappingURL=commandUtils.spec.js.map