"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zlib_1 = require("zlib");
const chai_1 = require("chai");
const express = require("express");
const http = require("http");
const nock = require("nock");
const portfinder = require("portfinder");
const supertest = require("supertest");
const initMiddleware_1 = require("../../hosting/initMiddleware");
const utils_1 = require("../../utils");
const templateServerRes = {
    js: "here is some js",
    emulatorsJs: "emulator js",
    json: JSON.stringify({ id: "foo" }),
};
describe("initMiddleware", () => {
    it("should be able to proxy a basic sdk request", async () => {
        nock("https://www.gstatic.com").get("/firebasejs/v2.2.2/sample-sdk.js").reply(200, "content");
        const mw = (0, initMiddleware_1.initMiddleware)(templateServerRes);
        await supertest(mw)
            .get("/__/firebase/v2.2.2/sample-sdk.js")
            .expect(200)
            .then((res) => {
            (0, chai_1.expect)(res.text).to.equal("content");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    it("should be able to proxy with the correct accept-encoding", async () => {
        nock("https://www.gstatic.com")
            .get("/firebasejs/v2.2.2/sample-sdk.js")
            .matchHeader("accept-encoding", "brrr")
            .reply(200, "content");
        const mw = (0, initMiddleware_1.initMiddleware)(templateServerRes);
        await supertest(mw)
            .get("/__/firebase/v2.2.2/sample-sdk.js")
            .set("accept-encoding", "brrr")
            .expect(200)
            .then((res) => {
            (0, chai_1.expect)(res.text).to.equal("content");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    it("should provide the init.js file", async () => {
        const mw = (0, initMiddleware_1.initMiddleware)(templateServerRes);
        await supertest(mw)
            .get("/__/firebase/init.js")
            .expect(200, templateServerRes.js)
            .expect("content-type", "application/javascript");
    });
    it("should provide the emulator init.js file when appropriate", async () => {
        const mw = (0, initMiddleware_1.initMiddleware)(templateServerRes);
        await supertest(mw)
            .get("/__/firebase/init.js")
            .query({ useEmulator: true })
            .expect(200, templateServerRes.emulatorsJs)
            .expect("content-type", "application/javascript");
    });
    it("should provide the firebase config (init.json)", async () => {
        const mw = (0, initMiddleware_1.initMiddleware)(templateServerRes);
        await supertest(mw)
            .get("/__/firebase/init.json")
            .expect(200, { id: "foo" })
            .expect("content-type", "application/json");
    });
    it("should pass (call next) if the sdk file doesn't exit", async () => {
        nock("https://www.gstatic.com").get("/firebasejs/v2.2.2/sample-sdk.js").reply(404, "no sdk");
        const app = express();
        const mw = (0, initMiddleware_1.initMiddleware)(templateServerRes);
        app.use(mw);
        app.use((req, res) => {
            res.status(200).send("index");
        });
        await supertest(app)
            .get("/__/firebase/v2.2.2/sample-sdk.js")
            .expect(200)
            .then((res) => {
            (0, chai_1.expect)(res.text).to.equal("index");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    it("should ignore any other request path (200)", async () => {
        const app = express();
        const mw = (0, initMiddleware_1.initMiddleware)(templateServerRes);
        app.use(mw);
        app.use((req, res) => {
            res.status(200).send("index");
        });
        await supertest(app)
            .get("/anything.else")
            .expect(200)
            .then((res) => {
            (0, chai_1.expect)(res.text).to.equal("index");
        });
    });
    it("should ignore any other request path (403)", async () => {
        const app = express();
        const mw = (0, initMiddleware_1.initMiddleware)(templateServerRes);
        app.use(mw);
        app.use((req, res) => {
            res.status(403).send("not here");
        });
        await supertest(app)
            .get("/anything.else")
            .expect(403)
            .then((res) => {
            (0, chai_1.expect)(res.text).to.equal("not here");
        });
    });
    describe("when dealing with compressed data", () => {
        const content = "this should be compressed";
        const contentStream = (0, utils_1.stringToStream)(content);
        const compressedStream = contentStream === null || contentStream === void 0 ? void 0 : contentStream.pipe((0, zlib_1.createGzip)());
        const app = express();
        app.use((0, initMiddleware_1.initMiddleware)(templateServerRes));
        let server;
        let port;
        beforeEach(async () => {
            port = await portfinder.getPortPromise();
            await new Promise((resolve) => (server = app.listen(port, resolve)));
        });
        afterEach(async () => {
            await new Promise((resolve) => server.close(resolve));
        });
        it("should return compressed data if it is returned compressed", async () => {
            nock("https://www.gstatic.com")
                .get("/firebasejs/v2.2.2/sample-sdk.js")
                .reply(200, () => compressedStream, { "content-encoding": "gzip" });
            const res = await new Promise((resolve, reject) => {
                const req = http.request({
                    method: "GET",
                    port,
                    path: `/__/firebase/v2.2.2/sample-sdk.js`,
                }, resolve);
                req.on("error", reject);
                req.end();
            });
            const gunzip = (0, zlib_1.createGunzip)();
            const uncompressed = res.pipe(gunzip);
            const c = await (0, utils_1.streamToString)(uncompressed);
            (0, chai_1.expect)(c).to.equal(content);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=initMiddleware.spec.js.map