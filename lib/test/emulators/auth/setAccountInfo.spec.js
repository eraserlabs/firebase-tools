"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const jsonwebtoken_1 = require("jsonwebtoken");
const state_1 = require("../../../emulator/auth/state");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("accounts:update", ({ authApi, getClock }) => {
    it("should allow updating and deleting displayName and photoUrl", async () => {
        const { idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        const attrs = { displayName: "Alice", photoUrl: "http://localhost/alice.png" };
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send(Object.assign({ idToken }, attrs))
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.displayName).equals(attrs.displayName);
            (0, chai_1.expect)(res.body.photoUrl).equals(attrs.photoUrl);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, deleteAttribute: ["DISPLAY_NAME", "PHOTO_URL"] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("displayName");
            (0, chai_1.expect)(res.body).not.to.have.property("photoUrl");
        });
    });
    it("should set password and issue new tokens", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const newPassword = "notasecreteither";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, password: newPassword })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.user_id).to.equal(localId);
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("password");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: user.email, password: newPassword })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).equals(localId);
        });
    });
    it("should add password provider to anon user", async () => {
        const { localId, idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        const email = "alice@example.com";
        const password = "notasecreteither";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, email, password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.user_id).to.equal(localId);
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("password");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email, password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).equals(localId);
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), email)).to.eql(["password"]);
    });
    it("should allow adding email without password to anon user", async () => {
        const { localId, idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        const email = "alice@example.com";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, email })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.user_id).to.equal(localId);
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("anonymous");
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), email)).not.to.contain(["password"]);
    });
    it("should allow changing email of an existing user, and send out an oob to reset the email", async () => {
        const oldEmail = "alice@example.com";
        const password = "notasecret";
        const newEmail = "bob@example.com";
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), { email: oldEmail, password });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, email: newEmail })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload.user_id).to.equal(localId);
            (0, chai_1.expect)(decoded.payload.email).to.equal(newEmail);
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("password");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: newEmail, password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).equals(localId);
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .query({ key: "fake-api-key" })
            .send({ email: oldEmail, password })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).equals("EMAIL_NOT_FOUND");
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(1);
        (0, chai_1.expect)(oobs[0].email).to.equal(oldEmail);
        (0, chai_1.expect)(oobs[0].requestType).to.equal("RECOVER_EMAIL");
    });
    it("should disallow setting email to same as an existing user", async () => {
        const user = { email: "bob@example.com", password: "notasecret" };
        await (0, helpers_1.registerUser)(authApi(), user);
        const { idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .send({ idToken, email: user.email })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("EMAIL_EXISTS");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .send({ idToken, email: "BOB@example.com", password: "notasecret" })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("EMAIL_EXISTS");
        });
    });
    it("should set initialEmail for the user, after updating email", async () => {
        const oldEmail = "alice@example.com";
        const password = "notasecret";
        const newEmail = "bob@example.com";
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), { email: oldEmail, password });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, email: newEmail })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(newEmail);
        });
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.initialEmail).to.equal(oldEmail);
    });
    it("should reset email when OOB flow is initiated, after updating user email", async () => {
        const oldEmail = "alice@example.com";
        const password = "notasecret";
        const newEmail = "bob@example.com";
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), { email: oldEmail, password });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, email: newEmail })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(1);
        (0, chai_1.expect)(oobs[0].email).to.equal(oldEmail);
        (0, chai_1.expect)(oobs[0].requestType).to.equal("RECOVER_EMAIL");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ oobCode: oobs[0].oobCode })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(oldEmail);
            (0, chai_1.expect)(res.body.emailVerified).to.equal(true);
        });
        const oobs2 = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs2).to.have.length(0);
    });
    it("should disallow resetting an email if another user exists with the same email", async () => {
        const userBob = { email: "bob@example.com", password: "notasecret" };
        const userOtherBob = { email: "bob@example.com", password: "notasecreteither" };
        const bobNewEmail = "bob_new@example.com";
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), userBob);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .send({ idToken, email: bobNewEmail })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(bobNewEmail);
        });
        await (0, helpers_1.registerUser)(authApi(), userOtherBob);
        const oobs = await (0, helpers_1.inspectOobs)(authApi());
        (0, chai_1.expect)(oobs).to.have.length(1);
        (0, chai_1.expect)(oobs[0].requestType).to.equal("RECOVER_EMAIL");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .send({ oobCode: oobs[0].oobCode })
            .query({ key: "fake-api-key" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("EMAIL_EXISTS");
        });
    });
    it("should not set initial email or send OOB when anon user updates email", async () => {
        const { idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        const email = "alice@example.com";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, email })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(email);
        });
        (0, chai_1.expect)(await (0, helpers_1.inspectOobs)(authApi())).to.have.length(0);
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.initialEmail).to.be.undefined;
    });
    it("should not update email if user is disabled", async () => {
        const user = { email: "bob@example.com", password: "notasecret" };
        const newEmail = "alice@example.com";
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, email: newEmail })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_DISABLED");
        });
    });
    it("should update phoneNumber if specified", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const { localId, idToken } = await (0, helpers_1.signInWithPhoneNumber)(authApi(), phoneNumber);
        const newPhoneNumber = "+15555550123";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, phoneNumber: newPhoneNumber })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.phoneNumber).to.equal(newPhoneNumber);
    });
    it("should noop when setting phoneNumber to the same as before", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        const { localId, idToken } = await (0, helpers_1.signInWithPhoneNumber)(authApi(), phoneNumber);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, phoneNumber })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.phoneNumber).to.equal(phoneNumber);
    });
    it("should disallow setting phone to same as an existing user", async () => {
        const phoneNumber = helpers_1.TEST_PHONE_NUMBER;
        await (0, helpers_1.signInWithPhoneNumber)(authApi(), phoneNumber);
        const { localId } = await (0, helpers_1.registerAnonUser)(authApi());
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, phoneNumber })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PHONE_NUMBER_EXISTS");
        });
    });
    it("should error if phoneNumber is invalid", async () => {
        const { localId } = await (0, helpers_1.registerAnonUser)(authApi());
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, phoneNumber: "555-555-0100" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error)
                .to.have.property("message")
                .equals("INVALID_PHONE_NUMBER : Invalid format.");
        });
    });
    it("should allow creating MFA info", async () => {
        const user = { email: "bob@example.com", password: "notasecret" };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const mfaEnrollmentId = "enrollmentId1";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId }),
                ],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.mfaInfo).to.have.length(1);
        const updated = info.mfaInfo[0];
        (0, chai_1.expect)(updated.displayName).to.eq(helpers_1.TEST_MFA_INFO.displayName);
        (0, chai_1.expect)(updated.phoneInfo).to.eq(helpers_1.TEST_MFA_INFO.phoneInfo);
        (0, chai_1.expect)(updated.mfaEnrollmentId).to.eq(mfaEnrollmentId);
    });
    it("should allow adding a second MFA factor", async () => {
        const user = { email: "bob@example.com", password: "notasecret", mfaInfo: [helpers_1.TEST_MFA_INFO] };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const savedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(savedUserInfo.mfaInfo).to.have.length(1);
        const savedMfaInfo = savedUserInfo.mfaInfo[0];
        const secondMfaFactor = {
            displayName: "Second MFA Factor",
            phoneInfo: helpers_1.TEST_PHONE_NUMBER_2,
            mfaEnrollmentId: "enrollmentId2",
        };
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [savedMfaInfo, secondMfaFactor],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const updatedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(updatedUserInfo.mfaInfo).to.have.length(2);
        for (const updatedMfaFactor of updatedUserInfo.mfaInfo) {
            if (updatedMfaFactor.mfaEnrollmentId === savedMfaInfo.mfaEnrollmentId) {
                (0, chai_1.expect)(updatedMfaFactor).to.include(savedMfaInfo);
            }
            else {
                (0, chai_1.expect)(updatedMfaFactor).to.include(secondMfaFactor);
            }
        }
    });
    it("should allow changing the MFA phone number", async () => {
        const user = { email: "bob@example.com", password: "notasecret", mfaInfo: [helpers_1.TEST_MFA_INFO] };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const savedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(savedUserInfo.mfaInfo).to.have.length(1);
        const savedMfaInfo = savedUserInfo.mfaInfo[0];
        (0, chai_1.expect)(savedMfaInfo === null || savedMfaInfo === void 0 ? void 0 : savedMfaInfo.mfaEnrollmentId).to.be.a("string").and.not.empty;
        savedMfaInfo.displayName = "New Display Name";
        savedMfaInfo.phoneInfo = "+15555550101";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [savedMfaInfo],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const updatedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(updatedUserInfo.mfaInfo).to.have.length(1);
        const updatedMfaInfo = updatedUserInfo.mfaInfo[0];
        (0, chai_1.expect)(updatedMfaInfo === null || updatedMfaInfo === void 0 ? void 0 : updatedMfaInfo.displayName).to.eq("New Display Name");
        (0, chai_1.expect)(updatedMfaInfo === null || updatedMfaInfo === void 0 ? void 0 : updatedMfaInfo.phoneInfo).to.eq("+15555550101");
        (0, chai_1.expect)(updatedMfaInfo === null || updatedMfaInfo === void 0 ? void 0 : updatedMfaInfo.mfaEnrollmentId).to.eq(savedMfaInfo.mfaEnrollmentId);
    });
    it("should allow changing the MFA enrollment ID", async () => {
        const user = { email: "bob@example.com", password: "notasecret", mfaInfo: [helpers_1.TEST_MFA_INFO] };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const savedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(savedUserInfo.mfaInfo).to.have.length(1);
        const savedMfaInfo = savedUserInfo.mfaInfo[0];
        (0, chai_1.expect)(savedMfaInfo.mfaEnrollmentId).to.be.a("string").and.not.empty;
        const newEnrollmentId = "newEnrollmentId";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [Object.assign(Object.assign({}, savedMfaInfo), { mfaEnrollmentId: newEnrollmentId })],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const updatedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(updatedUserInfo.mfaInfo).to.have.length(1);
        const updatedMfaInfo = updatedUserInfo.mfaInfo[0];
        (0, chai_1.expect)(updatedMfaInfo.displayName).to.eq(savedMfaInfo.displayName);
        (0, chai_1.expect)(updatedMfaInfo.phoneInfo).to.eq(savedMfaInfo.phoneInfo);
        (0, chai_1.expect)(updatedMfaInfo.mfaEnrollmentId).not.to.eq(savedMfaInfo.mfaEnrollmentId);
        (0, chai_1.expect)(updatedMfaInfo.mfaEnrollmentId).to.eq(newEnrollmentId);
    });
    it("should overwrite existing MFA info", async () => {
        const user = {
            email: "bob@example.com",
            password: "notasecret",
            mfaInfo: [helpers_1.TEST_MFA_INFO, Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { phoneInfo: helpers_1.TEST_PHONE_NUMBER_3 })],
        };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const savedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(savedUserInfo.mfaInfo).to.have.length(2);
        const oldEnrollmentIds = savedUserInfo.mfaInfo.map((info) => info.mfaEnrollmentId);
        const newMfaInfo = {
            displayName: "New New",
            phoneInfo: helpers_1.TEST_PHONE_NUMBER_3,
            mfaEnrollmentId: "newEnrollmentId",
        };
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [newMfaInfo],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const updatedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(updatedUserInfo.mfaInfo).to.have.length(1);
        const updatedMfaInfo = updatedUserInfo.mfaInfo[0];
        (0, chai_1.expect)(updatedMfaInfo.phoneInfo).to.eq(newMfaInfo.phoneInfo);
        (0, chai_1.expect)(updatedMfaInfo.displayName).to.eq(newMfaInfo.displayName);
        (0, chai_1.expect)(updatedMfaInfo.mfaEnrollmentId).to.eq(newMfaInfo.mfaEnrollmentId);
        (0, chai_1.expect)(oldEnrollmentIds).not.to.include(updatedMfaInfo.mfaEnrollmentId);
    });
    it("should remove MFA info with an empty enrollments array", async () => {
        const user = {
            email: "bob@example.com",
            password: "notasecret",
            mfaInfo: [helpers_1.TEST_MFA_INFO],
        };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const savedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(savedUserInfo.mfaInfo).to.have.length(1);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const updatedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(updatedUserInfo.mfaInfo).to.be.undefined;
    });
    it("should remove MFA info with an undefined enrollments array", async () => {
        const user = {
            email: "bob@example.com",
            password: "notasecret",
            mfaInfo: [helpers_1.TEST_MFA_INFO],
        };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const savedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(savedUserInfo.mfaInfo).to.have.length(1);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: undefined,
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const updatedUserInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(updatedUserInfo.mfaInfo).to.be.undefined;
    });
    it("should error if mfaEnrollmentId is absent", async () => {
        const user = { email: "bob@example.com", password: "notasecret", mfaInfo: [helpers_1.TEST_MFA_INFO] };
        const { localId } = await (0, helpers_1.registerUser)(authApi(), user);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [helpers_1.TEST_MFA_INFO],
            },
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.eq("INVALID_MFA_ENROLLMENT_ID : mfaEnrollmentId must be defined.");
        });
    });
    it("should de-duplicate MFA factors with the same phone number", async () => {
        const user = { email: "bob@example.com", password: "notasecret" };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const mfaEnrollmentId = "enrollmentId1";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId }),
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId }),
                ],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.mfaInfo).to.have.length(1);
        const updated = info.mfaInfo[0];
        (0, chai_1.expect)(updated).to.include(helpers_1.TEST_MFA_INFO);
        (0, chai_1.expect)(updated.mfaEnrollmentId).to.eq(mfaEnrollmentId);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const updatedInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(updatedInfo.mfaInfo).to.be.undefined;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId: "enrollmentId2" }),
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId: "enrollmentId3" }),
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId: "enrollmentId4" }),
                ],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const thirdUpdate = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(thirdUpdate.mfaInfo).to.have.length(1);
        const thirdMfaInfo = thirdUpdate.mfaInfo[0];
        (0, chai_1.expect)(thirdMfaInfo).to.include(helpers_1.TEST_MFA_INFO);
        (0, chai_1.expect)(thirdMfaInfo.mfaEnrollmentId).not.to.eq(mfaEnrollmentId);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId: "enrollmentId5" }),
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId: "enrollmentId6" }),
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId: "enrollmentId7" }),
                    {
                        phoneInfo: helpers_1.TEST_PHONE_NUMBER_2,
                        mfaEnrollmentId: "enrollmentId8",
                    },
                    {
                        phoneInfo: helpers_1.TEST_PHONE_NUMBER_2,
                        mfaEnrollmentId: "enrollmentId9",
                    },
                ],
            },
        })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const fourthUpdate = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(fourthUpdate.mfaInfo).to.have.length(2);
        for (const mfaInfo of fourthUpdate.mfaInfo) {
            if (mfaInfo.phoneInfo === helpers_1.TEST_MFA_INFO.phoneInfo) {
                (0, chai_1.expect)(mfaInfo).to.include(helpers_1.TEST_MFA_INFO);
            }
            else {
                (0, chai_1.expect)(mfaInfo.phoneInfo).to.eq(helpers_1.TEST_PHONE_NUMBER_2);
            }
            (0, chai_1.expect)(mfaInfo.mfaEnrollmentId).to.be.a("string").and.not.empty;
            (0, chai_1.expect)(mfaInfo.mfaEnrollmentId).not.to.eq(mfaEnrollmentId);
        }
    });
    it("should error if MFA Enrollment ID is duplicated for different phone numbers", async () => {
        const { localId } = await (0, helpers_1.registerUser)(authApi(), {
            email: "bob@example.com",
            password: "notasecret",
        });
        const mfaEnrollmentId = "duplicateMfaEnrollmentId ";
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId }),
                    {
                        phoneInfo: helpers_1.TEST_PHONE_NUMBER_2,
                        mfaEnrollmentId,
                    },
                ],
            },
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.eq("DUPLICATE_MFA_ENROLLMENT_ID");
        });
    });
    it("does not require MFA Enrollment ID uniqueness across users", async () => {
        const bobUser = { email: "bob@example.com", password: "notasecret", mfaInfo: [helpers_1.TEST_MFA_INFO] };
        const aliceUser = {
            email: "alice@example.com",
            password: "notasecret",
            mfaInfo: [helpers_1.TEST_MFA_INFO],
        };
        const { localId: bobLocalId, idToken: bobIdToken } = await (0, helpers_1.registerUser)(authApi(), bobUser);
        const bobInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), bobIdToken);
        (0, chai_1.expect)(bobInfo.mfaInfo).to.have.length(1);
        const { idToken: aliceIdToken } = await (0, helpers_1.registerUser)(authApi(), aliceUser);
        const aliceInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), aliceIdToken);
        (0, chai_1.expect)(aliceInfo.mfaInfo).to.have.length(1);
        const aliceEnrollmentId = aliceInfo.mfaInfo[0].mfaEnrollmentId;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId: bobLocalId,
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, bobInfo.mfaInfo[0]), { mfaEnrollmentId: aliceEnrollmentId }),
                ],
            },
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
        });
        const updatedBobInfo = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), bobIdToken);
        (0, chai_1.expect)(updatedBobInfo.mfaInfo[0].mfaEnrollmentId).to.equal(aliceEnrollmentId);
    });
    it("should error if phone number for MFA is invalid", async () => {
        const user = { email: "bob@example.com", password: "notasecret", mfaInfo: [helpers_1.TEST_MFA_INFO] };
        const { localId, idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.mfaInfo).to.have.length(1);
        const mfaInfoForUpdate = Object.assign({}, info.mfaInfo[0]);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, mfaInfoForUpdate), { phoneInfo: undefined }),
                ],
            },
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.eq("INVALID_MFA_PHONE_NUMBER : Invalid format.");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId,
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, mfaInfoForUpdate), { phoneInfo: helpers_1.TEST_INVALID_PHONE_NUMBER }),
                ],
            },
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.eq("INVALID_MFA_PHONE_NUMBER : Invalid format.");
        });
    });
    it("should error if user for MFA update is not found", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId: "anything",
            mfa: {
                enrollments: [
                    Object.assign(Object.assign({}, helpers_1.TEST_MFA_INFO), { mfaEnrollmentId: "anything" }),
                ],
            },
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.eq("USER_NOT_FOUND");
        });
    });
    it("should error if enrollments is not an array or undefined", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({
            localId: "anything",
            mfa: {
                enrollments: null,
            },
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.eq("Invalid JSON payload received. /mfa/enrollments must be array");
        });
    });
    it("should error if user is disabled when updating by idToken", async () => {
        const { localId, idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, displayName: "Foo" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_DISABLED");
        });
    });
    it("should still update user despite user is disabled when authenticated", async () => {
        const { localId } = await (0, helpers_1.registerAnonUser)(authApi());
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: true });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { displayName: "Foo" });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), localId, { disableUser: false });
    });
    it("should invalidate old tokens after updating validSince or password", async () => {
        const user = { email: "alice@example.com", password: "notasecret" };
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), user);
        getClock().tick(2000);
        const idToken2 = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, password: "notasecreteither" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.idToken;
        });
        await (0, helpers_1.expectIdTokenExpired)(authApi(), idToken);
        await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken2);
        getClock().tick(2000);
        const idToken3 = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({
            idToken: idToken2,
            validSince: "0",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            return res.body.idToken;
        });
        await (0, helpers_1.expectIdTokenExpired)(authApi(), idToken);
        await (0, helpers_1.expectIdTokenExpired)(authApi(), idToken2);
        await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken3);
    }).timeout(5000);
    function itShouldDeleteProvider(createUser, providerId) {
        it(`should delete ${providerId} provider from user`, async () => {
            const user = await createUser();
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:update")
                .query({ key: "fake-api-key" })
                .send({ idToken: user.idToken, deleteProvider: [providerId] })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                const providers = (res.body.providerUserInfo || []).map((info) => info.providerId);
                (0, chai_1.expect)(providers).not.to.include(providerId);
            });
            if (user.email) {
                (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), user.email)).not.to.contain(providerId);
                (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), user.email)).not.to.contain("emailLink");
            }
        });
    }
    itShouldDeleteProvider(() => (0, helpers_1.registerUser)(authApi(), { email: "alice@example.com", password: "notasecret" }), state_1.PROVIDER_PASSWORD);
    itShouldDeleteProvider(() => (0, helpers_1.signInWithPhoneNumber)(authApi(), helpers_1.TEST_PHONE_NUMBER), state_1.PROVIDER_PHONE);
    itShouldDeleteProvider(() => (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
        sub: "12345",
        email: "bob@example.com",
    }), "google.com");
    it("should update user by localId when authenticated", async () => {
        const { localId } = await (0, helpers_1.registerUser)(authApi(), {
            email: "foo@example.com",
            password: "barbaz",
        });
        const attrs = {
            phoneNumber: helpers_1.TEST_PHONE_NUMBER,
            displayName: "Alice",
            photoUrl: "http://localhost/alice.png",
        };
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send(Object.assign(Object.assign({ localId }, attrs), { emailVerified: true }))
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.displayName).to.equal(attrs.displayName);
            (0, chai_1.expect)(res.body.photoUrl).to.equal(attrs.photoUrl);
            (0, chai_1.expect)(res.body.emailVerified).to.be.true;
        });
    });
    it("should error if authenticated request does not specify localId", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ emailVerified: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("MISSING_LOCAL_ID");
        });
    });
    it("should update customAttributes and add them to ID Tokens", async () => {
        const { localId, email } = await (0, helpers_1.registerUser)(authApi(), {
            email: "foo@example.com",
            password: "barbaz",
        });
        const attrs = {
            foo: "bar",
            baz: { answer: 42 },
        };
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, customAttributes: JSON.stringify(attrs) })
            .then((res) => (0, helpers_1.expectStatusCode)(200, res));
        const { idToken } = await (0, helpers_1.signInWithEmailLink)(authApi(), email);
        const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
        (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
        (0, chai_1.expect)(decoded.payload).to.have.property("foo").to.eql(attrs.foo);
        (0, chai_1.expect)(decoded.payload).to.have.property("baz").to.eql(attrs.baz);
    });
    it("should error if customAttributes are invalid", async () => {
        const { localId } = await (0, helpers_1.registerUser)(authApi(), {
            email: "foo@example.com",
            password: "barbaz",
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, customAttributes: "{definitely[not]json}" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_CLAIMS");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, customAttributes: "42" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_CLAIMS");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, customAttributes: '["a", "b"]' })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_CLAIMS");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, customAttributes: '{"sub": "12345"}' })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("FORBIDDEN_CLAIM : sub");
        });
        const longString = new Array(999).join("x");
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId, customAttributes: `{"a":"${longString}"}` })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("CLAIMS_TOO_LARGE");
        });
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("PROJECT_DISABLED");
        });
    });
    it("should set tenantId in oobLink", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: { state: "ENABLED" },
            allowPasswordSignup: true,
        });
        const oldEmail = "alice@example.com";
        const password = "notasecret";
        const newEmail = "bob@example.com";
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: oldEmail,
            password,
            tenantId: tenant.tenantId,
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .query({ key: "fake-api-key" })
            .send({ idToken, email: newEmail, tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
        });
        const oobs = await (0, helpers_1.inspectOobs)(authApi(), tenant.tenantId);
        (0, chai_1.expect)(oobs).to.have.length(1);
        (0, chai_1.expect)(oobs[0].email).to.equal(oldEmail);
        (0, chai_1.expect)(oobs[0].requestType).to.equal("RECOVER_EMAIL");
        (0, chai_1.expect)(oobs[0].oobLink).to.include(tenant.tenantId);
    });
});
//# sourceMappingURL=setAccountInfo.spec.js.map