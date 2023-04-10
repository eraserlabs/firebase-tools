"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
chai.use(require("chai-as-promised"));
const sinon = require("sinon");
const checkProjectBilling = require("../../extensions/checkProjectBilling");
const prompt = require("../../prompt");
const cloudbilling = require("../../gcp/cloudbilling");
const expect = chai.expect;
describe("checkProjectBilling", () => {
    let promptOnceStub;
    let checkBillingEnabledStub;
    let listBillingAccountsStub;
    let setBillingAccountStub;
    beforeEach(() => {
        promptOnceStub = sinon.stub(prompt, "promptOnce");
        checkBillingEnabledStub = sinon.stub(cloudbilling, "checkBillingEnabled");
        checkBillingEnabledStub.resolves();
        listBillingAccountsStub = sinon.stub(cloudbilling, "listBillingAccounts");
        listBillingAccountsStub.resolves();
        setBillingAccountStub = sinon.stub(cloudbilling, "setBillingAccount");
        setBillingAccountStub.resolves();
    });
    afterEach(() => {
        promptOnceStub.restore();
        checkBillingEnabledStub.restore();
        listBillingAccountsStub.restore();
        setBillingAccountStub.restore();
    });
    it("should resolve if billing enabled", async () => {
        const projectId = "already enabled";
        checkBillingEnabledStub.resolves(true);
        const enabled = await cloudbilling.checkBillingEnabled(projectId);
        if (!enabled) {
            await checkProjectBilling.enableBilling(projectId);
        }
        expect(listBillingAccountsStub.notCalled);
        expect(setBillingAccountStub.notCalled);
        expect(promptOnceStub.notCalled);
    });
    it("should list accounts if no billing account set, but accounts available.", async () => {
        const projectId = "not set, but have list";
        const accounts = [
            {
                name: "test-cloud-billing-account-name",
                open: true,
                displayName: "test-account",
            },
        ];
        checkBillingEnabledStub.resolves(false);
        listBillingAccountsStub.resolves(accounts);
        setBillingAccountStub.resolves(true);
        promptOnceStub.resolves("test-account");
        const enabled = await cloudbilling.checkBillingEnabled(projectId);
        if (!enabled) {
            await checkProjectBilling.enableBilling(projectId);
        }
        expect(listBillingAccountsStub.calledOnce);
        expect(setBillingAccountStub.calledOnce);
        expect(setBillingAccountStub.calledWith(projectId, "test-cloud-billing-account-name"));
    });
    it("should not list accounts if no billing accounts set or available.", async () => {
        const projectId = "not set, not available";
        checkBillingEnabledStub.onCall(0).resolves(false);
        checkBillingEnabledStub.onCall(1).resolves(true);
        listBillingAccountsStub.resolves([]);
        promptOnceStub.resolves();
        const enabled = await cloudbilling.checkBillingEnabled(projectId);
        if (!enabled) {
            await checkProjectBilling.enableBilling(projectId);
        }
        expect(listBillingAccountsStub.calledOnce);
        expect(setBillingAccountStub.notCalled);
        expect(checkBillingEnabledStub.callCount).to.equal(2);
    });
});
//# sourceMappingURL=checkProjectBilling.spec.js.map