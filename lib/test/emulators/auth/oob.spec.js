"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("accounts:sendOobCode", ({ authApi, getClock }) => {
    it("should generate OOB code for verify email", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { idToken, localId } = await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ idToken, requestType: "VERIFY_EMAIL" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(user.email);
            (0, chai_1.expect)(res.body).not.to.have.property("oobCode");
            (0, chai_1.expect)(res.body).not.to.have.property("oobLink");
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(1);
        (0, chai_1.expect)(oobs[0].email).to.equal(user.email);
        (0, chai_1.expect)(oobs[0].requestType).to.equal("VERIFY_EMAIL");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ oobCode: oobs[0].oobCode })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).to.equal(localId);
            (0, chai_1.expect)(res.body.email).to.equal(user.email);
            (0, chai_1.expect)(res.body.emailVerified).to.equal(true);
        });
        const oobs2 = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs2).to.have.length(0);
    });
    it("should return OOB code directly for requests with OAuth 2", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .set("Authorization", "Bearer owner")
            .send({ email: user.email, requestType: "PASSWORD_RESET", returnOobLink: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(user.email);
            (0, chai_1.expect)(res.body.oobCode).to.be.a("string");
            (0, chai_1.expect)(res.body.oobLink).to.be.a("string");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .set("Authorization", "Bearer owner")
            .send({ email: user.email, requestType: "VERIFY_EMAIL", returnOobLink: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(user.email);
            (0, chai_1.expect)(res.body.oobCode).to.be.a("string");
            (0, chai_1.expect)(res.body.oobLink).to.be.a("string");
        });
    });
    it("should return OOB code by idToken for OAuth 2 requests as well", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .set("Authorization", "Bearer owner")
            .send({ idToken, requestType: "VERIFY_EMAIL", returnOobLink: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(user.email);
            (0, chai_1.expect)(res.body.oobCode).to.be.a("string");
            (0, chai_1.expect)(res.body.oobLink).to.be.a("string");
        });
    });
    it("should error when trying to verify email without idToken or email", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ requestType: "VERIFY_EMAIL" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equal("INVALID_ID_TOKEN");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .set("Authorization", "Bearer owner")
            .send({ returnOobLink: true, requestType: "VERIFY_EMAIL" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equal("MISSING_EMAIL");
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(0);
    });
    it("should error when trying to verify email without idToken if not returnOobLink", async () => {
        const user = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ email: user.email, requestType: "VERIFY_EMAIL" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equal("INVALID_ID_TOKEN");
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(0);
    });
    it("should error when trying to verify email not associated with any user", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .set("Authorization", "Bearer owner")
            .send({ email: "nosuchuser@example.com", returnOobLink: true, requestType: "VERIFY_EMAIL" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equal("USER_NOT_FOUND");
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(0);
    });
    it("should error when verifying email for accounts without email", async () => {
        const { idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ idToken, requestType: "VERIFY_EMAIL" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equal("MISSING_EMAIL");
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(0);
    });
    it("should error if user is disabled", async () => {
        const { localId, idToken, email } = await (0, helpers_1.registerUser)(authApi(), {
            email: "foo@example.com",
            password: "foobar",
        });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ email, idToken, requestType: "VERIFY_EMAIL" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_DISABLED");
        });
    });
    it("should error when continueUrl is invalid", async () => {
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({
            idToken,
            requestType: "VERIFY_EMAIL",
            continueUrl: "noSchemeOrHost",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contain("INVALID_CONTINUE_URI");
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(0);
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error for email sign in if not enabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            enableEmailLinkSignin: false,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId, email: "bob@example.com", requestType: "EMAIL_SIGNIN" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("OPERATION_NOT_ALLOWED");
        });
    });
    it("should generate OOB code for reset password", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        getClock().tick(2000);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ requestType: "PASSWORD_RESET", email: user.email })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(user.email);
            (0, chai_1.expect)(res.body).not.to.have.property("oobCode");
            (0, chai_1.expect)(res.body).not.to.have.property("oobLink");
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(1);
        (0, chai_1.expect)(oobs[0].email).to.equal(user.email);
        (0, chai_1.expect)(oobs[0].requestType).to.equal("PASSWORD_RESET");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:resetPassword")
            .query({ key: "fake-api-key" })
            .send({ oobCode: oobs[0].oobCode, newPassword: "notasecret2" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.requestType).to.equal("PASSWORD_RESET");
            (0, chai_1.expect)(res.body.email).to.equal(user.email);
        });
        await (0, helpers_1.expectIdTokenExpired)(authApi(), idToken);
    });
    it("should return purpose of oobCodes via resetPassword endpoint", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ requestType: "PASSWORD_RESET", email: user.email })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ requestType: "VERIFY_EMAIL", idToken })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .query({ key: "fake-api-key" })
            .send({ email: "bob@example.com", requestType: "EMAIL_SIGNIN" })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(3);
        for (const oob of oobs) {
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:resetPassword")
                .query({ key: "fake-api-key" })
                .send({ oobCode: oob.oobCode })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.requestType).to.equal(oob.requestType);
                if (oob.requestType === "EMAIL_SIGNIN") {
                    (0, chai_1.expect)(res.body).not.to.have.property("email");
                }
                else {
                    (0, chai_1.expect)(res.body.email).to.equal(oob.email);
                }
            });
        }
        const oobs2 = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs2).to.have.length(3);
    });
    it("should error on resetPassword if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:resetPassword")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error on resetPassword if password sign up is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            allowPasswordSignup: false,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:resetPassword")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PASSWORD_LOGIN_DISABLED");
        });
    });
});
//# sourceMappingURL=oob.spec.js.map