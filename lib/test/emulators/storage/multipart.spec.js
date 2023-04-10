"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const multipart_1 = require("../../../emulator/storage/multipart");
const crypto_1 = require("crypto");
describe("Storage Multipart Request Parser", () => {
    const CONTENT_TYPE_HEADER = "multipart/related; boundary=b1d5b2e3-1845-4338-9400-6ac07ce53c1e";
    const BODY = Buffer.from(`--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
Content-Type: application/json\r
\r
{"contentType":"text/plain"}\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
Content-Type: text/plain\r
\r
hello there!
\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e--\r
`);
    describe("#parseObjectUploadMultipartRequest()", () => {
        it("parses an upload object multipart request successfully", () => {
            const { metadataRaw, dataRaw } = (0, multipart_1.parseObjectUploadMultipartRequest)(CONTENT_TYPE_HEADER, BODY);
            (0, chai_1.expect)(metadataRaw).to.equal('{"contentType":"text/plain"}');
            (0, chai_1.expect)(dataRaw.toString()).to.equal("hello there!\n");
        });
        it("parses an upload object multipart request with non utf-8 data successfully", () => {
            const bodyPart1 = Buffer.from(`--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
Content-Type: application/json\r
\r
{"contentType":"text/plain"}\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
Content-Type: text/plain\r
\r
`);
            const data = Buffer.concat([Buffer.from((0, crypto_1.randomBytes)(100)), Buffer.from("\r\n"), Buffer.from((0, crypto_1.randomBytes)(100))], 202);
            const bodyPart2 = Buffer.from(`\r\n--b1d5b2e3-1845-4338-9400-6ac07ce53c1e--\r\n`);
            const body = Buffer.concat([bodyPart1, data, bodyPart2]);
            const { dataRaw } = (0, multipart_1.parseObjectUploadMultipartRequest)(CONTENT_TYPE_HEADER, body);
            (0, chai_1.expect)(dataRaw.byteLength).to.equal(data.byteLength);
        });
        it("parses an upload object multipart request with lowercase content-type", () => {
            const body = Buffer.from(`--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
content-type: application/json\r
\r
{"contentType":"text/plain"}\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
content-type: text/plain\r
\r
hello there!
\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e--\r
`);
            const { metadataRaw, dataRaw } = (0, multipart_1.parseObjectUploadMultipartRequest)(CONTENT_TYPE_HEADER, body);
            (0, chai_1.expect)(metadataRaw).to.equal('{"contentType":"text/plain"}');
            (0, chai_1.expect)(dataRaw.toString()).to.equal("hello there!\n");
        });
        it("fails to parse with invalid Content-Type value", () => {
            const invalidContentTypeHeader = "blah";
            (0, chai_1.expect)(() => (0, multipart_1.parseObjectUploadMultipartRequest)(invalidContentTypeHeader, BODY)).to.throw("Bad content type.");
        });
        it("fails to parse with invalid boundary value", () => {
            const invalidContentTypeHeader = "multipart/related; boundary=";
            (0, chai_1.expect)(() => (0, multipart_1.parseObjectUploadMultipartRequest)(invalidContentTypeHeader, BODY)).to.throw("Bad content type.");
        });
        it("parses an upload object multipart request with additional quotes in the boundary value", () => {
            const contentTypeHeaderWithDoubleQuotes = `multipart/related; boundary="b1d5b2e3-1845-4338-9400-6ac07ce53c1e"`;
            let { metadataRaw, dataRaw } = (0, multipart_1.parseObjectUploadMultipartRequest)(contentTypeHeaderWithDoubleQuotes, BODY);
            (0, chai_1.expect)(metadataRaw).to.equal('{"contentType":"text/plain"}');
            (0, chai_1.expect)(dataRaw.toString()).to.equal("hello there!\n");
            const contentTypeHeaderWithSingleQuotes = `multipart/related; boundary='b1d5b2e3-1845-4338-9400-6ac07ce53c1e'`;
            ({ metadataRaw, dataRaw } = (0, multipart_1.parseObjectUploadMultipartRequest)(contentTypeHeaderWithSingleQuotes, BODY));
            (0, chai_1.expect)(metadataRaw).to.equal('{"contentType":"text/plain"}');
            (0, chai_1.expect)(dataRaw.toString()).to.equal("hello there!\n");
        });
        it("fails to parse when body has wrong number of parts", () => {
            const invalidBody = Buffer.from(`--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
Content-Type: application/json\r
\r
{"contentType":"text/plain"}\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e--\r
`);
            (0, chai_1.expect)(() => (0, multipart_1.parseObjectUploadMultipartRequest)(CONTENT_TYPE_HEADER, invalidBody)).to.throw("Unexpected number of parts");
        });
        it("fails to parse when body part has invalid content type", () => {
            const invalidBody = Buffer.from(`--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
bogus content type\r
\r
{"contentType":"text/plain"}\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
bogus content type\r
\r
hello there!
\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e--\r
`);
            (0, chai_1.expect)(() => (0, multipart_1.parseObjectUploadMultipartRequest)(CONTENT_TYPE_HEADER, invalidBody)).to.throw("Missing content type.");
        });
        it("fails to parse when body part is malformed", () => {
            const invalidBody = Buffer.from(`--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
\r
{"contentType":"text/plain"}\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e\r
\r
--b1d5b2e3-1845-4338-9400-6ac07ce53c1e--\r
`);
            (0, chai_1.expect)(() => (0, multipart_1.parseObjectUploadMultipartRequest)(CONTENT_TYPE_HEADER, invalidBody)).to.throw("Failed to parse multipart request body part");
        });
    });
});
//# sourceMappingURL=multipart.spec.js.map