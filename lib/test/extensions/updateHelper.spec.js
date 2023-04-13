"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const sinon = require("sinon");
const error_1 = require("../../error");
const api_1 = require("../../api");
const extensionsApi = require("../../extensions/extensionsApi");
const extensionsHelper = require("../../extensions/extensionsHelper");
const updateHelper = require("../../extensions/updateHelper");
const iam = require("../../gcp/iam");
const SPEC = {
    name: "test",
    displayName: "Old",
    description: "descriptive",
    version: "0.2.0",
    license: "MIT",
    apis: [
        { apiName: "api1", reason: "" },
        { apiName: "api2", reason: "" },
    ],
    roles: [
        { role: "role1", reason: "" },
        { role: "role2", reason: "" },
    ],
    resources: [
        { name: "resource1", type: "firebaseextensions.v1beta.function", description: "desc" },
        { name: "resource2", type: "other", description: "" },
    ],
    author: { authorName: "Tester" },
    contributors: [{ authorName: "Tester 2" }],
    billingRequired: true,
    sourceUrl: "test.com",
    params: [],
    systemParams: [],
};
const SOURCE = {
    name: "projects/firebasemods/sources/new-test-source",
    packageUri: "https://firebase-fake-bucket.com",
    hash: "1234567",
    spec: SPEC,
};
const INSTANCE = {
    name: "projects/invader-zim/instances/instance-of-official-ext",
    createTime: "2019-05-19T00:20:10.416947Z",
    updateTime: "2019-05-19T00:20:10.416947Z",
    state: "ACTIVE",
    config: {
        name: "projects/invader-zim/instances/instance-of-official-ext/configurations/95355951-397f-4821-a5c2-9c9788b2cc63",
        createTime: "2019-05-19T00:20:10.416947Z",
        sourceId: "fake-official-source",
        sourceName: "projects/firebasemods/sources/fake-official-source",
        source: {
            name: "projects/firebasemods/sources/fake-official-source",
        },
    },
};
const REGISTRY_INSTANCE = {
    name: "projects/invader-zim/instances/instance-of-registry-ext",
    createTime: "2019-05-19T00:20:10.416947Z",
    updateTime: "2019-05-19T00:20:10.416947Z",
    state: "ACTIVE",
    config: {
        name: "projects/invader-zim/instances/instance-of-registry-ext/configurations/95355951-397f-4821-a5c2-9c9788b2cc63",
        createTime: "2019-05-19T00:20:10.416947Z",
        sourceId: "fake-registry-source",
        sourceName: "projects/firebasemods/sources/fake-registry-source",
        extensionRef: "test-publisher/test",
        source: {
            name: "projects/firebasemods/sources/fake-registry-source",
        },
    },
};
const LOCAL_INSTANCE = {
    name: "projects/invader-zim/instances/instance-of-local-ext",
    createTime: "2019-05-19T00:20:10.416947Z",
    updateTime: "2019-05-19T00:20:10.416947Z",
    state: "ACTIVE",
    config: {
        name: "projects/invader-zim/instances/instance-of-local-ext/configurations/95355951-397f-4821-a5c2-9c9788b2cc63",
        createTime: "2019-05-19T00:20:10.416947Z",
        sourceId: "fake-registry-source",
        sourceName: "projects/firebasemods/sources/fake-local-source",
        source: {
            name: "projects/firebasemods/sources/fake-local-source",
        },
    },
};
describe("updateHelper", () => {
    describe("updateFromLocalSource", () => {
        let createSourceStub;
        let getInstanceStub;
        let getRoleStub;
        beforeEach(() => {
            createSourceStub = sinon.stub(extensionsHelper, "createSourceFromLocation");
            getInstanceStub = sinon.stub(extensionsApi, "getInstance").resolves(INSTANCE);
            getRoleStub = sinon.stub(iam, "getRole");
            getRoleStub.resolves({
                title: "Role 1",
                description: "a role",
            });
            nock(api_1.firebaseExtensionsRegistryOrigin).get("/extensions.json").reply(200, {});
        });
        afterEach(() => {
            createSourceStub.restore();
            getInstanceStub.restore();
            getRoleStub.restore();
            nock.cleanAll();
        });
        it("should return the correct source name for a valid local source", async () => {
            createSourceStub.resolves(SOURCE);
            const name = await updateHelper.updateFromLocalSource("test-project", "test-instance", ".", SPEC);
            (0, chai_1.expect)(name).to.equal(SOURCE.name);
        });
        it("should throw an error for an invalid source", async () => {
            createSourceStub.throwsException("Invalid source");
            await (0, chai_1.expect)(updateHelper.updateFromLocalSource("test-project", "test-instance", ".", SPEC)).to.be.rejectedWith(error_1.FirebaseError, "Unable to update from the source");
        });
    });
    describe("updateFromUrlSource", () => {
        let createSourceStub;
        let getInstanceStub;
        let getRoleStub;
        beforeEach(() => {
            createSourceStub = sinon.stub(extensionsHelper, "createSourceFromLocation");
            getInstanceStub = sinon.stub(extensionsApi, "getInstance").resolves(INSTANCE);
            getRoleStub = sinon.stub(iam, "getRole");
            getRoleStub.resolves({
                title: "Role 1",
                description: "a role",
            });
            nock(api_1.firebaseExtensionsRegistryOrigin).get("/extensions.json").reply(200, {});
        });
        afterEach(() => {
            createSourceStub.restore();
            getInstanceStub.restore();
            getRoleStub.restore();
            nock.cleanAll();
        });
        it("should return the correct source name for a valid url source", async () => {
            createSourceStub.resolves(SOURCE);
            const name = await updateHelper.updateFromUrlSource("test-project", "test-instance", "https://valid-source.tar.gz", SPEC);
            (0, chai_1.expect)(name).to.equal(SOURCE.name);
        });
        it("should throw an error for an invalid source", async () => {
            createSourceStub.throws("Invalid source");
            await (0, chai_1.expect)(updateHelper.updateFromUrlSource("test-project", "test-instance", "https://valid-source.tar.gz", SPEC)).to.be.rejectedWith(error_1.FirebaseError, "Unable to update from the source");
        });
    });
});
describe("inferUpdateSource", () => {
    it("should infer update source from ref without version", () => {
        const result = updateHelper.inferUpdateSource("", "firebase/storage-resize-images");
        (0, chai_1.expect)(result).to.equal("firebase/storage-resize-images@latest");
    });
    it("should infer update source from ref with just version", () => {
        const result = updateHelper.inferUpdateSource("0.1.2", "firebase/storage-resize-images");
        (0, chai_1.expect)(result).to.equal("firebase/storage-resize-images@0.1.2");
    });
    it("should infer update source from ref and extension name", () => {
        const result = updateHelper.inferUpdateSource("storage-resize-images", "firebase/storage-resize-images");
        (0, chai_1.expect)(result).to.equal("firebase/storage-resize-images@latest");
    });
    it("should infer update source if it is a ref distinct from the input ref", () => {
        const result = updateHelper.inferUpdateSource("notfirebase/storage-resize-images", "firebase/storage-resize-images");
        (0, chai_1.expect)(result).to.equal("notfirebase/storage-resize-images@latest");
    });
});
describe("getExistingSourceOrigin", () => {
    let getInstanceStub;
    afterEach(() => {
        getInstanceStub.restore();
    });
    it("should return published extension as source origin", async () => {
        getInstanceStub = sinon.stub(extensionsApi, "getInstance").resolves(REGISTRY_INSTANCE);
        const result = await updateHelper.getExistingSourceOrigin("invader-zim", "instance-of-registry-ext");
        (0, chai_1.expect)(result).to.equal(extensionsHelper.SourceOrigin.PUBLISHED_EXTENSION);
    });
    it("should return local extension as source origin", async () => {
        getInstanceStub = sinon.stub(extensionsApi, "getInstance").resolves(LOCAL_INSTANCE);
        const result = await updateHelper.getExistingSourceOrigin("invader-zim", "instance-of-local-ext");
        (0, chai_1.expect)(result).to.equal(extensionsHelper.SourceOrigin.LOCAL);
    });
});
//# sourceMappingURL=updateHelper.spec.js.map