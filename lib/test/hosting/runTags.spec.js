"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const runNS = require("../../gcp/run");
const hostingNS = require("../../hosting/api");
const runTagsNS = require("../../hosting/runTags");
const utils_1 = require("../../utils");
const REGION = "REGION";
const SERVICE = "SERVICE";
const PROJECT = "PROJECT";
describe("runTags", () => {
    let run;
    let hosting;
    let runTags;
    const site = {
        name: "projects/project/sites/site",
        defaultUrl: "https://google.com",
        appId: "appId",
        labels: {},
    };
    function version(version, status, ...rewrites) {
        return {
            name: `projects/project/sites/site/versions/${version}`,
            status: status,
            config: {
                rewrites: rewrites.map((r) => {
                    return { regex: ".*", run: r };
                }),
            },
            createTime: "now",
            createUser: {
                email: "inlined@gmail.com",
            },
            fileCount: 0,
            versionBytes: 0,
        };
    }
    function service(id, ...tags) {
        return {
            apiVersion: "serving.knative.dev/v1",
            kind: "Service",
            metadata: {
                name: id,
                namespace: PROJECT,
                labels: {
                    [runNS.LOCATION_LABEL]: REGION,
                },
            },
            spec: {
                template: {
                    metadata: {
                        name: "revision",
                        namespace: "project",
                    },
                    spec: {
                        containers: [],
                    },
                },
                traffic: [
                    {
                        latestRevision: true,
                        percent: 100,
                    },
                    ...tags.map((tag) => {
                        if (typeof tag === "string") {
                            return {
                                revisionName: `revision-${tag}`,
                                tag: tag,
                                percent: 0,
                            };
                        }
                        else {
                            return tag;
                        }
                    }),
                ],
            },
            status: {
                observedGeneration: 50,
                latestCreatedRevisionName: "latest",
                latestReadyRevisionName: "latest",
                traffic: [
                    {
                        revisionName: "latest",
                        latestRevision: true,
                        percent: 100,
                    },
                    ...tags.map((tag) => {
                        if (typeof tag === "string") {
                            return {
                                revisionName: `revision-${tag}`,
                                tag: tag,
                                percent: 0,
                            };
                        }
                        else {
                            return Object.assign({ percent: 0 }, tag);
                        }
                    }),
                ],
                conditions: [],
                url: "https://google.com",
                address: {
                    url: "https://google.com",
                },
            },
        };
    }
    beforeEach(() => {
        run = sinon.stub(runNS);
        hosting = sinon.stub(hostingNS);
        runTags = sinon.stub(runTagsNS);
        hosting.listSites.withArgs(PROJECT).resolves([site]);
        hosting.listVersions.rejects(new Error("Unexpected hosting.listSites"));
        run.getService.rejects(new Error("Unexpected run.getService"));
        run.updateService.rejects(new Error("Unexpected run.updateService"));
        run.gcpIds.restore();
        runTags.ensureLatestRevisionTagged.throws(new Error("Unexpected runTags.ensureLatestRevisionTagged"));
        runTags.gcTagsForServices.rejects(new Error("Unepxected runTags.gcTagsForServices"));
        runTags.setRewriteTags.rejects(new Error("Unexpected runTags.setRewriteTags call"));
        runTags.setGarbageCollectionThreshold.restore();
    });
    afterEach(() => {
        sinon.restore();
    });
    function tagsIn(service) {
        return service.spec.traffic.map((t) => t.tag).filter((t) => !!t);
    }
    describe("gcTagsForServices", () => {
        beforeEach(() => {
            runTags.gcTagsForServices.restore();
        });
        it("leaves only active revisions", async () => {
            hosting.listVersions.resolves([
                version("v1", "FINALIZED", { serviceId: "s1", region: REGION, tag: "fh-in-use1" }),
                version("v2", "CREATED", { serviceId: "s1", region: REGION, tag: "fh-in-use2" }),
                version("v3", "DELETED", { serviceId: "s1", region: REGION, tag: "fh-deleted-version" }),
            ]);
            const s1 = service("s1", "fh-in-use1", "fh-in-use2", "fh-deleted-version", "fh-no-longer-referenced", "not-by-us");
            const s2 = service("s2", "fh-no-reference");
            s2.spec.traffic.push({
                revisionName: "manual-split",
                tag: "fh-manual-split",
                percent: 1,
            });
            await runTags.gcTagsForServices(PROJECT, [s1, s2]);
            (0, chai_1.expect)(tagsIn(s1)).to.deep.equal(["fh-in-use1", "fh-in-use2", "not-by-us"]);
            (0, chai_1.expect)(tagsIn(s2)).to.deep.equal(["fh-manual-split"]);
        });
    });
    describe("setRewriteTags", () => {
        const svc = service(SERVICE);
        const svcName = `projects/${PROJECT}/locations/${REGION}/services/${SERVICE}`;
        beforeEach(() => {
            runTags.setRewriteTags.restore();
        });
        it("preserves existing tags and other types of rewrites", async () => {
            const rewrites = [
                {
                    glob: "**",
                    path: "/index.html",
                },
                {
                    glob: "/dynamic",
                    run: {
                        serviceId: "service",
                        region: "us-central1",
                        tag: "someone-is-using-this-code-in-a-way-i-dont-expect",
                    },
                },
                {
                    glob: "/callable",
                    function: "function",
                    functionRegion: "us-central1",
                },
            ];
            const original = (0, utils_1.cloneDeep)(rewrites);
            await runTags.setRewriteTags(rewrites, "project", "version");
            (0, chai_1.expect)(rewrites).to.deep.equal(original);
        });
        it("replaces tags in rewrites with new/verified tags", async () => {
            const rewrites = [
                {
                    glob: "**",
                    run: {
                        serviceId: SERVICE,
                        region: REGION,
                        tag: runTagsNS.TODO_TAG_NAME,
                    },
                },
            ];
            run.getService.withArgs(svcName).resolves(svc);
            runTags.ensureLatestRevisionTagged.resetBehavior();
            runTags.ensureLatestRevisionTagged.callsFake((svc, tag) => {
                (0, chai_1.expect)(tag).to.equal("fh-version");
                svc[0].spec.traffic.push({ revisionName: "latest", tag });
                return Promise.resolve({ [REGION]: { [SERVICE]: tag } });
            });
            await runTags.setRewriteTags(rewrites, PROJECT, "version");
            (0, chai_1.expect)(rewrites).to.deep.equal([
                {
                    glob: "**",
                    run: {
                        serviceId: SERVICE,
                        region: REGION,
                        tag: "fh-version",
                    },
                },
            ]);
        });
        it("garbage collects if necessary", async () => {
            runTagsNS.setGarbageCollectionThreshold(2);
            const svc = service(SERVICE, "fh-1", "fh-2");
            const rewrites = [
                {
                    glob: "**",
                    run: {
                        serviceId: SERVICE,
                        region: REGION,
                        tag: runTagsNS.TODO_TAG_NAME,
                    },
                },
            ];
            run.getService.withArgs(svcName).resolves(svc);
            runTags.gcTagsForServices.resolves();
            runTags.ensureLatestRevisionTagged.resolves({ [REGION]: { [SERVICE]: "fh-3" } });
            await runTags.setRewriteTags(rewrites, PROJECT, "3");
            (0, chai_1.expect)(runTags.ensureLatestRevisionTagged);
            (0, chai_1.expect)(runTags.gcTagsForServices).to.have.been.called;
        });
    });
    describe("ensureLatestRevisionTagged", () => {
        beforeEach(() => {
            runTags.ensureLatestRevisionTagged.restore();
        });
        it("Reuses existing tag names", async () => {
            const svc = service(SERVICE, { revisionName: "latest", tag: "existing" });
            await runTags.ensureLatestRevisionTagged([svc], "new-tag");
            (0, chai_1.expect)(svc.spec.traffic).to.deep.equal([
                {
                    latestRevision: true,
                    percent: 100,
                },
                {
                    revisionName: "latest",
                    tag: "existing",
                },
            ]);
            (0, chai_1.expect)(run.updateService).to.not.have.been.called;
        });
        it("Adds new tags as necessary", async () => {
            const svc = service(SERVICE);
            run.updateService.resolves();
            await runTags.ensureLatestRevisionTagged([svc], "new-tag");
            (0, chai_1.expect)(svc.spec.traffic).to.deep.equal([
                {
                    latestRevision: true,
                    percent: 100,
                },
                {
                    revisionName: "latest",
                    tag: "new-tag",
                },
            ]);
        });
    });
});
//# sourceMappingURL=runTags.spec.js.map