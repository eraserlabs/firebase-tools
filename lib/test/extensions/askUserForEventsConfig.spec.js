"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const askUserForEventsConfig_1 = require("../../extensions/askUserForEventsConfig");
const utils = require("../../utils");
const prompt = require("../../prompt");
describe("checkAllowedEventTypesResponse", () => {
    let logWarningSpy;
    beforeEach(() => {
        logWarningSpy = sinon.spy(utils, "logWarning");
    });
    afterEach(() => {
        logWarningSpy.restore();
    });
    it("should return false if allowed events is not part of extension spec's events list", () => {
        (0, chai_1.expect)((0, askUserForEventsConfig_1.checkAllowedEventTypesResponse)(["google.firebase.nonexistent-event-occurred"], [{ type: "google.firebase.custom-event-occurred", description: "A custom event occurred" }])).to.equal(false);
        (0, chai_1.expect)(logWarningSpy.calledWith("Unexpected event type 'google.firebase.nonexistent-event-occurred' was configured to be emitted. This event type is not part of the extension spec.")).to.equal(true);
    });
    it("should return true if every allowed event exists in extension spec's events list", () => {
        (0, chai_1.expect)((0, askUserForEventsConfig_1.checkAllowedEventTypesResponse)(["google.firebase.custom-event-occurred"], [{ type: "google.firebase.custom-event-occurred", description: "A custom event occurred" }])).to.equal(true);
    });
});
describe("askForAllowedEventTypes", () => {
    let promptStub;
    afterEach(() => {
        promptStub.restore();
    });
    it("should keep prompting user until valid input is given", async () => {
        promptStub = sinon.stub(prompt, "promptOnce");
        promptStub.onCall(0).returns(["invalid"]);
        promptStub.onCall(1).returns(["stillinvalid"]);
        promptStub.onCall(2).returns(["google.firebase.custom-event-occurred"]);
        await (0, askUserForEventsConfig_1.askForAllowedEventTypes)([
            { type: "google.firebase.custom-event-occurred", description: "A custom event occurred" },
        ]);
        (0, chai_1.expect)(promptStub.calledThrice).to.be.true;
    });
});
describe("askForEventarcLocation", () => {
    let promptStub;
    beforeEach(() => {
        promptStub = sinon.stub(prompt, "promptOnce");
        promptStub.onCall(0).returns("invalid-region");
        promptStub.onCall(1).returns("still-invalid-region");
        promptStub.onCall(2).returns("us-central1");
    });
    afterEach(() => {
        promptStub.restore();
    });
    it("should keep prompting user until valid input is given", async () => {
        await (0, askUserForEventsConfig_1.askForEventArcLocation)();
        (0, chai_1.expect)(promptStub.calledThrice).to.be.true;
    });
});
//# sourceMappingURL=askUserForEventsConfig.spec.js.map