"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const resolveSource = require("../../extensions/resolveSource");
const utils = require("../../utils");
const warnings = require("../../extensions/warnings");
const types_1 = require("../../extensions/types");
const testExtensionVersion = {
    name: "test",
    ref: "test/test@0.1.0",
    state: "PUBLISHED",
    hash: "abc123",
    sourceDownloadUri: "https://download.com/source",
    spec: {
        name: "test",
        version: "0.1.0",
        resources: [],
        params: [],
        systemParams: [],
        sourceUrl: "github.com/test/meout",
    },
};
const testExtension = (publisherId, launchStage) => {
    return {
        name: "test",
        ref: `${publisherId}/test`,
        registryLaunchStage: launchStage,
        createTime: "101",
        visibility: types_1.Visibility.PUBLIC,
    };
};
const testInstanceSpec = (publisherId, instanceId, launchStage) => {
    return {
        instanceId,
        ref: {
            publisherId,
            extensionId: "test",
            version: "0.1.0",
        },
        params: {},
        systemParams: {},
        extensionVersion: testExtensionVersion,
        extension: testExtension(publisherId, launchStage),
    };
};
describe("displayWarningPrompts", () => {
    let getTrustedPublisherStub;
    let logLabeledStub;
    beforeEach(() => {
        getTrustedPublisherStub = sinon.stub(resolveSource, "getTrustedPublishers");
        getTrustedPublisherStub.returns(["firebase"]);
        logLabeledStub = sinon.stub(utils, "logLabeledBullet");
    });
    afterEach(() => {
        getTrustedPublisherStub.restore();
        logLabeledStub.restore();
    });
    it("should not warn if from trusted publisher and not experimental", async () => {
        const publisherId = "firebase";
        await warnings.displayWarningPrompts(publisherId, types_1.RegistryLaunchStage.BETA, testExtensionVersion);
        (0, chai_1.expect)(logLabeledStub).to.not.have.been.called;
    });
    it("should warn if experimental", async () => {
        const publisherId = "firebase";
        await warnings.displayWarningPrompts(publisherId, types_1.RegistryLaunchStage.EXPERIMENTAL, testExtensionVersion);
        (0, chai_1.expect)(logLabeledStub).to.have.been.calledWithMatch("extensions", "experimental");
    });
    it("should warn if the publisher is not on the approved publisher list", async () => {
        const publisherId = "pubby-mcpublisher";
        await warnings.displayWarningPrompts(publisherId, types_1.RegistryLaunchStage.BETA, testExtensionVersion);
        (0, chai_1.expect)(logLabeledStub).to.have.been.calledWithMatch("extensions", "Early Access Program");
    });
});
describe("displayWarningsForDeploy", () => {
    let getTrustedPublisherStub;
    let logLabeledStub;
    beforeEach(() => {
        getTrustedPublisherStub = sinon.stub(resolveSource, "getTrustedPublishers");
        getTrustedPublisherStub.returns(["firebase"]);
        logLabeledStub = sinon.stub(utils, "logLabeledBullet");
    });
    afterEach(() => {
        getTrustedPublisherStub.restore();
        logLabeledStub.restore();
    });
    it("should not warn or prompt if from trusted publisher and not experimental", async () => {
        const toCreate = [
            testInstanceSpec("firebase", "ext-id-1", types_1.RegistryLaunchStage.GA),
            testInstanceSpec("firebase", "ext-id-2", types_1.RegistryLaunchStage.GA),
        ];
        const warned = await warnings.displayWarningsForDeploy(toCreate);
        (0, chai_1.expect)(warned).to.be.false;
        (0, chai_1.expect)(logLabeledStub).to.not.have.been.called;
    });
    it("should prompt if experimental", async () => {
        const toCreate = [
            testInstanceSpec("firebase", "ext-id-1", types_1.RegistryLaunchStage.EXPERIMENTAL),
            testInstanceSpec("firebase", "ext-id-2", types_1.RegistryLaunchStage.EXPERIMENTAL),
        ];
        const warned = await warnings.displayWarningsForDeploy(toCreate);
        (0, chai_1.expect)(warned).to.be.true;
        (0, chai_1.expect)(logLabeledStub).to.have.been.calledWithMatch("extensions", "experimental");
    });
    it("should prompt if the publisher is not on the approved publisher list", async () => {
        const toCreate = [
            testInstanceSpec("pubby-mcpublisher", "ext-id-1", types_1.RegistryLaunchStage.GA),
            testInstanceSpec("pubby-mcpublisher", "ext-id-2", types_1.RegistryLaunchStage.GA),
        ];
        const warned = await warnings.displayWarningsForDeploy(toCreate);
        (0, chai_1.expect)(warned).to.be.true;
        (0, chai_1.expect)(logLabeledStub).to.have.been.calledWithMatch("extensions", "Early Access Program");
    });
    it("should show multiple warnings at once if triggered", async () => {
        const toCreate = [
            testInstanceSpec("pubby-mcpublisher", "ext-id-1", types_1.RegistryLaunchStage.GA),
            testInstanceSpec("firebase", "ext-id-2", types_1.RegistryLaunchStage.EXPERIMENTAL),
        ];
        const warned = await warnings.displayWarningsForDeploy(toCreate);
        (0, chai_1.expect)(warned).to.be.true;
        (0, chai_1.expect)(logLabeledStub).to.have.been.calledWithMatch("extensions", "Early Access Program");
        (0, chai_1.expect)(logLabeledStub).to.have.been.calledWithMatch("extensions", "experimental");
    });
});
//# sourceMappingURL=warnings.spec.js.map