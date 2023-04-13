"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const jsonwebtoken_1 = require("jsonwebtoken");
const operations_1 = require("../../../emulator/auth/operations");
const state_1 = require("../../../emulator/auth/state");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("sign-in with custom token", ({ authApi }) => {
    it("should create new account from custom token (unsigned)", async () => {
        const uid = "someuid";
        const claims = { abc: "def", ultimate: { answer: 42 } };
        const token = (0, jsonwebtoken_1.sign)({ uid, claims }, "fake-secret", {
            algorithm: "none",
            expiresIn: 3600,
            subject: "fake-service-account@example.com",
            issuer: "fake-service-account@example.com",
            audience: operations_1.CUSTOM_TOKEN_AUDIENCE,
        });
        const idToken = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("sign_in_provider")
                .equals(state_1.PROVIDER_CUSTOM);
            (0, chai_1.expect)(decoded.payload).deep.include(claims);
            return idToken;
        });
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.localId).to.equal(uid);
    });
    it("should sign into existing account and merge claims", async () => {
        const email = "alice@example.com";
        const { localId } = await (0, helpers_1.signInWithEmailLink)(authApi(), email);
        const customClaims = { abc: "abc", foo: "bar" };
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, {
            customAttributes: JSON.stringify(customClaims),
        });
        const claims = { abc: "def", ultimate: { answer: 42 } };
        const token = JSON.stringify({ uid: localId, claims });
        const refreshToken = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.isNewUser).to.equal(false);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("sign_in_provider")
                .equals(state_1.PROVIDER_CUSTOM);
            (0, chai_1.expect)(decoded.payload.firebase.identities).to.eql({
                email: [email],
            });
            (0, chai_1.expect)(decoded.payload).to.deep.include(Object.assign(Object.assign({}, customClaims), claims));
            return res.body.refreshToken;
        });
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refreshToken, grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            const idToken = res.body.id_token;
            (0, chai_1.expect)(idToken).to.be.a("string");
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.payload).to.deep.include(Object.assign(Object.assign({}, customClaims), claims));
        });
    });
    it("should error if custom token is missing", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({})
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("MISSING_CUSTOM_TOKEN");
        });
    });
    it("should error if custom token is invalid", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token: "{not+Json,That's=>For@Sure}" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("INVALID_CUSTOM_TOKEN");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token: "ThisMayLookLikeAJWT.ButItWontDecode.ToJsonObjects" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("INVALID_CUSTOM_TOKEN");
        });
    });
    it("should error if custom token addresses the wrong audience", async () => {
        const token = (0, jsonwebtoken_1.sign)({ uid: "foo" }, "fake-secret", {
            algorithm: "none",
            expiresIn: 3600,
            subject: "fake-service-account@example.com",
            issuer: "fake-service-account@example.com",
            audience: "http://localhost/not-the-firebase-auth-audience",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("INVALID_CUSTOM_TOKEN");
        });
    });
    it("should error if custom token contains no uid", async () => {
        const token = (0, jsonwebtoken_1.sign)({}, "fake-secret", {
            algorithm: "none",
            expiresIn: 3600,
            subject: "fake-service-account@example.com",
            issuer: "fake-service-account@example.com",
            audience: operations_1.CUSTOM_TOKEN_AUDIENCE,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("MISSING_IDENTIFIER");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token: '{"look": "I do not have uid"}' })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("MISSING_IDENTIFIER");
        });
    });
    it("should error if custom token contains forbidden claims", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token: '{"uid": "wow", "claims": {"firebase": "awesome"}}' })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("FORBIDDEN_CLAIM : firebase");
        });
    });
    it("should error if user is disabled", async () => {
        const email = "alice@example.com";
        const { localId } = await (0, helpers_1.signInWithEmailLink)(authApi(), email);
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        const claims = { abc: "def", ultimate: { answer: 42 } };
        const token = JSON.stringify({ uid: localId, claims });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equal("USER_DISABLED");
        });
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({
            tenantId: tenant.tenantId,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error if custom token tenantId does not match", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: false });
        const uid = "someuid";
        const claims = { abc: "def", ultimate: { answer: 42 } };
        const token = (0, jsonwebtoken_1.sign)({ uid, claims, tenant_id: "not-matching-tenant-id" }, "fake-secret", {
            algorithm: "none",
            expiresIn: 3600,
            subject: "fake-service-account@example.com",
            issuer: "fake-service-account@example.com",
            audience: operations_1.CUSTOM_TOKEN_AUDIENCE,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token, tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("TENANT_ID_MISMATCH");
        });
    });
    it("should create a new account from custom token with tenantId", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: false });
        const uid = "someuid";
        const claims = { abc: "def", ultimate: { answer: 42 } };
        const token = (0, jsonwebtoken_1.sign)({ uid, claims, tenant_id: tenant.tenantId }, "fake-secret", {
            algorithm: "none",
            expiresIn: 3600,
            subject: "fake-service-account@example.com",
            issuer: "fake-service-account@example.com",
            audience: operations_1.CUSTOM_TOKEN_AUDIENCE,
        });
        const idToken = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken")
            .query({ key: "fake-api-key" })
            .send({ token, tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            return res.body.idToken;
        });
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken, tenant.tenantId);
        (0, chai_1.expect)(info.tenantId).to.equal(tenant.tenantId);
    });
});
//# sourceMappingURL=customToken.spec.js.map