"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = require("fs-extra");
const nock = require("nock");
const zlib_1 = require("zlib");
const downloadUtils_1 = require("../downloadUtils");
const error_1 = require("../error");
describe("downloadToTmp", () => {
    it("should download a file", async () => {
        const content = "hello world";
        const gzipContent = (0, zlib_1.gzipSync)(content);
        nock("https://example.com").get("/foo.gzip").reply(200, gzipContent);
        const fName = await (0, downloadUtils_1.downloadToTmp)("https://example.com/foo.gzip");
        const fileContent = (0, fs_extra_1.readFileSync)(fName);
        const gunzipFileContent = (0, zlib_1.gunzipSync)(fileContent).toString("utf-8");
        (0, chai_1.expect)(gunzipFileContent).to.equal(content);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("should throw an error on non-200 code", async () => {
        nock("https://example.com").get("/foo.gzip").reply(404, "Not Found");
        await (0, chai_1.expect)((0, downloadUtils_1.downloadToTmp)("https://example.com/foo.gzip")).to.eventually.be.rejectedWith(error_1.FirebaseError, /Not Found/);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
});
//# sourceMappingURL=downloadUtils.spec.js.map