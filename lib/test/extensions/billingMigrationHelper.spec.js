"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const error_1 = require("../../error");
const nodejsMigrationHelper = require("../../extensions/billingMigrationHelper");
const prompt = require("../../prompt");
const utils_1 = require("../../utils");
const NO_RUNTIME_SPEC = {
    name: "test",
    specVersion: "v1beta",
    displayName: "Old",
    description: "descriptive",
    version: "1.0.0",
    license: "MIT",
    resources: [
        {
            name: "resource1",
            type: "firebaseextensions.v1beta.function",
            description: "desc",
            properties: {},
        },
    ],
    author: { authorName: "Tester" },
    contributors: [{ authorName: "Tester 2" }],
    billingRequired: true,
    sourceUrl: "test.com",
    params: [],
    systemParams: [],
};
const NODE8_SPEC = {
    name: "test",
    specVersion: "v1beta",
    displayName: "Old",
    description: "descriptive",
    version: "1.0.0",
    license: "MIT",
    resources: [
        {
            name: "resource1",
            type: "firebaseextensions.v1beta.function",
            description: "desc",
            properties: { runtime: "nodejs8" },
        },
    ],
    author: { authorName: "Tester" },
    contributors: [{ authorName: "Tester 2" }],
    billingRequired: true,
    sourceUrl: "test.com",
    params: [],
    systemParams: [],
};
const NODE10_SPEC = {
    name: "test",
    specVersion: "v1beta",
    displayName: "Old",
    description: "descriptive",
    version: "1.0.0",
    license: "MIT",
    resources: [
        {
            name: "resource1",
            type: "firebaseextensions.v1beta.function",
            description: "desc",
            properties: { runtime: "nodejs10" },
        },
    ],
    author: { authorName: "Tester" },
    contributors: [{ authorName: "Tester 2" }],
    billingRequired: true,
    sourceUrl: "test.com",
    params: [],
    systemParams: [],
};
describe("billingMigrationHelper", () => {
    let promptStub;
    beforeEach(() => {
        promptStub = sinon.stub(prompt, "promptOnce");
    });
    afterEach(() => {
        promptStub.restore();
    });
    describe("displayNode10CreateBillingNotice", () => {
        it("should notify the user if the runtime requires nodejs10", async () => {
            promptStub.resolves(true);
            const newSpec = (0, utils_1.cloneDeep)(NODE10_SPEC);
            await (0, chai_1.expect)(nodejsMigrationHelper.displayNode10CreateBillingNotice(newSpec, true)).not.to.be
                .rejected;
            (0, chai_1.expect)(promptStub.callCount).to.equal(1);
        });
        it("should notify the user if the runtime does not require nodejs (explicit)", async () => {
            promptStub.resolves(true);
            const newSpec = (0, utils_1.cloneDeep)(NODE8_SPEC);
            await (0, chai_1.expect)(nodejsMigrationHelper.displayNode10CreateBillingNotice(newSpec, true)).not.to.be
                .rejected;
            (0, chai_1.expect)(promptStub.callCount).to.equal(0);
        });
        it("should notify the user if the runtime does not require nodejs (implicit)", async () => {
            promptStub.resolves(true);
            const newSpec = (0, utils_1.cloneDeep)(NO_RUNTIME_SPEC);
            await (0, chai_1.expect)(nodejsMigrationHelper.displayNode10CreateBillingNotice(newSpec, true)).not.to.be
                .rejected;
            (0, chai_1.expect)(promptStub.callCount).to.equal(0);
        });
        it("should error if the user doesn't give consent", async () => {
            promptStub.resolves(false);
            const newSpec = (0, utils_1.cloneDeep)(NODE10_SPEC);
            await (0, chai_1.expect)(nodejsMigrationHelper.displayNode10CreateBillingNotice(newSpec, true)).to.be.rejectedWith(error_1.FirebaseError, "Cancelled");
        });
    });
});
//# sourceMappingURL=billingMigrationHelper.spec.js.map