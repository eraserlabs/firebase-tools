"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const jsonwebtoken_1 = require("jsonwebtoken");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("phone auth sign-in", ({ authApi }) => {
    it("should return fake recaptcha params", async () => {
        await authApi()
            .get("/identitytoolkit.googleapis.com/v1/recaptchaParams")
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("recaptchaStoken").that.is.a("string");
            (0, chai_1.expect)(res.body).to.have.property("recaptchaSiteKey").that.is.a("string");
        });
    });
    it("should pretend to send a verification code via SMS", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber, recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("sessionInfo").that.is.a("string");
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        (0, chai_1.expect)(codes).to.have.length(1);
        (0, chai_1.expect)(codes[0].phoneNumber).to.equal(phoneNumber);
        (0, chai_1.expect)(codes[0].sessionInfo).to.equal(sessionInfo);
        (0, chai_1.expect)(codes[0].code).to.be.a("string");
    });
    it("should error when phone number is missing when calling sendVerificationCode", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error)
                .to.have.property("message")
                .equals("INVALID_PHONE_NUMBER : Invalid format.");
        });
    });
    it("should error when phone number is invalid", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ recaptchaToken: "ignored", phoneNumber: "invalid" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error)
                .to.have.property("message")
                .equals("INVALID_PHONE_NUMBER : Invalid format.");
        });
    });
    it("should error on sendVerificationCode if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error on sendVerificationCode for tenant projects", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: false });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("UNSUPPORTED_TENANT_OPERATION");
        });
    });
    it("should create new account by verifying phone number", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber, recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        const code = codes[0].code;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo, code })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("isNewUser").equals(true);
            (0, chai_1.expect)(res.body).to.have.property("phoneNumber").equals(phoneNumber);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.user_id).to.be.a("string");
            (0, chai_1.expect)(decoded.payload.phone_number).to.equal(phoneNumber);
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("phone");
            (0, chai_1.expect)(decoded.payload.firebase.identities).to.eql({ phone: [phoneNumber] });
        });
    });
    it("should error when sessionInfo or code is missing for signInWithPhoneNumber", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ code: "123456" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("MISSING_SESSION_INFO");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo: "something-something" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("MISSING_CODE");
        });
    });
    it("should error when sessionInfo or code is invalid", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber, recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        const code = codes[0].code;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo: "totally-invalid", code })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("INVALID_SESSION_INFO");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo, code: code + "1" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("INVALID_CODE");
        });
    });
    it("should error if user is disabled", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const { localId } = await (0, helpers_1.signInWithPhoneNumber)(authApi(), phoneNumber);
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber, recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        const code = codes[0].code;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo, code })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_DISABLED");
        });
    });
    it("should link phone number to existing account by idToken", async () => {
        const { localId, idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber, recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        const code = codes[0].code;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo, code, idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("isNewUser").equals(false);
            (0, chai_1.expect)(res.body).to.have.property("phoneNumber").equals(phoneNumber);
            (0, chai_1.expect)(res.body.localId).to.equal(localId);
        });
    });
    it("should error if user to be linked is disabled", async () => {
        const { localId, idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber, recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        const code = codes[0].code;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo, code, idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_DISABLED");
        });
    });
    it("should error when linking phone number to existing user with MFA", async () => {
        const user = {
            email: "alice@example.com",
            password: "notasecret",
            mfaInfo: [helpers_1.TEST_MFA_INFO],
        };
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber, recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        const code = codes[0].code;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo, code, idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("UNSUPPORTED_FIRST_FACTOR : A phone number cannot be set as a first factor on an SMS based MFA user.");
        });
    });
    it("should error if user has MFA", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        let { idToken, localId } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, {
            emailVerified: true,
            phoneNumber,
        });
        ({ idToken } = await (0, helpers_1.enrollPhoneMfa)(authApi(), idToken, helpers_1.TEST_PHONE_NUMBER_2));
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("UNSUPPORTED_FIRST_FACTOR : A phone number cannot be set as a first factor on an SMS based MFA user.");
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        (0, chai_1.expect)(codes).to.be.empty;
    });
    it("should return temporaryProof if phone number already belongs to another account", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        await (0, helpers_1.signInWithPhoneNumber)(authApi(), phoneNumber);
        const { idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        const sessionInfo = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
            .query({ key: "fake-api-key" })
            .send({ phoneNumber, recaptchaToken: "ignored" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.sessionInfo;
        });
        const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
        const code = codes[0].code;
        const temporaryProof = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ sessionInfo, code, idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body).to.have.property("phoneNumber").equals(phoneNumber);
            (0, chai_1.expect)(res.body.temporaryProof).to.be.a("string");
            return res.body.temporaryProof;
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ idToken, phoneNumber, temporaryProof })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PHONE_NUMBER_EXISTS");
        });
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should error if called on tenant project", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: false });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("UNSUPPORTED_TENANT_OPERATION");
        });
    });
    describe("when blocking functions are present", () => {
        afterEach(() => {
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            nock.cleanAll();
        });
        it("should update modifiable fields for new users", async () => {
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {
                    triggers: {
                        beforeCreate: {
                            functionUri: helpers_1.BEFORE_CREATE_URL,
                        },
                    },
                },
            }, "blockingFunctions");
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_CREATE_PATH)
                .reply(200, {
                userRecord: {
                    updateMask: "displayName,photoUrl,emailVerified,customClaims",
                    displayName: helpers_1.DISPLAY_NAME,
                    photoUrl: helpers_1.PHOTO_URL,
                    emailVerified: true,
                    customClaims: { customAttribute: "custom" },
                },
            });
            const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
            const sessionInfo = await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
                .query({ key: "fake-api-key" })
                .send({ phoneNumber, recaptchaToken: "ignored" })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                return res.body.sessionInfo;
            });
            const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
            const code = codes[0].code;
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
                .query({ key: "fake-api-key" })
                .send({ sessionInfo, code })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.have.property("isNewUser").equals(true);
                (0, chai_1.expect)(res.body).to.have.property("phoneNumber").equals(phoneNumber);
                (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.header.alg).to.eql("none");
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
            });
        });
        it("should update modifiable fields for existing users", async () => {
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
            const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
            const sessionInfo = await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
                .query({ key: "fake-api-key" })
                .send({ phoneNumber, recaptchaToken: "ignored" })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                return res.body.sessionInfo;
            });
            const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
            const code = codes[0].code;
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
                .query({ key: "fake-api-key" })
                .send({ sessionInfo, code })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.have.property("isNewUser").equals(true);
                (0, chai_1.expect)(res.body).to.have.property("phoneNumber").equals(phoneNumber);
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
        it("beforeSignIn fields should overwrite beforeCreate fields", async () => {
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {
                    triggers: {
                        beforeCreate: {
                            functionUri: helpers_1.BEFORE_CREATE_URL,
                        },
                        beforeSignIn: {
                            functionUri: helpers_1.BEFORE_SIGN_IN_URL,
                        },
                    },
                },
            }, "blockingFunctions");
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_CREATE_PATH)
                .reply(200, {
                userRecord: {
                    updateMask: "displayName,photoUrl,emailVerified,customClaims",
                    displayName: "oldDisplayName",
                    photoUrl: "oldPhotoUrl",
                    emailVerified: false,
                    customClaims: { customAttribute: "oldCustom" },
                },
            })
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
            const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
            const sessionInfo = await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
                .query({ key: "fake-api-key" })
                .send({ phoneNumber, recaptchaToken: "ignored" })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                return res.body.sessionInfo;
            });
            const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
            const code = codes[0].code;
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
                .query({ key: "fake-api-key" })
                .send({ sessionInfo, code })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.have.property("isNewUser").equals(true);
                (0, chai_1.expect)(res.body).to.have.property("phoneNumber").equals(phoneNumber);
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
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {
                    triggers: {
                        beforeCreate: {
                            functionUri: helpers_1.BEFORE_CREATE_URL,
                        },
                    },
                },
            }, "blockingFunctions");
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_CREATE_PATH)
                .reply(200, {
                userRecord: {
                    updateMask: "disabled",
                    disabled: true,
                },
            });
            const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
            const sessionInfo = await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
                .query({ key: "fake-api-key" })
                .send({ phoneNumber, recaptchaToken: "ignored" })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                return res.body.sessionInfo;
            });
            const codes = await (0, helpers_1.inspectVerificationCodes)(authApi());
            return authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
                .query({ key: "fake-api-key" })
                .send({ sessionInfo, code: codes[0].code })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(400, res);
                (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_DISABLED");
            });
        });
    });
});
//# sourceMappingURL=phone.spec.js.map