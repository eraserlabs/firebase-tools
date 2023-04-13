"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const api = require("../../../hosting/api");
const convertConfigPkg = require("../../../deploy/hosting/convertConfig");
const release_1 = require("../../../deploy/hosting/release");
const utils_1 = require("../../../utils");
describe("release", () => {
    const PROJECT = "fake-project";
    const SITE = "my-site";
    const VERSION = "it/ends/up/like/this/version-id";
    const FAKE_CONFIG = {};
    let updateVersionStub;
    let createReleaseStub;
    beforeEach(() => {
        updateVersionStub = sinon.stub(api, "updateVersion").rejects("updateVersion unstubbed");
        createReleaseStub = sinon.stub(api, "createRelease").rejects("createRelease unstubbed");
        sinon.stub(convertConfigPkg, "convertConfig").resolves(FAKE_CONFIG);
    });
    afterEach(() => {
        sinon.restore();
    });
    describe("with no Hosting deploys", () => {
        it("should bail", async () => {
            await (0, release_1.release)({ projectId: "foo" }, {}, {});
            (0, chai_1.expect)(updateVersionStub).to.have.been.not.called;
            (0, chai_1.expect)(createReleaseStub).to.have.been.not.called;
        });
    });
    describe("a single site", () => {
        const CONTEXT = {
            projectId: PROJECT,
            hosting: {
                deploys: [{ config: { site: SITE }, version: VERSION }],
            },
        };
        const UPDATE = {
            status: "FINALIZED",
            config: FAKE_CONFIG,
        };
        it("should update a version and make a release", async () => {
            updateVersionStub.resolves({});
            createReleaseStub.resolves({});
            await (0, release_1.release)(CONTEXT, {}, {});
            (0, chai_1.expect)(updateVersionStub).to.have.been.calledOnceWithExactly(SITE, (0, utils_1.last)(VERSION.split("/")), UPDATE);
            (0, chai_1.expect)(createReleaseStub).to.have.been.calledOnceWithExactly(SITE, "live", VERSION, {});
        });
        it("should update a version and make a release with a message", async () => {
            updateVersionStub.resolves({});
            createReleaseStub.resolves({});
            await (0, release_1.release)(CONTEXT, { message: "hello world" }, {});
            (0, chai_1.expect)(updateVersionStub).to.have.been.calledOnceWithExactly(SITE, (0, utils_1.last)(VERSION.split("/")), UPDATE);
            (0, chai_1.expect)(createReleaseStub).to.have.been.calledOnceWithExactly(SITE, "live", VERSION, {
                message: "hello world",
            });
        });
    });
    describe("multiple sites", () => {
        const CONTEXT = {
            projectId: PROJECT,
            hosting: {
                deploys: [
                    { config: { site: SITE }, version: VERSION },
                    { config: { site: `${SITE}-2` }, version: `${VERSION}-2` },
                ],
            },
        };
        const UPDATE = {
            status: "FINALIZED",
            config: FAKE_CONFIG,
        };
        it("should update a version and make a release", async () => {
            updateVersionStub.resolves({});
            createReleaseStub.resolves({});
            await (0, release_1.release)(CONTEXT, {}, {});
            (0, chai_1.expect)(updateVersionStub).to.have.been.calledTwice;
            (0, chai_1.expect)(updateVersionStub).to.have.been.calledWithExactly(SITE, (0, utils_1.last)(VERSION.split("/")), UPDATE);
            (0, chai_1.expect)(updateVersionStub).to.have.been.calledWithExactly(`${SITE}-2`, `${(0, utils_1.last)(VERSION.split("/"))}-2`, UPDATE);
            (0, chai_1.expect)(createReleaseStub).to.have.been.calledTwice;
            (0, chai_1.expect)(createReleaseStub).to.have.been.calledWithExactly(SITE, "live", VERSION, {});
            (0, chai_1.expect)(createReleaseStub).to.have.been.calledWithExactly(`${SITE}-2`, "live", `${VERSION}-2`, {});
        });
    });
    describe("to a hosting channel", () => {
        const CHANNEL = "my-channel";
        const CONTEXT = {
            projectId: PROJECT,
            hostingChannel: CHANNEL,
            hosting: {
                deploys: [{ config: { site: SITE }, version: VERSION }],
            },
        };
        const UPDATE = {
            status: "FINALIZED",
            config: FAKE_CONFIG,
        };
        it("should update a version and make a release", async () => {
            updateVersionStub.resolves({});
            createReleaseStub.resolves({});
            await (0, release_1.release)(CONTEXT, {}, {});
            (0, chai_1.expect)(updateVersionStub).to.have.been.calledOnceWithExactly(SITE, (0, utils_1.last)(VERSION.split("/")), UPDATE);
            (0, chai_1.expect)(createReleaseStub).to.have.been.calledOnceWithExactly(SITE, CHANNEL, VERSION, {});
        });
    });
});
//# sourceMappingURL=release.spec.js.map