"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nock = require("nock");
const utils = require("../../utils");
const chai_1 = require("chai");
const import_1 = require("../../database/import");
const error_1 = require("../../error");
const dbUrl = new URL("https://test-db.firebaseio.com/foo");
describe("DatabaseImporter", () => {
    const DATA = { a: 100, b: [true, "bar", { f: { g: 0, h: 1 }, i: "baz" }] };
    let DATA_STREAM;
    beforeEach(() => {
        DATA_STREAM = utils.stringToStream(JSON.stringify(DATA));
    });
    it("throws FirebaseError when JSON is invalid", async () => {
        nock("https://test-db.firebaseio.com").get("/foo.json?shallow=true").reply(200);
        const INVALID_JSON = '{"a": {"b"}}';
        const importer = new import_1.default(dbUrl, utils.stringToStream(INVALID_JSON), "/");
        await (0, chai_1.expect)(importer.execute()).to.be.rejectedWith(error_1.FirebaseError, "Invalid data; couldn't parse JSON object, array, or value.");
    });
    it("chunks data in top-level objects", async () => {
        nock("https://test-db.firebaseio.com").get("/foo.json?shallow=true").reply(200);
        nock("https://test-db.firebaseio.com").put("/foo/a.json", "100").reply(200);
        nock("https://test-db.firebaseio.com")
            .put("/foo/b.json", JSON.stringify([true, "bar", { f: { g: 0, h: 1 }, i: "baz" }]))
            .reply(200);
        const importer = new import_1.default(dbUrl, DATA_STREAM, "/");
        const responses = await importer.execute();
        (0, chai_1.expect)(responses).to.have.length(2);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("chunks data according to provided chunk size", async () => {
        nock("https://test-db.firebaseio.com").get("/foo.json?shallow=true").reply(200);
        nock("https://test-db.firebaseio.com").put("/foo/a.json", "100").reply(200);
        nock("https://test-db.firebaseio.com").put("/foo/b/0.json", "true").reply(200);
        nock("https://test-db.firebaseio.com").put("/foo/b/1.json", '"bar"').reply(200);
        nock("https://test-db.firebaseio.com")
            .put("/foo/b/2/f.json", JSON.stringify({ g: 0, h: 1 }))
            .reply(200);
        nock("https://test-db.firebaseio.com").put("/foo/b/2/i.json", '"baz"').reply(200);
        const importer = new import_1.default(dbUrl, DATA_STREAM, "/", 20);
        const responses = await importer.execute();
        (0, chai_1.expect)(responses).to.have.length(5);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("imports from data path", async () => {
        nock("https://test-db.firebaseio.com").get("/foo.json?shallow=true").reply(200);
        nock("https://test-db.firebaseio.com")
            .put("/foo/b.json", JSON.stringify([true, "bar", { f: { g: 0, h: 1 }, i: "baz" }]))
            .reply(200);
        const importer = new import_1.default(dbUrl, DATA_STREAM, "/b");
        const responses = await importer.execute();
        (0, chai_1.expect)(responses).to.have.length(1);
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    it("throws FirebaseError when data location is nonempty", async () => {
        nock("https://test-db.firebaseio.com").get("/foo.json?shallow=true").reply(200, { a: "foo" });
        const importer = new import_1.default(dbUrl, DATA_STREAM, "/");
        await (0, chai_1.expect)(importer.execute()).to.be.rejectedWith(error_1.FirebaseError, /Importing is only allowed for an empty location./);
    });
});
//# sourceMappingURL=import.spec.js.map