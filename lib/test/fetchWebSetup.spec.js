"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const configstore_1 = require("../configstore");
const fetchWebSetup_1 = require("../fetchWebSetup");
const api_1 = require("../api");
const error_1 = require("../error");
describe("fetchWebSetup module", () => {
    before(() => {
        nock.disableNetConnect();
    });
    after(() => {
        nock.enableNetConnect();
    });
    afterEach(() => {
        (0, chai_1.expect)(nock.isDone()).to.be.true;
    });
    describe("fetchWebSetup", () => {
        let configSetStub;
        beforeEach(() => {
            sinon.stub(configstore_1.configstore, "get");
            configSetStub = sinon.stub(configstore_1.configstore, "set").returns();
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should fetch the web app config", async () => {
            const projectId = "foo";
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${projectId}/webApps/-/config`)
                .reply(200, { some: "config" });
            const config = await (0, fetchWebSetup_1.fetchWebSetup)({ project: projectId });
            (0, chai_1.expect)(config).to.deep.equal({ some: "config" });
        });
        it("should store the fetched config", async () => {
            const projectId = "projectId";
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${projectId}/webApps/-/config`)
                .reply(200, { projectId, some: "config" });
            await (0, fetchWebSetup_1.fetchWebSetup)({ project: projectId });
            (0, chai_1.expect)(configSetStub).to.have.been.calledOnceWith("webconfig", {
                [projectId]: {
                    projectId,
                    some: "config",
                },
            });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the request fails", async () => {
            const projectId = "foo";
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${projectId}/webApps/-/config`)
                .reply(404, { error: "Not Found" });
            await (0, chai_1.expect)((0, fetchWebSetup_1.fetchWebSetup)({ project: projectId })).to.eventually.be.rejectedWith(error_1.FirebaseError, "Not Found");
        });
        it("should return a fake config for a demo project id", async () => {
            const projectId = "demo-project-1234";
            await (0, chai_1.expect)((0, fetchWebSetup_1.fetchWebSetup)({ project: projectId })).to.eventually.deep.equal({
                projectId: "demo-project-1234",
                databaseURL: "https://demo-project-1234.firebaseio.com",
                storageBucket: "demo-project-1234.appspot.com",
                apiKey: "fake-api-key",
                authDomain: "demo-project-1234.firebaseapp.com",
            });
        });
    });
    describe("getCachedWebSetup", () => {
        let configGetStub;
        beforeEach(() => {
            sinon.stub(configstore_1.configstore, "set").returns();
            configGetStub = sinon.stub(configstore_1.configstore, "get");
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should return no config if none is cached", () => {
            configGetStub.returns(undefined);
            const config = (0, fetchWebSetup_1.getCachedWebSetup)({ project: "foo" });
            (0, chai_1.expect)(config).to.be.undefined;
        });
        it("should return a stored config", () => {
            const projectId = "projectId";
            configGetStub.returns({ [projectId]: { project: projectId, some: "config" } });
            const config = (0, fetchWebSetup_1.getCachedWebSetup)({ project: projectId });
            (0, chai_1.expect)(config).to.be.deep.equal({ project: projectId, some: "config" });
        });
    });
});
//# sourceMappingURL=fetchWebSetup.spec.js.map