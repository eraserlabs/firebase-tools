"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const artifactregistry = require("../../../gcp/artifactregistry");
const containerCleaner = require("../../../deploy/functions/containerCleaner");
const docker = require("../../../gcp/docker");
const poller = require("../../../operation-poller");
const utils = require("../../../utils");
describe("CleanupBuildImages", () => {
    let gcr;
    let ar;
    let logLabeledWarning;
    const TARGET = {
        project: "project",
        region: "us-central1",
        id: "id",
    };
    beforeEach(() => {
        gcr = sinon.createStubInstance(containerCleaner.ContainerRegistryCleaner);
        ar = sinon.createStubInstance(containerCleaner.ArtifactRegistryCleaner);
        logLabeledWarning = sinon.stub(utils, "logLabeledWarning");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("uses GCR and AR", async () => {
        await containerCleaner.cleanupBuildImages([TARGET], [], { gcr, ar });
        (0, chai_1.expect)(gcr.cleanupFunction).to.have.been.called;
    });
    it("reports failed domains from AR", async () => {
        ar.cleanupFunctionCache.rejects(new Error("uh oh"));
        await containerCleaner.cleanupBuildImages([], [TARGET], { gcr, ar });
        (0, chai_1.expect)(logLabeledWarning).to.have.been.calledWithMatch("functions", new RegExp("https://console.cloud.google.com/artifacts/docker/project/us-central1/gcf-artifacts"));
    });
    it("reports failed domains from GCR", async () => {
        gcr.cleanupFunction.rejects(new Error("uh oh"));
        await containerCleaner.cleanupBuildImages([], [TARGET], { gcr, ar });
        (0, chai_1.expect)(logLabeledWarning).to.have.been.calledWithMatch("functions", new RegExp("https://console.cloud.google.com/gcr/images/project/us/gcf"));
    });
});
describe("DockerHelper", () => {
    let listTags;
    let deleteTag;
    let deleteImage;
    let helper;
    beforeEach(() => {
        helper = new containerCleaner.DockerHelper("us");
        listTags = sinon.stub(helper.client, "listTags").rejects("Unexpected call");
        deleteTag = sinon.stub(helper.client, "deleteTag").rejects("Unexpected call");
        deleteImage = sinon.stub(helper.client, "deleteImage").rejects("Unexpected call");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    const FOO_BAR = {
        name: "foo/bar",
        tags: ["tag1", "tag2"],
        manifest: {
            "sha256:hash1": {},
            "sha256:hash2": {},
        },
        child: ["baz"],
    };
    const FOO_BAR_BAZ = {
        name: "foo/bar/baz",
        tags: ["tag3"],
        manifest: {
            "sha256:hash3": {},
        },
        child: [],
    };
    it("Fetches tags with caching", async () => {
        listTags
            .withArgs("foo/bar")
            .onFirstCall()
            .rejects("I'm flaky!")
            .onSecondCall()
            .resolves(FOO_BAR);
        await (0, chai_1.expect)(helper.ls("foo/bar")).to.eventually.deep.equal({
            digests: ["sha256:hash1", "sha256:hash2"],
            tags: ["tag1", "tag2"],
            children: ["baz"],
        });
        (0, chai_1.expect)(listTags).to.have.been.calledTwice;
        (0, chai_1.expect)(listTags).to.not.have.been.calledWith("foo");
        await (0, chai_1.expect)(helper.ls("foo/bar")).to.eventually.deep.equal({
            digests: ["sha256:hash1", "sha256:hash2"],
            tags: ["tag1", "tag2"],
            children: ["baz"],
        });
        (0, chai_1.expect)(listTags).to.have.been.calledTwice;
    });
    it("Deletes recursively", async () => {
        listTags.withArgs("foo/bar").resolves(FOO_BAR);
        listTags.withArgs("foo/bar/baz").resolves(FOO_BAR_BAZ);
        const remainingTags = {
            "foo/bar": ["tag1", "tag2"],
            "foo/bar/baz": ["tag3"],
        };
        let firstDeleteTag = true;
        deleteTag.callsFake((path, tag) => {
            if (firstDeleteTag) {
                firstDeleteTag = false;
                return Promise.reject(new Error("I'm flaky"));
            }
            if (!remainingTags[path].includes(tag)) {
                return Promise.reject(new Error("Cannot remove tag twice"));
            }
            remainingTags[path].splice(remainingTags[path].indexOf(tag), 1);
            return Promise.resolve();
        });
        let firstDeleteImage = true;
        deleteImage.callsFake((path) => {
            if (firstDeleteImage) {
                firstDeleteImage = false;
                return Promise.reject(new Error("I'm flaky"));
            }
            if (remainingTags[path].length) {
                return Promise.reject(new Error("Cannot remove image while tags still pin it"));
            }
            return Promise.resolve();
        });
        await helper.rm("foo/bar");
        (0, chai_1.expect)(listTags).to.have.been.calledTwice;
        (0, chai_1.expect)(listTags).to.have.been.calledWith("foo/bar");
        (0, chai_1.expect)(listTags).to.have.been.calledWith("foo/bar/baz");
        (0, chai_1.expect)(deleteTag).to.have.been.callCount(4);
        (0, chai_1.expect)(deleteTag).to.have.been.calledWith("foo/bar/baz", "tag3");
        (0, chai_1.expect)(deleteTag).to.have.been.calledWith("foo/bar", "tag1");
        (0, chai_1.expect)(deleteTag).to.have.been.calledWith("foo/bar", "tag2");
        (0, chai_1.expect)(deleteImage).to.have.been.callCount(4);
        (0, chai_1.expect)(deleteImage).to.have.been.calledWith("foo/bar/baz", "sha256:hash3");
        (0, chai_1.expect)(deleteImage).to.have.been.calledWith("foo/bar", "sha256:hash1");
        (0, chai_1.expect)(deleteImage).to.have.been.calledWith("foo/bar", "sha256:hash2");
        await (0, chai_1.expect)(helper.ls("foo/bar")).to.eventually.deep.equal({
            digests: [],
            tags: [],
            children: [],
        });
        await (0, chai_1.expect)(helper.ls("foo/bar/baz")).to.eventually.deep.equal({
            digests: [],
            tags: [],
            children: [],
        });
    });
});
describe("ArtifactRegistryCleaner", () => {
    let ar;
    let poll;
    beforeEach(() => {
        ar = sinon.stub(artifactregistry);
        poll = sinon.stub(poller);
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("deletes artifacts", async () => {
        const cleaner = new containerCleaner.ArtifactRegistryCleaner();
        const func = {
            id: "function",
            region: "region",
            project: "project",
        };
        ar.deletePackage.returns(Promise.resolve({ name: "op" }));
        await cleaner.cleanupFunction(func);
        (0, chai_1.expect)(ar.deletePackage).to.have.been.calledWith("projects/project/locations/region/repositories/gcf-artifacts/packages/function");
        (0, chai_1.expect)(poll.pollOperation).to.have.been.called;
    });
    it("deletes cache dirs", async () => {
        const cleaner = new containerCleaner.ArtifactRegistryCleaner();
        const func = {
            id: "function",
            region: "region",
            project: "project",
        };
        ar.deletePackage.returns(Promise.resolve({ name: "op", done: false }));
        await cleaner.cleanupFunctionCache(func);
        (0, chai_1.expect)(ar.deletePackage).to.have.been.calledWith("projects/project/locations/region/repositories/gcf-artifacts/packages/function%2Fcache");
        (0, chai_1.expect)(poll.pollOperation).to.have.been.called;
    });
    it("bypasses poller if the operation is completed", async () => {
        const cleaner = new containerCleaner.ArtifactRegistryCleaner();
        const func = {
            id: "function",
            region: "region",
            project: "project",
        };
        ar.deletePackage.returns(Promise.resolve({ name: "op", done: true }));
        await cleaner.cleanupFunction(func);
        (0, chai_1.expect)(ar.deletePackage).to.have.been.calledWith("projects/project/locations/region/repositories/gcf-artifacts/packages/function");
        (0, chai_1.expect)(poll.pollOperation).to.not.have.been.called;
    });
    it("encodeds to avoid upper-case letters", async () => {
        const cleaner = new containerCleaner.ArtifactRegistryCleaner();
        const func = {
            id: "Strange-Casing_cases",
            region: "region",
            project: "project",
        };
        ar.deletePackage.returns(Promise.resolve({ name: "op", done: true }));
        await cleaner.cleanupFunction(func);
        (0, chai_1.expect)(ar.deletePackage).to.have.been.calledWith("projects/project/locations/region/repositories/gcf-artifacts/packages/s-strange--_casing__cases");
        (0, chai_1.expect)(poll.pollOperation).to.not.have.been.called;
    });
});
describe("ContainerRegistryCleaner", () => {
    const ENDPOINT = {
        platform: "gcfv1",
        project: "project",
        region: "us-central1",
        id: "id",
        entryPoint: "function",
        runtime: "nodejs16",
        httpsTrigger: {},
    };
    it("Handles cleanup of first function in the region", async () => {
        const cleaner = new containerCleaner.ContainerRegistryCleaner();
        const stub = sinon.createStubInstance(containerCleaner.DockerHelper);
        cleaner.helpers["us"] = stub;
        stub.ls.withArgs("project/gcf/us-central1").returns(Promise.resolve({
            children: ["uuid"],
            digests: [],
            tags: [],
        }));
        stub.ls.withArgs("project/gcf/us-central1/uuid").returns(Promise.resolve({
            children: ["cache", "worker"],
            digests: ["sha256:func-hash"],
            tags: ["id_version-1"],
        }));
        await cleaner.cleanupFunction(ENDPOINT);
        (0, chai_1.expect)(stub.rm).to.have.been.calledOnceWith("project/gcf/us-central1/uuid");
    });
    it("Handles cleanup of second function in the region", async () => {
        const cleaner = new containerCleaner.ContainerRegistryCleaner();
        const stub = sinon.createStubInstance(containerCleaner.DockerHelper);
        cleaner.helpers["us"] = stub;
        stub.ls.withArgs("project/gcf/us-central1").returns(Promise.resolve({
            children: ["uuid"],
            digests: [],
            tags: [],
        }));
        stub.ls.withArgs("project/gcf/us-central1/uuid").returns(Promise.resolve({
            children: [],
            digests: ["sha256:func-hash"],
            tags: ["id_version-1"],
        }));
        await cleaner.cleanupFunction(ENDPOINT);
        (0, chai_1.expect)(stub.rm).to.have.been.calledOnceWith("project/gcf/us-central1/uuid");
    });
    it("Leaves other directories alone", async () => {
        const cleaner = new containerCleaner.ContainerRegistryCleaner();
        const stub = sinon.createStubInstance(containerCleaner.DockerHelper);
        cleaner.helpers["us"] = stub;
        stub.ls.withArgs("project/gcf/us-central1").returns(Promise.resolve({
            children: ["uuid"],
            digests: [],
            tags: [],
        }));
        stub.ls.withArgs("project/gcf/us-central1/uuid").returns(Promise.resolve({
            children: [],
            digests: ["sha256:func-hash"],
            tags: ["other-function_version-1"],
        }));
        await cleaner.cleanupFunction(ENDPOINT);
        (0, chai_1.expect)(stub.rm).to.not.have.been.called;
    });
});
describe("listGcfPaths", () => {
    const LOCATIONS_US = Promise.resolve({
        children: ["us-central1", "us-west2"],
        digests: [],
        tags: [],
    });
    const LOCATIONS_EU = Promise.resolve({
        children: ["europe-west1", "europe-central2"],
        digests: [],
        tags: [],
    });
    const LOCATIONS_ASIA = Promise.resolve({
        children: ["asia-northeast1", "asia-south1"],
        digests: [],
        tags: [],
    });
    const EMPTY = Promise.resolve({
        children: [],
        digests: [],
        tags: [],
    });
    it("should throw an error on invalid location", async () => {
        await (0, chai_1.expect)(containerCleaner.listGcfPaths("project", ["invalid"])).to.be.rejected;
    });
    it("should throw an error when subdomains fail search", async () => {
        const stub = sinon.createStubInstance(containerCleaner.DockerHelper);
        stub.rm.throws(new Error("DockerHelper rm stub error"));
        const helpers = {
            us: stub,
            eu: stub,
            asia: stub,
        };
        await (0, chai_1.expect)(containerCleaner.listGcfPaths("project", undefined, helpers)).to.be.rejected;
    });
    it("should list paths, single location param", async () => {
        const stub = sinon.createStubInstance(containerCleaner.DockerHelper);
        stub.ls.withArgs("project/gcf").returns(LOCATIONS_US);
        const stubEmpty = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubEmpty.ls.withArgs("project/gcf").returns(EMPTY);
        const helpers = { us: stub, eu: stubEmpty, asia: stubEmpty };
        const paths = await containerCleaner.listGcfPaths("project", ["us-central1"], helpers);
        (0, chai_1.expect)(paths).to.deep.equal(["us.gcr.io/project/gcf/us-central1"]);
    });
    it("should list paths, multiple locations param", async () => {
        const stubUS = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubUS.ls.withArgs("project/gcf").returns(LOCATIONS_US);
        const stubEU = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubEU.ls.withArgs("project/gcf").returns(LOCATIONS_EU);
        const stubEmpty = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubEmpty.ls.withArgs("project/gcf").returns(EMPTY);
        const helpers = { us: stubUS, eu: stubEU, asia: stubEmpty };
        const paths = await containerCleaner.listGcfPaths("project", ["us-central1", "europe-west1"], helpers);
        paths.sort();
        (0, chai_1.expect)(paths).to.deep.equal([
            "eu.gcr.io/project/gcf/europe-west1",
            "us.gcr.io/project/gcf/us-central1",
        ]);
    });
    it("should list paths, only locations in gcr", async () => {
        const stubUS = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubUS.ls.withArgs("project/gcf").returns(LOCATIONS_US);
        const stubEmpty = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubEmpty.ls.withArgs("project/gcf").returns(EMPTY);
        const helpers = { us: stubUS, eu: stubEmpty, asia: stubEmpty };
        const paths = await containerCleaner.listGcfPaths("project", ["us-central1", "us-west4"], helpers);
        (0, chai_1.expect)(paths).to.deep.equal(["us.gcr.io/project/gcf/us-central1"]);
    });
    it("should list paths, all locations", async () => {
        const stubUS = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubUS.ls.withArgs("project/gcf").returns(LOCATIONS_US);
        const stubEU = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubEU.ls.withArgs("project/gcf").returns(LOCATIONS_EU);
        const stubAsia = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubAsia.ls.withArgs("project/gcf").returns(LOCATIONS_ASIA);
        const helpers = { us: stubUS, eu: stubEU, asia: stubAsia };
        const paths = await containerCleaner.listGcfPaths("project", undefined, helpers);
        paths.sort();
        (0, chai_1.expect)(paths).to.deep.equal([
            "asia.gcr.io/project/gcf/asia-northeast1",
            "asia.gcr.io/project/gcf/asia-south1",
            "eu.gcr.io/project/gcf/europe-central2",
            "eu.gcr.io/project/gcf/europe-west1",
            "us.gcr.io/project/gcf/us-central1",
            "us.gcr.io/project/gcf/us-west2",
        ]);
    });
});
describe("deleteGcfArtifacts", () => {
    const DIRECTORY = Promise.resolve({
        children: ["dir"],
        digests: ["image1", "image2"],
        tags: ["tag"],
    });
    it("should throw an error on invalid location", async () => {
        await (0, chai_1.expect)(containerCleaner.deleteGcfArtifacts("project", ["invalid"])).to.be.rejected;
    });
    it("should throw an error when subdomains fail deletion", async () => {
        const stub = sinon.createStubInstance(containerCleaner.DockerHelper);
        stub.rm.throws(new Error("DockerHelper rm stub error"));
        const helpers = {
            us: stub,
            eu: stub,
            asia: stub,
        };
        await (0, chai_1.expect)(containerCleaner.deleteGcfArtifacts("project", undefined, helpers)).to.be.rejected;
    });
    it("should delete a location", async () => {
        const stub = sinon.createStubInstance(containerCleaner.DockerHelper);
        stub.ls.withArgs("project/gcf/us-central1").returns(DIRECTORY);
        const helpers = { us: stub };
        await containerCleaner.deleteGcfArtifacts("project", ["us-central1"], helpers);
        (0, chai_1.expect)(stub.rm).to.have.been.calledOnceWith("project/gcf/us-central1");
    });
    it("should delete multiple locations", async () => {
        const stubUS = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubUS.ls.withArgs("project/gcf/us-central1").returns(DIRECTORY);
        stubUS.ls.withArgs("project/gcf/us-west2").returns(DIRECTORY);
        const stubEU = sinon.createStubInstance(containerCleaner.DockerHelper);
        stubEU.ls.withArgs("project/gcf/europe-west1").returns(DIRECTORY);
        const helpers = { us: stubUS, eu: stubEU };
        await containerCleaner.deleteGcfArtifacts("project", ["us-central1", "us-west2", "europe-west1"], helpers);
        (0, chai_1.expect)(stubUS.rm).to.have.been.calledTwice;
        (0, chai_1.expect)(stubUS.rm).to.have.been.calledWith("project/gcf/us-central1");
        (0, chai_1.expect)(stubUS.rm).to.have.been.calledWith("project/gcf/us-west2");
        (0, chai_1.expect)(stubEU.rm).to.have.been.calledOnceWith("project/gcf/europe-west1");
    });
    it("should purge all locations", async () => {
        const locations = Object.keys(docker.GCR_SUBDOMAIN_MAPPING);
        const usLocations = locations.filter((loc) => docker.GCR_SUBDOMAIN_MAPPING[loc] === "us");
        const euLocations = locations.filter((loc) => docker.GCR_SUBDOMAIN_MAPPING[loc] === "eu");
        const asiaLocations = locations.filter((loc) => {
            return docker.GCR_SUBDOMAIN_MAPPING[loc] === "asia";
        });
        const stubUS = sinon.createStubInstance(containerCleaner.DockerHelper);
        for (const usLoc of usLocations) {
            stubUS.ls.withArgs(`project/gcf/${usLoc}`).returns(DIRECTORY);
        }
        const stubEU = sinon.createStubInstance(containerCleaner.DockerHelper);
        for (const euLoc of euLocations) {
            stubEU.ls.withArgs(`project/gcf/${euLoc}`).returns(DIRECTORY);
        }
        const stubAsia = sinon.createStubInstance(containerCleaner.DockerHelper);
        for (const asiaLoc of asiaLocations) {
            stubAsia.ls.withArgs(`project/gcf/${asiaLoc}`).returns(DIRECTORY);
        }
        const helpers = {
            us: stubUS,
            eu: stubEU,
            asia: stubAsia,
        };
        await containerCleaner.deleteGcfArtifacts("project", undefined, helpers);
        (0, chai_1.expect)(stubUS.rm).to.have.callCount(usLocations.length);
        for (const usLoc of usLocations) {
            (0, chai_1.expect)(stubUS.rm).to.have.been.calledWith(`project/gcf/${usLoc}`);
        }
        (0, chai_1.expect)(stubEU.rm).to.have.callCount(euLocations.length);
        for (const euLoc of euLocations) {
            (0, chai_1.expect)(stubEU.rm).to.have.been.calledWith(`project/gcf/${euLoc}`);
        }
        (0, chai_1.expect)(stubAsia.rm).to.have.callCount(asiaLocations.length);
        for (const asiaLoc of asiaLocations) {
            (0, chai_1.expect)(stubAsia.rm).to.have.been.calledWith(`project/gcf/${asiaLoc}`);
        }
    });
});
//# sourceMappingURL=containerCleaner.spec.js.map