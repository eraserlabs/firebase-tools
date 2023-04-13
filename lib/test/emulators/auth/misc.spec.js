"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const jsonwebtoken_1 = require("jsonwebtoken");
const state_1 = require("../../../emulator/auth/state");
const helpers_1 = require("./helpers");
const setup_1 = require("./setup");
const helpers_2 = require("./helpers");
const operations_1 = require("../../../emulator/auth/operations");
const utils_1 = require("../../../emulator/auth/utils");
const auth_1 = require("../../../emulator/auth");
(0, setup_1.describeAuthEmulator)("token refresh", ({ authApi, getClock }) => {
    it("should exchange refresh token for new tokens", async () => {
        const { refreshToken, localId } = await (0, helpers_2.registerAnonUser)(authApi());
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: refreshToken, grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.id_token).to.be.a("string");
            (0, chai_1.expect)(res.body.access_token).to.equal(res.body.id_token);
            (0, chai_1.expect)(res.body.refresh_token).to.be.a("string");
            (0, chai_1.expect)(res.body.expires_in)
                .to.be.a("string")
                .matches(/[0-9]+/);
            (0, chai_1.expect)(res.body.project_id).to.equal("12345");
            (0, chai_1.expect)(res.body.token_type).to.equal("Bearer");
            (0, chai_1.expect)(res.body.user_id).to.equal(localId);
        });
    });
    it("should exchange refresh tokens for new tokens in a tenant project", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, {
            disableAuth: false,
            allowPasswordSignup: true,
        });
        const { refreshToken, localId } = await (0, helpers_2.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
            tenantId: tenant.tenantId,
        });
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: refreshToken, grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.id_token).to.be.a("string");
            (0, chai_1.expect)(res.body.access_token).to.equal(res.body.id_token);
            (0, chai_1.expect)(res.body.refresh_token).to.be.a("string");
            (0, chai_1.expect)(res.body.expires_in)
                .to.be.a("string")
                .matches(/[0-9]+/);
            (0, chai_1.expect)(res.body.project_id).to.equal("12345");
            (0, chai_1.expect)(res.body.token_type).to.equal("Bearer");
            (0, chai_1.expect)(res.body.user_id).to.equal(localId);
            const refreshTokenRecord = (0, state_1.decodeRefreshToken)(res.body.refresh_token);
            (0, chai_1.expect)(refreshTokenRecord.tenantId).to.equal(tenant.tenantId);
        });
    });
    it("should populate auth_time to match lastLoginAt (in seconds since epoch)", async () => {
        getClock().tick(444);
        const emailUser = { email: "alice@example.com", password: "notasecret" };
        const { refreshToken } = await (0, helpers_2.registerUser)(authApi(), emailUser);
        getClock().tick(2000);
        const res = await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: refreshToken, grantType: "refresh_token" })
            .query({ key: "fake-api-key" });
        const idToken = res.body.id_token;
        const user = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(user.lastLoginAt).not.to.be.undefined;
        const lastLoginAtSeconds = Math.floor(parseInt(user.lastLoginAt, 10) / 1000);
        const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
        (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
        (0, chai_1.expect)(decoded.header.alg).to.eql("none");
        (0, chai_1.expect)(decoded.payload.auth_time).to.equal(lastLoginAtSeconds);
    });
    it("should error if grant type is missing", async () => {
        const { refreshToken } = await (0, helpers_2.registerAnonUser)(authApi());
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: refreshToken })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("MISSING_GRANT_TYPE");
        });
    });
    it("should error if grant type is not refresh_token", async () => {
        const { refreshToken } = await (0, helpers_2.registerAnonUser)(authApi());
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: refreshToken, grantType: "other_grant_type" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("INVALID_GRANT_TYPE");
        });
    });
    it("should error if refresh token is missing", async () => {
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("MISSING_REFRESH_TOKEN");
        });
    });
    it("should error on malformed refresh tokens", async () => {
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: "malformedToken", grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("INVALID_REFRESH_TOKEN");
        });
    });
    it("should error if user is disabled", async () => {
        const { refreshToken, localId } = await (0, helpers_2.registerAnonUser)(authApi());
        await (0, helpers_2.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refreshToken: refreshToken, grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("USER_DISABLED");
        });
    });
    it("should error when refresh tokens are from a different project", async () => {
        const refreshTokenRecord = {
            _AuthEmulatorRefreshToken: "DO NOT MODIFY",
            localId: "localId",
            provider: "provider",
            extraClaims: {},
            projectId: "notMatchingProjectId",
        };
        const refreshToken = (0, state_1.encodeRefreshToken)(refreshTokenRecord);
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: refreshToken, grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("INVALID_REFRESH_TOKEN");
        });
    });
    it("should error on refresh tokens without required fields", async () => {
        const refreshTokenRecord = {
            localId: "localId",
            provider: "provider",
            extraClaims: {},
            projectId: "notMatchingProjectId",
        };
        const refreshToken = (0, state_1.encodeRefreshToken)(refreshTokenRecord);
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: refreshToken, grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("INVALID_REFRESH_TOKEN");
        });
    });
    it("should error if the refresh token is for a user that does not exist", async () => {
        const { refreshToken, idToken } = await (0, helpers_2.registerAnonUser)(authApi());
        await (0, helpers_2.deleteAccount)(authApi(), { idToken });
        await authApi()
            .post("/securetoken.googleapis.com/v1/token")
            .type("form")
            .send({ refresh_token: refreshToken, grantType: "refresh_token" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("INVALID_REFRESH_TOKEN");
        });
    });
});
(0, setup_1.describeAuthEmulator)("createSessionCookie", ({ authApi }) => {
    it("should return a valid sessionCookie", async () => {
        const { idToken } = await (0, helpers_2.registerAnonUser)(authApi());
        const validDuration = 7777;
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}:createSessionCookie`)
            .set("Authorization", "Bearer owner")
            .send({ idToken, validDuration: validDuration.toString() })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            const sessionCookie = res.body.sessionCookie;
            (0, chai_1.expect)(sessionCookie).to.be.a("string");
            const decoded = (0, jsonwebtoken_1.decode)(sessionCookie, { complete: true });
            (0, chai_1.expect)(decoded, "session cookie is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.iat).to.equal((0, utils_1.toUnixTimestamp)(new Date()));
            (0, chai_1.expect)(decoded.payload.exp).to.equal((0, utils_1.toUnixTimestamp)(new Date()) + validDuration);
            (0, chai_1.expect)(decoded.payload.iss).to.equal(`https://session.firebase.google.com/${helpers_1.PROJECT_ID}`);
            const idTokenProps = (0, jsonwebtoken_1.decode)(idToken);
            delete idTokenProps.iss;
            delete idTokenProps.iat;
            delete idTokenProps.exp;
            (0, chai_1.expect)(decoded.payload).to.deep.contain(idTokenProps);
        });
    });
    it("should throw if idToken is missing", async () => {
        const validDuration = 7777;
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}:createSessionCookie`)
            .set("Authorization", "Bearer owner")
            .send({ validDuration: validDuration.toString() })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("MISSING_ID_TOKEN");
        });
    });
    it("should throw if idToken is invalid", async () => {
        const validDuration = 7777;
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}:createSessionCookie`)
            .set("Authorization", "Bearer owner")
            .send({ idToken: "invalid", validDuration: validDuration.toString() })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_ID_TOKEN");
        });
    });
    it("should use default session cookie validDuration if not specified", async () => {
        const { idToken } = await (0, helpers_2.registerAnonUser)(authApi());
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}:createSessionCookie`)
            .set("Authorization", "Bearer owner")
            .send({ idToken })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            const sessionCookie = res.body.sessionCookie;
            (0, chai_1.expect)(sessionCookie).to.be.a("string");
            const decoded = (0, jsonwebtoken_1.decode)(sessionCookie, { complete: true });
            (0, chai_1.expect)(decoded, "session cookie is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.exp).to.equal((0, utils_1.toUnixTimestamp)(new Date()) + operations_1.SESSION_COOKIE_MAX_VALID_DURATION);
        });
    });
    it("should throw if validDuration is too short or too long", async () => {
        const { idToken } = await (0, helpers_2.registerAnonUser)(authApi());
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}:createSessionCookie`)
            .set("Authorization", "Bearer owner")
            .send({ idToken, validDuration: "1" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_DURATION");
        });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}:createSessionCookie`)
            .set("Authorization", "Bearer owner")
            .send({ idToken, validDuration: "999999999999" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_DURATION");
        });
    });
});
(0, setup_1.describeAuthEmulator)("accounts:lookup", ({ authApi }) => {
    it("should return user by localId when privileged", async () => {
        const { localId } = await (0, helpers_2.registerAnonUser)(authApi());
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:lookup`)
            .set("Authorization", "Bearer owner")
            .send({ localId: [localId] })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            (0, chai_1.expect)(res.body.users[0].localId).to.equal(localId);
        });
    });
    it("should deduplicate users", async () => {
        const { localId } = await (0, helpers_2.registerAnonUser)(authApi());
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:lookup`)
            .set("Authorization", "Bearer owner")
            .send({ localId: [localId, localId] })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            (0, chai_1.expect)(res.body.users[0].localId).to.equal(localId);
        });
    });
    it("should return providerUserInfo for phone auth users", async () => {
        const { localId } = await (0, helpers_1.signInWithPhoneNumber)(authApi(), helpers_1.TEST_PHONE_NUMBER);
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:lookup`)
            .set("Authorization", "Bearer owner")
            .send({ localId: [localId] })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            (0, chai_1.expect)(res.body.users[0].providerUserInfo).to.eql([
                {
                    phoneNumber: helpers_1.TEST_PHONE_NUMBER,
                    rawId: helpers_1.TEST_PHONE_NUMBER,
                    providerId: "phone",
                },
            ]);
        });
    });
    it("should return empty result when localId is not found", async () => {
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:lookup`)
            .set("Authorization", "Bearer owner")
            .send({ localId: ["noSuchId"] })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("users");
        });
    });
    it("should return user by tenantId in idToken", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, {
            disableAuth: false,
            allowPasswordSignup: true,
        });
        const { idToken, localId } = await (0, helpers_2.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
            tenantId: tenant.tenantId,
        });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/accounts:lookup`)
            .send({ idToken })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            (0, chai_1.expect)(res.body.users[0].localId).to.equal(localId);
        });
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:lookup")
            .set("Authorization", "Bearer owner")
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").includes("PROJECT_DISABLED");
        });
    });
});
(0, setup_1.describeAuthEmulator)("accounts:query", ({ authApi }) => {
    it("should return count of accounts when returnUserInfo is false", async () => {
        await (0, helpers_2.registerAnonUser)(authApi());
        await (0, helpers_2.registerAnonUser)(authApi());
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:query`)
            .set("Authorization", "Bearer owner")
            .send({ returnUserInfo: false })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.recordsCount).to.equal("2");
            (0, chai_1.expect)(res.body).not.to.have.property("userInfo");
        });
    });
    it("should return accounts when returnUserInfo is true", async () => {
        const { localId } = await (0, helpers_2.registerAnonUser)(authApi());
        const user = { email: "alice@example.com", password: "notasecret" };
        const { localId: localId2 } = await (0, helpers_2.registerUser)(authApi(), user);
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:query`)
            .set("Authorization", "Bearer owner")
            .send({})
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.recordsCount).to.equal("2");
            (0, chai_1.expect)(res.body.userInfo).to.be.an.instanceof(Array).with.lengthOf(2);
            const users = res.body.userInfo;
            (0, chai_1.expect)(users[0].localId < users[1].localId, "users are not sorted by ID ASC").to.be.true;
            const anonUser = users.find((x) => x.localId === localId);
            (0, chai_1.expect)(anonUser, "cannot find first registered user").to.be.not.undefined;
            const emailUser = users.find((x) => x.localId === localId2);
            (0, chai_1.expect)(emailUser, "cannot find second registered user").to.be.not.undefined;
            (0, chai_1.expect)(emailUser.email).to.equal(user.email);
        });
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:query`)
            .set("Authorization", "Bearer owner")
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
});
(0, setup_1.describeAuthEmulator)("emulator utility APIs", ({ authApi }) => {
    it("should drop all accounts on DELETE /emulator/v1/projects/{PROJECT_ID}/accounts", async () => {
        const user1 = await (0, helpers_2.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        const user2 = await (0, helpers_2.registerUser)(authApi(), {
            email: "bob@example.com",
            password: "notasecret2",
        });
        await authApi()
            .delete(`/emulator/v1/projects/${helpers_1.PROJECT_ID}/accounts`)
            .send()
            .then((res) => (0, helpers_2.expectStatusCode)(200, res));
        await (0, helpers_2.expectUserNotExistsForIdToken)(authApi(), user1.idToken);
        await (0, helpers_2.expectUserNotExistsForIdToken)(authApi(), user2.idToken);
    });
    it("should drop all accounts on DELETE /emulator/v1/projects/{PROJECT_ID}/tenants/{TENANT_ID}/accounts", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, {
            disableAuth: false,
            allowPasswordSignup: true,
        });
        const user1 = await (0, helpers_2.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
            tenantId: tenant.tenantId,
        });
        const user2 = await (0, helpers_2.registerUser)(authApi(), {
            email: "bob@example.com",
            password: "notasecret2",
            tenantId: tenant.tenantId,
        });
        await authApi()
            .delete(`/emulator/v1/projects/${helpers_1.PROJECT_ID}/tenants/${tenant.tenantId}/accounts`)
            .send()
            .then((res) => (0, helpers_2.expectStatusCode)(200, res));
        await (0, helpers_2.expectUserNotExistsForIdToken)(authApi(), user1.idToken, tenant.tenantId);
        await (0, helpers_2.expectUserNotExistsForIdToken)(authApi(), user2.idToken, tenant.tenantId);
    });
    it("should return config on GET /emulator/v1/projects/{PROJECT_ID}/config", async () => {
        await authApi()
            .get(`/emulator/v1/projects/${helpers_1.PROJECT_ID}/config`)
            .send()
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("signIn").eql({
                allowDuplicateEmails: false,
            });
        });
    });
    it("should not throw an exception on project ID mismatch if singleProjectMode is NO_WARNING", async () => {
        await authApi()
            .get(`/emulator/v1/projects/someproject/config`)
            .send()
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
        });
    });
    it("should update allowDuplicateEmails on PATCH /emulator/v1/projects/{PROJECT_ID}/config", async () => {
        await authApi()
            .patch(`/emulator/v1/projects/${helpers_1.PROJECT_ID}/config`)
            .send({ signIn: { allowDuplicateEmails: true } })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("signIn").eql({
                allowDuplicateEmails: true,
            });
        });
        await authApi()
            .patch(`/emulator/v1/projects/${helpers_1.PROJECT_ID}/config`)
            .send({ signIn: { allowDuplicateEmails: false } })
            .then((res) => {
            (0, helpers_2.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("signIn").eql({
                allowDuplicateEmails: false,
            });
        });
    });
});
(0, setup_1.describeAuthEmulator)("emulator utility API; singleProjectMode=ERROR", ({ authApi }) => {
    it("should throw an exception on project ID mismatch if singleProjectMode is ERROR", async () => {
        await authApi()
            .get(`/emulator/v1/projects/someproject/config`)
            .send()
            .then((res) => {
            (0, helpers_2.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("single project mode");
        });
    });
}, auth_1.SingleProjectMode.ERROR);
//# sourceMappingURL=misc.spec.js.map