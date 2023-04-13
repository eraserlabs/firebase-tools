"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const error_1 = require("../../../error");
const backend = require("../../../deploy/functions/backend");
const functionPrompts = require("../../../deploy/functions/prompts");
const prompt = require("../../../prompt");
const utils = require("../../../utils");
const rc_1 = require("../../../rc");
const SAMPLE_EVENT_TRIGGER = {
    eventType: "google.pubsub.topic.publish",
    eventFilters: { resource: "projects/a/topics/b" },
    retry: false,
};
const SAMPLE_ENDPOINT = {
    platform: "gcfv1",
    id: "c",
    region: "us-central1",
    project: "a",
    entryPoint: "function",
    labels: {},
    environmentVariables: {},
    runtime: "nodejs16",
    eventTrigger: SAMPLE_EVENT_TRIGGER,
};
const SAMPLE_OPTIONS = {
    cwd: "/",
    configPath: "/",
    config: {},
    only: "functions",
    except: "",
    nonInteractive: false,
    json: false,
    interactive: false,
    debug: false,
    force: false,
    filteredTargets: ["functions"],
    rc: new rc_1.RC(),
};
describe("promptForFailurePolicies", () => {
    let promptStub;
    beforeEach(() => {
        promptStub = sinon.stub(prompt, "promptOnce");
    });
    afterEach(() => {
        promptStub.restore();
    });
    it("should prompt if there are new functions with failure policies", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign(Object.assign({}, SAMPLE_EVENT_TRIGGER), { retry: true }) });
        promptStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).not.to.be.rejected;
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should not prompt if all functions with failure policies already had failure policies", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign(Object.assign({}, SAMPLE_EVENT_TRIGGER), { retry: true }) });
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).to.not.have.been.called;
    });
    it("should throw if user declines the prompt", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign(Object.assign({}, SAMPLE_EVENT_TRIGGER), { retry: true }) });
        promptStub.resolves(false);
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.rejectedWith(error_1.FirebaseError, /Deployment canceled/);
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should prompt if an existing function adds a failure policy", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign({}, SAMPLE_EVENT_TRIGGER) });
        const newEndpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign(Object.assign({}, SAMPLE_EVENT_TRIGGER), { retry: true }) });
        promptStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should throw if there are any functions with failure policies and the user doesn't accept the prompt", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign(Object.assign({}, SAMPLE_EVENT_TRIGGER), { retry: true }) });
        promptStub.resolves(false);
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.rejectedWith(error_1.FirebaseError, /Deployment canceled/);
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should not prompt if there are no functions with failure policies", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign({}, SAMPLE_EVENT_TRIGGER) });
        promptStub.resolves();
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).not.to.have.been.called;
    });
    it("should throw if there are any functions with failure policies, in noninteractive mode, without the force flag set", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign(Object.assign({}, SAMPLE_EVENT_TRIGGER), { retry: true }) });
        const options = Object.assign(Object.assign({}, SAMPLE_OPTIONS), { nonInteractive: true });
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(options, backend.of(endpoint), backend.empty())).to.be.rejectedWith(error_1.FirebaseError, /--force option/);
        (0, chai_1.expect)(promptStub).not.to.have.been.called;
    });
    it("should not throw if there are any functions with failure policies, in noninteractive mode, with the force flag set", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { eventTrigger: Object.assign(Object.assign({}, SAMPLE_EVENT_TRIGGER), { retry: true }) });
        const options = Object.assign(Object.assign({}, SAMPLE_OPTIONS), { nonInteractive: true, force: true });
        await (0, chai_1.expect)(functionPrompts.promptForFailurePolicies(options, backend.of(endpoint), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).not.to.have.been.called;
    });
});
describe("promptForMinInstances", () => {
    let promptStub;
    let logStub;
    beforeEach(() => {
        promptStub = sinon.stub(prompt, "promptOnce");
        logStub = sinon.stub(utils, "logLabeledWarning");
    });
    afterEach(() => {
        promptStub.restore();
        logStub.restore();
    });
    it("should prompt if there are new functions with minInstances", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 1 });
        promptStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).not.to.be.rejected;
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should not prompt if no fucntion has minInstance", async () => {
        const bkend = backend.of(SAMPLE_ENDPOINT);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, bkend, bkend)).to.eventually
            .be.fulfilled;
        (0, chai_1.expect)(promptStub).to.not.have.been.called;
    });
    it("should not prompt if all functions with minInstances already had the same number of minInstances", async () => {
        const bkend = backend.of(Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 1 }));
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, bkend, bkend)).to.eventually
            .be.fulfilled;
        (0, chai_1.expect)(promptStub).to.not.have.been.called;
    });
    it("should not prompt if functions decrease in minInstances", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 2 });
        const newEndpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 1 });
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).to.not.have.been.called;
    });
    it("should throw if user declines the prompt", async () => {
        const bkend = backend.of(Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 1 }));
        promptStub.resolves(false);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, bkend, backend.empty())).to.eventually.be.rejectedWith(error_1.FirebaseError, /Deployment canceled/);
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should prompt if an existing function sets minInstances", async () => {
        const newEndpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 1 });
        promptStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(SAMPLE_ENDPOINT))).eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should prompt if an existing function increases minInstances", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 1 });
        const newEndpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 2 });
        promptStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should prompt if a minInstance function increases resource reservations", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 2, availableMemoryMb: 1024 });
        const newEndpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 2, availableMemoryMb: 2048 });
        promptStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(newEndpoint), backend.of(endpoint))).eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should throw if there are any functions with failure policies and the user doesn't accept the prompt", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 2 });
        promptStub.resolves(false);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.rejectedWith(error_1.FirebaseError, /Deployment canceled/);
        (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
    });
    it("should not prompt if there are no functions with minInstances", async () => {
        promptStub.resolves();
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(SAMPLE_ENDPOINT), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).not.to.have.been.called;
    });
    it("should throw if there are any functions with minInstances, in noninteractive mode, without the force flag set", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 1 });
        const options = Object.assign(Object.assign({}, SAMPLE_OPTIONS), { nonInteractive: true });
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(options, backend.of(endpoint), backend.empty())).to.be.rejectedWith(error_1.FirebaseError, /--force option/);
        (0, chai_1.expect)(promptStub).not.to.have.been.called;
    });
    it("should not throw if there are any functions with minInstances, in noninteractive mode, with the force flag set", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { minInstances: 1 });
        const options = Object.assign(Object.assign({}, SAMPLE_OPTIONS), { nonInteractive: true, force: true });
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(options, backend.of(endpoint), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).not.to.have.been.called;
    });
    it("Should disclaim if a bill cannot be calculated", async () => {
        const endpoint = Object.assign(Object.assign({}, SAMPLE_ENDPOINT), { region: "fillory", minInstances: 1 });
        promptStub.resolves(true);
        await (0, chai_1.expect)(functionPrompts.promptForMinInstances(SAMPLE_OPTIONS, backend.of(endpoint), backend.empty())).to.eventually.be.fulfilled;
        (0, chai_1.expect)(promptStub).to.have.been.called;
        (0, chai_1.expect)(logStub.firstCall.args[1]).to.match(/Cannot calculate the minimum monthly bill/);
    });
});
//# sourceMappingURL=prompts.spec.js.map