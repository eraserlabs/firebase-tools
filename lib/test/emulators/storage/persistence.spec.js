"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const os_1 = require("os");
const fs = require("fs");
const uuid_1 = require("uuid");
const persistence_1 = require("../../../emulator/storage/persistence");
describe("Persistence", () => {
    const testDir = `${(0, os_1.tmpdir)()}/${(0, uuid_1.v4)()}`;
    const _persistence = new persistence_1.Persistence(testDir);
    after(async () => {
        await _persistence.deleteAll();
    });
    describe("#deleteFile()", () => {
        it("should delete files", () => {
            const filename = `${(0, uuid_1.v4)()}%2F${(0, uuid_1.v4)()}`;
            _persistence.appendBytes(filename, Buffer.from("hello world"));
            _persistence.deleteFile(filename);
            (0, chai_1.expect)(() => _persistence.readBytes(filename, 10)).to.throw();
        });
    });
    describe("#readBytes()", () => {
        it("should read existing files", () => {
            const filename = `${(0, uuid_1.v4)()}%2F${(0, uuid_1.v4)()}`;
            const data = Buffer.from("hello world");
            _persistence.appendBytes(filename, data);
            (0, chai_1.expect)(_persistence.readBytes(filename, data.byteLength).toString()).to.equal("hello world");
        });
        it("should handle really long filename read existing files", () => {
            const filename = `${(0, uuid_1.v4)()}%2F%${"long".repeat(180)}${(0, uuid_1.v4)()}`;
            const data = Buffer.from("hello world");
            _persistence.appendBytes(filename, data);
            (0, chai_1.expect)(_persistence.readBytes(filename, data.byteLength).toString()).to.equal("hello world");
        });
    });
    describe("#copyFromExternalPath()", () => {
        it("should copy files existing files", () => {
            const data = Buffer.from("hello world");
            const externalFilename = `${(0, uuid_1.v4)()}%2F${(0, uuid_1.v4)()}`;
            const externalFilePath = `${testDir}/${externalFilename}`;
            fs.appendFileSync(externalFilePath, data);
            const filename = `${(0, uuid_1.v4)()}%2F${(0, uuid_1.v4)()}`;
            _persistence.copyFromExternalPath(externalFilePath, filename);
            (0, chai_1.expect)(_persistence.readBytes(filename, data.byteLength).toString()).to.equal("hello world");
        });
    });
});
//# sourceMappingURL=persistence.spec.js.map