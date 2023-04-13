"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const jsonwebtoken_1 = require("jsonwebtoken");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("accounts:signInWithPassword", ({ authApi, getClock }) => {
    it("should issue tokens when email and password are valid", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { localId } = await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: user.email, password: user.password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).equals(localId);
            (0, chai_1.expect)(res.body.email).equals(user.email);
            (0, chai_1.expect)(res.body).to.have.property("registered").equals(true);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.user_id).to.equal(localId);
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("password");
        });
    });
    it("should update lastLoginAt on successful login", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { localId } = await (0, helpers_1.registerUser)(authApi(), user);
        const beforeLogin = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId);
        (0, chai_1.expect)(beforeLogin.lastLoginAt).to.equal(Date.now().toString());
        getClock().tick(4000);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: user.email, password: user.password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
        });
        const afterLogin = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId);
        (0, chai_1.expect)(afterLogin.lastLoginAt).to.equal(Date.now().toString());
    });
    it("should validate email address ignoring case", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { localId } = await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: "AlIcE@exAMPle.COM", password: user.password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).equals(localId);
        });
    });
    it("should error if email or password is missing", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ password: "notasecret" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).equals("MISSING_EMAIL");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: "nosuchuser@example.com" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).equals("MISSING_PASSWORD");
        });
    });
    it("should error if email is invalid", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: "ill-formatted-email", password: "notasecret" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).equals("INVALID_EMAIL");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: "", password: "notasecret" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).equals("INVALID_EMAIL");
        });
    });
    it("should error if email is not found", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: "nosuchuser@example.com", password: "notasecret" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).equals("EMAIL_NOT_FOUND");
        });
    });
    it("should error if password is wrong", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: user.email, password: "NOTASECRET" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).equals("INVALID_PASSWORD");
        });
    });
    it("should error if user is disabled", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { localId } = await (0, helpers_1.registerUser)(authApi(), user);
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: user.email, password: "notasecret" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("USER_DISABLED");
        });
    });
    it("should return pending credential if user has MFA", async () => {
        const user = {
            email: "alice@example.com",
            password: "notasecret",
            mfaInfo: [helpers_1.TEST_MFA_INFO],
        };
        await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: user.email, password: user.password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
            (0, chai_1.expect)(res.body.mfaPendingCredential).to.be.a("string");
            (0, chai_1.expect)(res.body.mfaInfo).to.be.an("array").with.lengthOf(1);
        });
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("PROJECT_DISABLED");
        });
    });
    it("should error if password sign up is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            allowPasswordSignup: false,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("PASSWORD_LOGIN_DISABLED");
        });
    });
    it("should return pending credential if user has MFA and enabled on tenant projects", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            allowPasswordSignup: true,
            mfaConfig: {
                state: "ENABLED",
            },
        });
        const user = {
            email: "alice@example.com",
            password: "notasecret",
            mfaInfo: [helpers_1.TEST_MFA_INFO],
            tenantId: tenant.tenantId,
        };
        await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId, email: user.email, password: user.password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
            (0, chai_1.expect)(res.body.mfaPendingCredential).to.be.a("string");
            (0, chai_1.expect)(res.body.mfaInfo).to.be.an("array").with.lengthOf(1);
        });
    });
    describe("when blocking functions are present", () => {
        afterEach(() => {
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            nock.cleanAll();
        });
        it("should update modifiable fields before sign in", async () => {
            const user = { email: "alice@example.com", password: "notasecret" };
            const { localId } = await (0, helpers_1.registerUser)(authApi(), user);
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {
                    triggers: {
                        beforeSignIn: {
                            functionUri: helpers_1.BEFORE_SIGN_IN_URL,
                        },
                    },
                },
            }, "blockingFunctions");
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_SIGN_IN_PATH)
                .reply(200, {
                userRecord: {
                    updateMask: "displayName,photoUrl,emailVerified,customClaims,sessionClaims",
                    displayName: helpers_1.DISPLAY_NAME,
                    photoUrl: helpers_1.PHOTO_URL,
                    emailVerified: true,
                    customClaims: { customAttribute: "custom" },
                    sessionClaims: { sessionAttribute: "session" },
                },
            });
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
                .query({ key: "fake-api-key" })
                .send({ email: user.email, password: user.password })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.localId).equals(localId);
                (0, chai_1.expect)(res.body.email).equals(user.email);
                (0, chai_1.expect)(res.body).to.have.property("registered").equals(true);
                (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.header.alg).to.eql("none");
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
                (0, chai_1.expect)(decoded.payload).to.have.property("sessionAttribute").equals("session");
            });
        });
        it("should disable user if set", async () => {
            const user = { email: "alice@example.com", password: "notasecret" };
            await (0, helpers_1.registerUser)(authApi(), user);
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {
                    triggers: {
                        beforeSignIn: {
                            functionUri: helpers_1.BEFORE_SIGN_IN_URL,
                        },
                    },
                },
            }, "blockingFunctions");
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_SIGN_IN_PATH)
                .reply(200, {
                userRecord: {
                    updateMask: "disabled",
                    disabled: true,
                },
            });
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
                .query({ key: "fake-api-key" })
                .send({ email: user.email, password: user.password })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(400, res);
                (0, chai_1.expect)(res.body.error.message).to.equal("USER_DISABLED");
            });
        });
        it("should not trigger blocking function if user has MFA", async () => {
            const user = {
                email: "alice@example.com",
                password: "notasecret",
                mfaInfo: [helpers_1.TEST_MFA_INFO],
            };
            await (0, helpers_1.registerUser)(authApi(), user);
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {
                    triggers: {
                        beforeSignIn: {
                            functionUri: helpers_1.BEFORE_SIGN_IN_URL,
                        },
                    },
                },
            }, "blockingFunctions");
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_SIGN_IN_PATH)
                .reply(200, {
                userRecord: {
                    updateMask: "disabled",
                    disabled: true,
                },
            });
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
                .query({ key: "fake-api-key" })
                .send({ email: user.email, password: user.password })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).not.to.have.property("idToken");
                (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
                (0, chai_1.expect)(res.body.mfaPendingCredential).to.be.a("string");
                (0, chai_1.expect)(res.body.mfaInfo).to.be.an("array").with.lengthOf(1);
            });
            (0, chai_1.expect)(nock.isDone()).to.be.false;
            nock.cleanAll();
        });
    });
});
//# sourceMappingURL=password.spec.js.map