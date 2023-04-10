"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const jsonwebtoken_1 = require("jsonwebtoken");
const operations_1 = require("../../../emulator/auth/operations");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("email link sign-in", ({ authApi }) => {
    it("should send OOB code to new emails and create account on sign-in", async () => {
        const email = "alice@example.com";
        await (0, helpers_1.createEmailSignInOob)(authApi(), email);
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(1);
        (0, chai_1.expect)(oobs[0].email).to.equal(email);
        (0, chai_1.expect)(oobs[0].requestType).to.equal("EMAIL_SIGNIN");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ oobCode: oobs[0].oobCode, email })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("idToken").that.is.a("string");
            (0, chai_1.expect)(res.body.email).to.equal(email);
            (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.user_id).to.be.a("string");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("password");
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), email)).to.have.members(["emailLink"]);
    });
    it("should sign an existing account in and enable email-link sign-in for them", async () => {
        const user = { email: "bob@example.com", password: "notasecret" };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), user.email);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email: user.email, oobCode })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).to.equal(localId);
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:lookup")
            .query({ key: "fake-api-key" })
            .send({ idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            (0, chai_1.expect)(res.body.users[0]).to.have.property("emailLinkSignin").equal(true);
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), user.email)).to.have.members([
            "password",
            "emailLink",
        ]);
    });
    it("should error on invalid oobCode", async () => {
        const email = "alice@example.com";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email, oobCode: "invalid" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_OOB_CODE");
        });
    });
    it("should error if user is disabled", async () => {
        const { localId, email } = await (0, helpers_1.registerUser)(authApi(), {
            email: "bob@example.com",
            password: "notasecret",
        });
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), email);
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email, oobCode })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("USER_DISABLED");
        });
    });
    it("should error if email mismatches", async () => {
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), "alice@example.com");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email: "NOT-alice@example.com", oobCode })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_EMAIL : The email provided does not match the sign-in email address.");
        });
    });
    it("should link existing account with idToken to new email", async () => {
        const oldEmail = "bob@example.com";
        const newEmail = "alice@example.com";
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: oldEmail,
            password: "notasecret",
        });
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), newEmail);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email: newEmail, oobCode, idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).to.equal(localId);
            (0, chai_1.expect)(res.body.email).to.equal(newEmail);
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), newEmail)).to.have.members(["password", "emailLink"]);
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), oldEmail)).to.be.empty;
    });
    it("should link existing phone-auth account to new email", async () => {
        const { localId, idToken } = await (0, helpers_1.signInWithPhoneNumber)(authApi(), helpers_1.TEST_PHONE_NUMBER);
        const email = "alice@example.com";
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), email);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email, oobCode, idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).to.equal(localId);
            (0, chai_1.expect)(res.body.email).to.equal(email);
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), email)).to.have.members(["emailLink"]);
    });
    it("should error when trying to link an email already used in another account", async () => {
        const { idToken } = await (0, helpers_1.signInWithPhoneNumber)(authApi(), helpers_1.TEST_PHONE_NUMBER);
        const email = "alice@example.com";
        await (0, helpers_1.registerUser)(authApi(), { email, password: "notasecret" });
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), email);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email, oobCode, idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("EMAIL_EXISTS");
        });
    });
    it("should error if user to be linked is disabled", async () => {
        const { email, localId, idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
        });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), email);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email, oobCode, idToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_DISABLED");
        });
    });
    it("should return pending credential if user has MFA", async () => {
        const user = {
            email: "alice@example.com",
            password: "notasecret",
            mfaInfo: [helpers_1.TEST_MFA_INFO],
        };
        const { idToken, email } = await (0, helpers_1.registerUser)(authApi(), user);
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), email);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email, oobCode, idToken })
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
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("PROJECT_DISABLED");
        });
    });
    it("should error if email link sign in is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            enableEmailLinkSignin: false,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("OPERATION_NOT_ALLOWED");
        });
    });
    it("should create account on sign-in with tenantId", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            enableEmailLinkSignin: true,
        });
        const email = "alice@example.com";
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), email, tenant.tenantId);
        const localId = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ oobCode, email, tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.localId;
        });
        const user = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId, tenant.tenantId);
        (0, chai_1.expect)(user.tenantId).to.eql(tenant.tenantId);
    });
    it("should return pending credential if user has MFA and enabled on tenant projects", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            enableEmailLinkSignin: true,
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
        const { idToken, email } = await (0, helpers_1.registerUser)(authApi(), user);
        const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), email, tenant.tenantId);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
            .query({ key: "fake-api-key" })
            .send({ email, oobCode, idToken, tenantId: tenant.tenantId })
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
        it("should update modifiable fields for account creation", async () => {
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
            const email = "alice@example.com";
            await (0, helpers_1.createEmailSignInOob)(authApi(), email);
            const oobs = await (0, helpers_1.inspectOobs)(authApi());
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
                .query({ key: "fake-api-key" })
                .send({ oobCode: oobs[0].oobCode, email })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.have.property("idToken").that.is.a("string");
                (0, chai_1.expect)(res.body.email).to.equal(email);
                (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
            });
        });
        it("should pass user info in the request body to beforeCreate", async () => {
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {
                    triggers: {
                        beforeCreate: {
                            functionUri: helpers_1.BEFORE_CREATE_URL,
                        },
                    },
                },
            }, "blockingFunctions");
            let jwtStr;
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_CREATE_PATH, (parsedBody) => {
                jwtStr = parsedBody.data.jwt;
                return parsedBody;
            })
                .reply(200, {
                userRecord: {
                    updateMask: "displayName",
                    displayName: "Not tested",
                },
            });
            const email = "alice@example.com";
            await (0, helpers_1.createEmailSignInOob)(authApi(), email);
            const oobs = await (0, helpers_1.inspectOobs)(authApi());
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
                .query({ key: "fake-api-key" })
                .send({ oobCode: oobs[0].oobCode, email })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
            });
            (0, chai_1.expect)(jwtStr).not.to.be.undefined;
            const jwt = (0, operations_1.parseBlockingFunctionJwt)(jwtStr);
            (0, chai_1.expect)(jwt).to.have.property("sign_in_method").eql("emailLink");
            (0, chai_1.expect)(jwt.user_record).to.have.property("uid").that.is.a("string");
            (0, chai_1.expect)(jwt.user_record).to.have.property("email").eql(email);
            (0, chai_1.expect)(jwt.user_record).to.have.property("email_verified").to.be.true;
            (0, chai_1.expect)(jwt.user_record).to.have.property("metadata");
            (0, chai_1.expect)(jwt.user_record.metadata).to.have.property("creation_time").that.is.a("string");
        });
        it("should pass user info in the request body to beforeSignIn", async () => {
            await (0, helpers_1.updateConfig)(authApi(), setup_1.PROJECT_ID, {
                blockingFunctions: {
                    triggers: {
                        beforeSignIn: {
                            functionUri: helpers_1.BEFORE_SIGN_IN_URL,
                        },
                    },
                },
            }, "blockingFunctions");
            let jwtStr;
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_SIGN_IN_PATH, (parsedBody) => {
                jwtStr = parsedBody.data.jwt;
                return parsedBody;
            })
                .reply(200, {
                userRecord: {
                    updateMask: "displayName",
                    displayName: "Not tested",
                },
            });
            const email = "alice@example.com";
            await (0, helpers_1.createEmailSignInOob)(authApi(), email);
            const oobs = await (0, helpers_1.inspectOobs)(authApi());
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
                .query({ key: "fake-api-key" })
                .send({ oobCode: oobs[0].oobCode, email })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
            });
            (0, chai_1.expect)(jwtStr).not.to.be.undefined;
            const jwt = (0, operations_1.parseBlockingFunctionJwt)(jwtStr);
            (0, chai_1.expect)(jwt).to.have.property("sign_in_method").eql("emailLink");
            (0, chai_1.expect)(jwt.user_record).to.have.property("uid").that.is.a("string");
            (0, chai_1.expect)(jwt.user_record).to.have.property("email").eql(email);
            (0, chai_1.expect)(jwt.user_record).to.have.property("email_verified").to.be.true;
            (0, chai_1.expect)(jwt.user_record).to.have.property("metadata");
            (0, chai_1.expect)(jwt.user_record.metadata).to.have.property("creation_time").that.is.a("string");
        });
        it("should pass user info in the request body to beforeSignIn and include modifiable fields from beforeCreate", async () => {
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
            let jwtStr;
            nock(helpers_1.BLOCKING_FUNCTION_HOST)
                .post(helpers_1.BEFORE_CREATE_PATH)
                .reply(200, {
                userRecord: {
                    updateMask: "displayName,photoUrl,emailVerified,customClaims",
                    displayName: helpers_1.DISPLAY_NAME,
                    photoUrl: helpers_1.PHOTO_URL,
                    emailVerified: false,
                    customClaims: { customAttribute: "custom" },
                },
            })
                .post(helpers_1.BEFORE_SIGN_IN_PATH, (parsedBody) => {
                jwtStr = parsedBody.data.jwt;
                return parsedBody;
            })
                .reply(200, {
                userRecord: {
                    updateMask: "displayName",
                    displayName: "Not tested",
                },
            });
            const email = "alice@example.com";
            await (0, helpers_1.createEmailSignInOob)(authApi(), email);
            const oobs = await (0, helpers_1.inspectOobs)(authApi());
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
                .query({ key: "fake-api-key" })
                .send({ oobCode: oobs[0].oobCode, email })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
            });
            (0, chai_1.expect)(jwtStr).not.to.be.undefined;
            const jwt = (0, operations_1.parseBlockingFunctionJwt)(jwtStr);
            (0, chai_1.expect)(jwt).to.have.property("sign_in_method").eql("emailLink");
            (0, chai_1.expect)(jwt.user_record).to.have.property("uid").that.is.a("string");
            (0, chai_1.expect)(jwt.user_record).to.have.property("email").eql(email);
            (0, chai_1.expect)(jwt.user_record).to.have.property("email_verified").to.be.false;
            (0, chai_1.expect)(jwt.user_record).to.have.property("display_name").eql(helpers_1.DISPLAY_NAME);
            (0, chai_1.expect)(jwt.user_record).to.have.property("photo_url").eql(helpers_1.PHOTO_URL);
            (0, chai_1.expect)(jwt.user_record).to.have.property("custom_claims").eql({ customAttribute: "custom" });
            (0, chai_1.expect)(jwt.user_record).to.have.property("metadata");
            (0, chai_1.expect)(jwt.user_record.metadata).to.have.property("creation_time").that.is.a("string");
        });
        it("should update modifiable fields before sign in", async () => {
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
            const email = "alice@example.com";
            await (0, helpers_1.createEmailSignInOob)(authApi(), email);
            const oobs = await (0, helpers_1.inspectOobs)(authApi());
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
                .query({ key: "fake-api-key" })
                .send({ oobCode: oobs[0].oobCode, email })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.have.property("idToken").that.is.a("string");
                (0, chai_1.expect)(res.body.email).to.equal(email);
                (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
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
            const email = "alice@example.com";
            await (0, helpers_1.createEmailSignInOob)(authApi(), email);
            const oobs = await (0, helpers_1.inspectOobs)(authApi());
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
                .query({ key: "fake-api-key" })
                .send({ oobCode: oobs[0].oobCode, email })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.have.property("idToken").that.is.a("string");
                (0, chai_1.expect)(res.body.email).to.equal(email);
                (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
                (0, chai_1.expect)(decoded.payload).to.have.property("sessionAttribute").equals("session");
            });
        });
        it("should update modifiable fields before sign in for existing accounts", async () => {
            const user = { email: "bob@example.com", password: "notasecret" };
            const { localId } = await (0, helpers_1.registerUser)(authApi(), user);
            const { oobCode } = await (0, helpers_1.createEmailSignInOob)(authApi(), user.email);
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
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
                .query({ key: "fake-api-key" })
                .send({ email: user.email, oobCode })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.localId).to.equal(localId);
                (0, chai_1.expect)(res.body).to.have.property("idToken").that.is.a("string");
                (0, chai_1.expect)(res.body.email).to.equal(user.email);
                (0, chai_1.expect)(res.body.isNewUser).to.equal(false);
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
                (0, chai_1.expect)(decoded.payload).to.have.property("sessionAttribute").equals("session");
            });
        });
        it("should error after disabling user", async () => {
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
            const email = "alice@example.com";
            await (0, helpers_1.createEmailSignInOob)(authApi(), email);
            const oobs = await (0, helpers_1.inspectOobs)(authApi());
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
                .query({ key: "fake-api-key" })
                .send({ oobCode: oobs[0].oobCode, email })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(400, res);
                (0, chai_1.expect)(res.body.error.message).to.equal("USER_DISABLED");
            });
        });
    });
});
//# sourceMappingURL=emailLink.spec.js.map