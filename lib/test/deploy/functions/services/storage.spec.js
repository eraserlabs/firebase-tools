"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const storage_1 = require("../../../../deploy/functions/services/storage");
const storage = require("../../../../gcp/storage");
const projectNumber = "123456789";
const STORAGE_RES = {
    email_address: "service-123@gs-project-accounts.iam.gserviceaccount.com",
    kind: "storage#serviceAccount",
};
describe("obtainStorageBindings", () => {
    let storageStub;
    beforeEach(() => {
        storageStub = sinon
            .stub(storage, "getServiceAccount")
            .throws("unexpected call to storage.getServiceAccount");
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    it("should return the correct storage binding", async () => {
        storageStub.resolves(STORAGE_RES);
        const bindings = await (0, storage_1.obtainStorageBindings)(projectNumber);
        (0, chai_1.expect)(bindings.length).to.equal(1);
        (0, chai_1.expect)(bindings[0]).to.deep.equal({
            role: "roles/pubsub.publisher",
            members: [`serviceAccount:${STORAGE_RES.email_address}`],
        });
    });
});
//# sourceMappingURL=storage.spec.js.map