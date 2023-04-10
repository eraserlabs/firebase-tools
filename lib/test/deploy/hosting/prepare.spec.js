"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const hostingApi = require("../../../hosting/api");
const tracking = require("../../../track");
const deploymentTool = require("../../../deploymentTool");
const hosting_1 = require("../../../deploy/hosting");
describe("hosting prepare", () => {
    let hostingStub;
    let trackingStub;
    let siteConfig;
    let firebaseJson;
    let options;
    beforeEach(() => {
        hostingStub = sinon.stub(hostingApi);
        trackingStub = sinon.stub(tracking);
        siteConfig = {
            site: "site",
            public: ".",
        };
        firebaseJson = {
            hosting: siteConfig,
        };
        options = {
            cwd: ".",
            configPath: ".",
            only: "",
            except: "",
            filteredTargets: ["HOSTING"],
            force: false,
            json: false,
            nonInteractive: false,
            interactive: true,
            debug: false,
            config: {
                src: firebaseJson,
            },
            rc: null,
            normalizedHostingConfig: [siteConfig],
        };
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("passes a smoke test with web framework", async () => {
        siteConfig.webFramework = "fake-framework";
        hostingStub.createVersion.callsFake((siteId, version) => {
            (0, chai_1.expect)(siteId).to.equal(siteConfig.site);
            (0, chai_1.expect)(version.status).to.equal("CREATED");
            (0, chai_1.expect)(version.labels).to.deep.equal(Object.assign(Object.assign({}, deploymentTool.labels()), { "firebase-web-framework": "fake-framework" }));
            return Promise.resolve("version");
        });
        const context = {
            projectId: "project",
        };
        await (0, hosting_1.prepare)(context, options);
        (0, chai_1.expect)(trackingStub.track).to.have.been.calledOnceWith("hosting_deploy", "fake-framework");
        (0, chai_1.expect)(hostingStub.createVersion).to.have.been.calledOnce;
        (0, chai_1.expect)(context.hosting).to.deep.equal({
            deploys: [
                {
                    config: siteConfig,
                    version: "version",
                },
            ],
        });
    });
    it("passes a smoke test without web framework", async () => {
        hostingStub.createVersion.callsFake((siteId, version) => {
            (0, chai_1.expect)(siteId).to.equal(siteConfig.site);
            (0, chai_1.expect)(version.status).to.equal("CREATED");
            (0, chai_1.expect)(version.labels).to.deep.equal(deploymentTool.labels());
            return Promise.resolve("version");
        });
        const context = {
            projectId: "project",
        };
        await (0, hosting_1.prepare)(context, options);
        (0, chai_1.expect)(trackingStub.track).to.have.been.calledOnceWith("hosting_deploy", "classic");
        (0, chai_1.expect)(hostingStub.createVersion).to.have.been.calledOnce;
        (0, chai_1.expect)(context.hosting).to.deep.equal({
            deploys: [
                {
                    config: siteConfig,
                    version: "version",
                },
            ],
        });
    });
});
//# sourceMappingURL=prepare.spec.js.map