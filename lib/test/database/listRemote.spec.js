"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const utils = require("../../utils");
const api_1 = require("../../api");
const listRemote_1 = require("../../database/listRemote");
const HOST = "https://firebaseio.com";
describe("ListRemote", () => {
    const instance = "fake-db";
    const remote = new listRemote_1.RTDBListRemote(instance, HOST);
    const serverUrl = utils.addSubdomain(api_1.realtimeOrigin, instance);
    afterEach(() => {
        nock.cleanAll();
    });
    it("should return subpaths from shallow get request", async () => {
        nock(serverUrl).get("/.json").query({ shallow: true, limitToFirst: "1234" }).reply(200, {
            a: true,
            x: true,
            f: true,
        });
        await (0, chai_1.expect)(remote.listPath("/", 1234)).to.eventually.eql(["a", "x", "f"]);
    });
});
//# sourceMappingURL=listRemote.spec.js.map