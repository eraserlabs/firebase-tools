"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("accounts:delete", ({ authApi }) => {
    it("should delete the user of the idToken", async () => {
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:delete")
            .send({ idToken })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("error");
        });
        await (0, helpers_1.expectUserNotExistsForIdToken)(authApi(), idToken);
    });
    it("should error when trying to delete by localId without OAuth", async () => {
        const { localId } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:delete")
            .send({ localId })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("MISSING_ID_TOKEN");
        });
    });
    it("should remove federated accounts for user", async () => {
        const email = "alice@example.com";
        const providerId = "google.com";
        const sub = "12345";
        const { localId, idToken } = await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId, {
            sub,
            email,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:delete")
            .query({ key: "fake-api-key" })
            .send({ idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("error");
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), email)).to.be.empty;
        const signInAgain = await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId, {
            sub,
            email,
        });
        (0, chai_1.expect)(signInAgain.localId).not.to.equal(localId);
    });
    it("should delete the user by localId if OAuth credentials are present", async () => {
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:delete")
            .set("Authorization", "Bearer owner")
            .send({ localId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("error");
        });
        await (0, helpers_1.expectUserNotExistsForIdToken)(authApi(), idToken);
    });
    it("should error if missing localId when OAuth credentials are present", async () => {
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:delete")
            .set("Authorization", "Bearer owner")
            .send({ idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("MISSING_LOCAL_ID");
        });
    });
    it("should delete the user of the idToken", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:delete")
            .send({ tenantId: tenant.tenantId })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").includes("PROJECT_DISABLED");
        });
    });
});
//# sourceMappingURL=deleteAccount.spec.js.map