"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const setup_1 = require("./setup");
const jsonwebtoken_1 = require("jsonwebtoken");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("mfa enrollment", ({ authApi, getClock }) => {
    it("should error if account does not have email verified", async () => {
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: "unverified@example.com",
            password: "testing",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ idToken, phoneEnrollmentInfo: { phoneNumber: helpers_1.TEST_PHONE_NUMBER } })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("UNVERIFIED_EMAIL : Need to verify email first before enrolling second factors.");
        });
    });
    it("should allow phone enrollment for an existing account", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const { idToken } = await (0, helpers_1.signInWithEmailLink)(authApi(), "foo@example.com");
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ idToken, phoneEnrollmentInfo: { phoneNumber } })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.phoneSessionInfo.sessionInfo).to.be.a("string");
            return res.body.phoneSessionInfo.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        (0, chai_1.expect)(codes).to.have.length(1);
        (0, chai_1.expect)(codes[0].phoneNumber).to.equal(phoneNumber);
        (0, chai_1.expect)(codes[0].sessionInfo).to.equal(sessionInfo);
        (0, chai_1.expect)(codes[0].code).to.be.a("string");
        const { code } = codes[0];
        const res = await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:finalize")
            .query({ key: "fake-api-key" })
            .send({ idToken, phoneVerificationInfo: { code, sessionInfo } });
        (0, helpers_1.expectStatusCode)(200, res);
        (0, chai_1.expect)(res.body.idToken).to.be.a("string");
        (0, chai_1.expect)(res.body.refreshToken).to.be.a("string");
        const userInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(userInfo.mfaInfo).to.be.an("array").with.lengthOf(1);
        (0, chai_1.expect)(userInfo.mfaInfo[0].phoneInfo).to.equal(phoneNumber);
        const mfaEnrollmentId = userInfo.mfaInfo[0].mfaEnrollmentId;
        const decoded = (0, jsonwebtoken_1.decode)(res.body.idToken, { complete: true });
        (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
        (0, chai_1.expect)(decoded.payload.firebase.sign_in_second_factor).to.equal("phone");
        (0, chai_1.expect)(decoded.payload.firebase.second_factor_identifier).to.equal(mfaEnrollmentId);
    });
    it("should error if phoneEnrollmentInfo is not specified", async () => {
        const { idToken } = await (0, helpers_1.signInWithEmailLink)(authApi(), "foo@example.com");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("INVALID_ARGUMENT");
        });
    });
    it("should error if phoneNumber is invalid", async () => {
        const { idToken } = await (0, helpers_1.signInWithEmailLink)(authApi(), "foo@example.com");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ idToken, phoneEnrollmentInfo: { phoneNumber: "notaphonenumber" } })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("INVALID_PHONE_NUMBER");
        });
    });
    it("should error if phoneNumber is a duplicate", async () => {
        const { idToken } = await (0, helpers_1.signInWithEmailLink)(authApi(), "foo@example.com");
        await (0, helpers_1.enrollPhoneMfa)(authApi(), idToken, helpers_1.TEST_PHONE_NUMBER);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ idToken, phoneEnrollmentInfo: { phoneNumber: helpers_1.TEST_PHONE_NUMBER } })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("SECOND_FACTOR_EXISTS : Phone number already enrolled as second factor for this account.");
        });
    });
    it("should error if sign-in method of idToken is ineligible for MFA", async () => {
        const { idToken, localId } = await (0, helpers_1.signInWithPhoneNumber)(authApi(), helpers_1.TEST_PHONE_NUMBER);
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, {
            email: "bob@example.com",
            emailVerified: true,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ idToken, phoneEnrollmentInfo: { phoneNumber: helpers_1.TEST_PHONE_NUMBER_2 } })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("UNSUPPORTED_FIRST_FACTOR : MFA is not available for the given first factor.");
        });
    });
    it("should error on mfaEnrollment:start if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error on mfaEnrollment:start if MFA is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "DISABLED",
            },
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contains("OPERATION_NOT_ALLOWED");
        });
    });
    it("should error on mfaEnrollment:start if phone SMS is not an enabled provider", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "ENABLED",
                enabledProviders: ["PROVIDER_UNSPECIFIED"],
            },
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contains("OPERATION_NOT_ALLOWED");
        });
    });
    it("should error on mfaEnrollment:finalize if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:finalize")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error on mfaEnrollment:finalize if MFA is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "DISABLED",
            },
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:finalize")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contains("OPERATION_NOT_ALLOWED");
        });
    });
    it("should error on mfaEnrollment:finalize if phone SMS is not an enabled provider", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "ENABLED",
                enabledProviders: ["PROVIDER_UNSPECIFIED"],
            },
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:finalize")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contains("OPERATION_NOT_ALLOWED");
        });
    });
    it("should allow sign-in with pending credential for MFA-enabled user", async () => {
        const email = "foo@example.com";
        const password = "abcdef";
        const { idToken, localId } = await (0, helpers_1.registerUser)(authApi(), { email, password });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { emailVerified: true });
        await (0, helpers_1.enrollPhoneMfa)(authApi(), idToken, helpers_1.TEST_PHONE_NUMBER);
        const beforeSignIn = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId);
        getClock().tick(3333);
        const { mfaPendingCredential, mfaEnrollmentId } = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email, password })
            .then((res) => {
            var _a, _b;
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
            const mfaPendingCredential = res.body.mfaPendingCredential;
            const mfaInfo = res.body.mfaInfo;
            (0, chai_1.expect)(mfaPendingCredential).to.be.a("string");
            (0, chai_1.expect)(mfaInfo).to.be.an("array").with.lengthOf(1);
            (0, chai_1.expect)((_a = mfaInfo[0]) === null || _a === void 0 ? void 0 : _a.phoneInfo).to.equal(helpers_1.TEST_PHONE_NUMBER_OBFUSCATED);
            (0, chai_1.expect)((_b = mfaInfo[0]) === null || _b === void 0 ? void 0 : _b.phoneInfo).not.to.have.property("unobfuscatedPhoneInfo");
            return { mfaPendingCredential, mfaEnrollmentId: mfaInfo[0].mfaEnrollmentId };
        });
        const afterFirstFactor = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId);
        (0, chai_1.expect)(afterFirstFactor.lastLoginAt).to.equal(beforeSignIn.lastLoginAt);
        (0, chai_1.expect)(afterFirstFactor.lastRefreshAt).to.equal(beforeSignIn.lastRefreshAt);
        getClock().tick(4444);
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:start")
            .query({ key: "fake-api-key" })
            .send({
            mfaEnrollmentId,
            mfaPendingCredential,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.phoneResponseInfo.sessionInfo).to.be.a("string");
            return res.body.phoneResponseInfo.sessionInfo;
        });
        const code = (await (0, helpers_1.inspectVerificationCodes)(authApi()))[0].code;
        getClock().tick(5555);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:finalize")
            .query({ key: "fake-api-key" })
            .send({
            mfaPendingCredential,
            phoneVerificationInfo: {
                sessionInfo,
                code: code,
            },
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.idToken).to.be.a("string");
            (0, chai_1.expect)(res.body.refreshToken).to.be.a("string");
            const decoded = (0, jsonwebtoken_1.decode)(res.body.idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.payload.firebase.sign_in_second_factor).to.equal("phone");
            (0, chai_1.expect)(decoded.payload.firebase.second_factor_identifier).to.equal(mfaEnrollmentId);
        });
        const afterMfa = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId);
        (0, chai_1.expect)(afterMfa.lastLoginAt).to.equal(Date.now().toString());
        (0, chai_1.expect)(afterMfa.lastRefreshAt).to.equal(new Date().toISOString());
    });
    it("should error on mfaSignIn:start if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:start")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error on mfaSignIn:start if MFA is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "DISABLED",
            },
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:start")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contains("OPERATION_NOT_ALLOWED");
        });
    });
    it("should error on mfaSignIn:start if phone SMS is not an enabled provider", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "ENABLED",
                enabledProviders: ["PROVIDER_UNSPECIFIED"],
            },
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:start")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contains("OPERATION_NOT_ALLOWED");
        });
    });
    it("should error on mfaSignIn:finalize if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:finalize")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error on mfaSignIn:finalize if MFA is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "DISABLED",
            },
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:finalize")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contains("OPERATION_NOT_ALLOWED");
        });
    });
    it("should error on mfaSignIn:finalize if phone SMS is not an enabled provider", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "ENABLED",
                enabledProviders: ["PROVIDER_UNSPECIFIED"],
            },
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:finalize")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").contains("OPERATION_NOT_ALLOWED");
        });
    });
    it("should allow withdrawing MFA for a user", async () => {
        const { idToken: token1 } = await (0, helpers_1.signInWithEmailLink)(authApi(), "foo@example.com");
        const { idToken } = await (0, helpers_1.enrollPhoneMfa)(authApi(), token1, helpers_1.TEST_PHONE_NUMBER);
        const { mfaInfo } = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(mfaInfo).to.have.lengthOf(1);
        const { mfaEnrollmentId } = mfaInfo[0];
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:withdraw")
            .query({ key: "fake-api-key" })
            .send({ idToken, mfaEnrollmentId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.idToken).to.be.a("string");
            (0, chai_1.expect)(res.body.refreshToken).to.be.a("string");
            const decoded = (0, jsonwebtoken_1.decode)(res.body.idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.payload.firebase).not.to.have.property("sign_in_second_factor");
            (0, chai_1.expect)(decoded.payload.firebase).not.to.have.property("second_factor_identifier");
        });
        const after = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(after.mfaInfo).to.have.lengthOf(0);
    });
    it("should error on mfaEnrollment:withdraw if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:withdraw")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    describe("when blocking functions are present", () => {
        afterEach(async () => {
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {},
            }, "blockingFunctions");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            nock.cleanAll();
        });
        it("mfaSignIn:finalize should update modifiable fields before sign in", async () => {
            const email = "foo@example.com";
            const password = "abcdef";
            const { idToken, localId } = await (0, helpers_1.registerUser)(authApi(), { email, password });
            await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { emailVerified: true });
            await (0, helpers_1.enrollPhoneMfa)(authApi(), idToken, helpers_1.TEST_PHONE_NUMBER);
            getClock().tick(3333);
            const { mfaPendingCredential, mfaEnrollmentId } = await (0, helpers_1.signInWithPassword)(authApi(), email, password, true);
            getClock().tick(4444);
            const sessionInfo = await authApi()
                .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:start")
                .query({ key: "fake-api-key" })
                .send({
                mfaEnrollmentId,
                mfaPendingCredential,
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.phoneResponseInfo.sessionInfo).to.be.a("string");
                return res.body.phoneResponseInfo.sessionInfo;
            });
            const code = (await (0, helpers_1.inspectVerificationCodes)(authApi()))[0].code;
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
            getClock().tick(5555);
            await authApi()
                .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:finalize")
                .query({ key: "fake-api-key" })
                .send({
                mfaPendingCredential,
                phoneVerificationInfo: {
                    sessionInfo,
                    code: code,
                },
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.idToken).to.be.a("string");
                (0, chai_1.expect)(res.body.refreshToken).to.be.a("string");
                const decoded = (0, jsonwebtoken_1.decode)(res.body.idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.payload.firebase.sign_in_second_factor).to.equal("phone");
                (0, chai_1.expect)(decoded.payload.firebase.second_factor_identifier).to.equal(mfaEnrollmentId);
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
                (0, chai_1.expect)(decoded.payload).to.have.property("sessionAttribute").equals("session");
            });
        });
        it("mfaSignIn:finalize should disable user if set", async () => {
            const email = "foo@example.com";
            const password = "abcdef";
            const { idToken, localId } = await (0, helpers_1.registerUser)(authApi(), { email, password });
            await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { emailVerified: true });
            await (0, helpers_1.enrollPhoneMfa)(authApi(), idToken, helpers_1.TEST_PHONE_NUMBER);
            getClock().tick(3333);
            const { mfaPendingCredential, mfaEnrollmentId } = await (0, helpers_1.signInWithPassword)(authApi(), email, password, true);
            getClock().tick(4444);
            const sessionInfo = await authApi()
                .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:start")
                .query({ key: "fake-api-key" })
                .send({
                mfaEnrollmentId,
                mfaPendingCredential,
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.phoneResponseInfo.sessionInfo).to.be.a("string");
                return res.body.phoneResponseInfo.sessionInfo;
            });
            const code = (await (0, helpers_1.inspectVerificationCodes)(authApi()))[0].code;
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
            getClock().tick(5555);
            await authApi()
                .post("/identitytoolkit.googleapis.com/v2/accounts/mfaSignIn:finalize")
                .query({ key: "fake-api-key" })
                .send({
                mfaPendingCredential,
                phoneVerificationInfo: {
                    sessionInfo,
                    code: code,
                },
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(400, res);
                (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_DISABLED");
            });
        });
    });
});
//# sourceMappingURL=mfa.spec.js.map