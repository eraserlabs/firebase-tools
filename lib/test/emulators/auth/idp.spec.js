"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const jsonwebtoken_1 = require("jsonwebtoken");
const state_1 = require("../../../emulator/auth/state");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("sign-in with credential", ({ authApi, getClock }) => {
    it("should create new account with IDP from unsigned ID token", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
            (0, chai_1.expect)(res.body.email).to.equal(helpers_1.FAKE_GOOGLE_ACCOUNT.email);
            (0, chai_1.expect)(res.body.emailVerified).to.equal(helpers_1.FAKE_GOOGLE_ACCOUNT.emailVerified);
            (0, chai_1.expect)(res.body.federatedId).to.equal(`https://accounts.google.com/${helpers_1.FAKE_GOOGLE_ACCOUNT.rawId}`);
            (0, chai_1.expect)(res.body.oauthIdToken).to.equal(helpers_1.FAKE_GOOGLE_ACCOUNT.idToken);
            (0, chai_1.expect)(res.body.providerId).to.equal("google.com");
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            (0, chai_1.expect)(res.body).not.to.have.property("displayName");
            (0, chai_1.expect)(res.body).not.to.have.property("photoUrl");
            const raw = JSON.parse(res.body.rawUserInfo);
            (0, chai_1.expect)(raw.id).to.equal(helpers_1.FAKE_GOOGLE_ACCOUNT.rawId);
            (0, chai_1.expect)(raw.email).to.equal(helpers_1.FAKE_GOOGLE_ACCOUNT.email);
            (0, chai_1.expect)(raw.verified_email).to.equal(true);
            (0, chai_1.expect)(raw.locale).to.equal("en");
            (0, chai_1.expect)(raw.granted_scopes.split(" ")).to.have.members([
                "openid",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ]);
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("identities")
                .eql({
                "google.com": [helpers_1.FAKE_GOOGLE_ACCOUNT.rawId],
                email: [helpers_1.FAKE_GOOGLE_ACCOUNT.email],
            });
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("google.com");
        });
    });
    it("should create new account with IDP from production ID token", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${helpers_1.REAL_GOOGLE_ACCOUNT.idToken}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
            (0, chai_1.expect)(res.body.email).to.equal(helpers_1.REAL_GOOGLE_ACCOUNT.email);
            (0, chai_1.expect)(res.body.emailVerified).to.equal(helpers_1.REAL_GOOGLE_ACCOUNT.emailVerified);
            (0, chai_1.expect)(res.body.federatedId).to.equal(`https://accounts.google.com/${helpers_1.REAL_GOOGLE_ACCOUNT.rawId}`);
            (0, chai_1.expect)(res.body.oauthIdToken).to.equal(helpers_1.REAL_GOOGLE_ACCOUNT.idToken);
            (0, chai_1.expect)(res.body.providerId).to.equal("google.com");
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            (0, chai_1.expect)(res.body).not.to.have.property("displayName");
            (0, chai_1.expect)(res.body).not.to.have.property("photoUrl");
            const raw = JSON.parse(res.body.rawUserInfo);
            (0, chai_1.expect)(raw.id).to.equal(helpers_1.REAL_GOOGLE_ACCOUNT.rawId);
            (0, chai_1.expect)(raw.email).to.equal(helpers_1.REAL_GOOGLE_ACCOUNT.email);
            (0, chai_1.expect)(raw.verified_email).to.equal(true);
            (0, chai_1.expect)(raw.locale).to.equal("en");
            (0, chai_1.expect)(raw.granted_scopes.split(" ")).to.have.members([
                "openid",
                "https://www.googleapis.com/auth/userinfo.profile",
                "https://www.googleapis.com/auth/userinfo.email",
            ]);
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("identities")
                .eql({
                "google.com": [helpers_1.REAL_GOOGLE_ACCOUNT.rawId],
                email: [helpers_1.REAL_GOOGLE_ACCOUNT.email],
            });
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("google.com");
        });
    });
    it("should create new account with IDP from unencoded JSON claims", async () => {
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            name: "Ada Lovelace",
            given_name: "Ada",
            family_name: "Lovelace",
            picture: "http://localhost/fake-picture-url.png",
        });
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
            (0, chai_1.expect)(res.body.federatedId).to.equal(`https://accounts.google.com/${claims.sub}`);
            (0, chai_1.expect)(res.body.oauthIdToken).to.equal(fakeIdToken);
            (0, chai_1.expect)(res.body.providerId).to.equal("google.com");
            (0, chai_1.expect)(res.body.displayName).to.equal(claims.name);
            (0, chai_1.expect)(res.body.fullName).to.equal(claims.name);
            (0, chai_1.expect)(res.body.firstName).to.equal(claims.given_name);
            (0, chai_1.expect)(res.body.lastName).to.equal(claims.family_name);
            (0, chai_1.expect)(res.body.photoUrl).to.equal(claims.picture);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const raw = JSON.parse(res.body.rawUserInfo);
            (0, chai_1.expect)(raw.id).to.equal(claims.sub);
            (0, chai_1.expect)(raw.name).to.equal(claims.name);
            (0, chai_1.expect)(raw.given_name).to.equal(claims.given_name);
            (0, chai_1.expect)(raw.family_name).to.equal(claims.family_name);
            (0, chai_1.expect)(raw.picture).to.equal(claims.picture);
            (0, chai_1.expect)(raw.granted_scopes.split(" ")).not.to.contain("https://www.googleapis.com/auth/userinfo.email");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("identities")
                .eql({
                "google.com": [claims.sub],
            });
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("google.com");
        });
    });
    it("should accept params (e.g. providerId, id_token) in requestUri", async () => {
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
        });
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            requestUri: `http://localhost?providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.providerId).to.equal("google.com");
        });
    });
    it("should copy attributes to user on IDP sign-up", async () => {
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            screen_name: "turingcomplete",
            name: "Alan Turing",
            picture: "http://localhost/turing.png",
        });
        const { idToken } = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", claims);
        const user = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(user.photoUrl).equal(claims.picture);
        (0, chai_1.expect)(user.displayName).equal(claims.name);
        (0, chai_1.expect)(user.screenName).equal(claims.screen_name);
    });
    it("should allow duplicate emails if set in project config", async () => {
        await (0, helpers_1.updateProjectConfig)(authApi(), { signIn: { allowDuplicateEmails: true } });
        const email = "alice@example.com";
        const user1 = await (0, helpers_1.registerUser)(authApi(), { email, password: "notasecret" });
        const user2 = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub: "123456789012345678901",
            email,
        });
        (0, chai_1.expect)(user2.localId).not.to.equal(user1.localId);
    });
    it("should sign-up new users without copying email when allowing duplicate emails", async () => {
        await (0, helpers_1.updateProjectConfig)(authApi(), { signIn: { allowDuplicateEmails: true } });
        const email = "alice@example.com";
        const user1 = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub: "123456789012345678901",
            email,
        });
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), user1.idToken);
        (0, chai_1.expect)(info.email).to.be.undefined;
    });
    it("should allow multiple providers with same email when allowing duplicate emails", async () => {
        await (0, helpers_1.updateProjectConfig)(authApi(), { signIn: { allowDuplicateEmails: true } });
        const email = "alice@example.com";
        const user1 = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub: "123456789012345678901",
            email,
        });
        const user2 = await (0, helpers_1.signInWithFakeClaims)(authApi(), "facebook.com", {
            sub: "123456789012345678901",
            email,
        });
        (0, chai_1.expect)(user2.localId).not.to.equal(user1.localId);
    });
    it("should sign in existing account if (providerId, sub) is the same", async () => {
        const user1 = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub: "123456789012345678901",
        });
        const user2 = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub: "123456789012345678901",
        });
        (0, chai_1.expect)(user2.localId).to.equal(user1.localId);
        const user3 = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub: "000000000000000000000",
        });
        (0, chai_1.expect)(user3.localId).not.to.equal(user1.localId);
        const user4 = await (0, helpers_1.signInWithFakeClaims)(authApi(), "apple.com", {
            sub: "123456789012345678901",
        });
        (0, chai_1.expect)(user4.localId).not.to.equal(user1.localId);
    });
    it("should error if user is disabled", async () => {
        const user = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub: "123456789012345678901",
        });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), user.localId, { disableUser: true });
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            name: "Foo",
        });
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken: user.idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("USER_DISABLED");
        });
    });
    it("should add IDP as a sign-in method for email if available", async () => {
        const email = "foo@example.com";
        const sub = "123456789012345678901";
        await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub,
            email,
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), email)).to.eql(["google.com"]);
        const newEmail = "bar@example.com";
        const { idToken } = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub,
            email: newEmail,
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), newEmail)).to.eql(["google.com"]);
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.email).to.equal(email);
    });
    it("should unlink password and overwite profile attributes if user had unverified email", async () => {
        const { localId, email } = await (0, helpers_1.registerUser)(authApi(), {
            email: "foo@example.com",
            password: "notasecret",
            displayName: "Foo",
        });
        const providerId = "google.com";
        const photoUrl = "http://localhost/photo-from-idp.png";
        const idpSignIn = await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId, {
            sub: "123456789012345678901",
            email,
            email_verified: true,
            picture: photoUrl,
        });
        (0, chai_1.expect)(idpSignIn.localId).to.equal(localId);
        const signInMethods = await (0, helpers_1.getSigninMethods)(authApi(), email);
        (0, chai_1.expect)(signInMethods).to.eql([providerId]);
        (0, chai_1.expect)(signInMethods).not.to.contain([state_1.PROVIDER_PASSWORD]);
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idpSignIn.idToken);
        (0, chai_1.expect)(info.emailVerified).to.be.true;
        (0, chai_1.expect)(info.photoUrl).to.equal(photoUrl);
        (0, chai_1.expect)(info.displayName).to.be.undefined;
    });
    it("should not unlink password if email was already verified", async () => {
        const user = {
            email: "foo@example.com",
            password: "notasecret",
            displayName: "Foo",
        };
        const { localId, email } = await (0, helpers_1.registerUser)(authApi(), user);
        await (0, helpers_1.signInWithEmailLink)(authApi(), email);
        const providerId = "google.com";
        const photoUrl = "http://localhost/photo-from-idp.png";
        const idpSignIn = await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId, {
            sub: "123456789012345678901",
            email,
            email_verified: true,
            picture: photoUrl,
        });
        (0, chai_1.expect)(idpSignIn.localId).to.equal(localId);
        const signInMethods = await (0, helpers_1.getSigninMethods)(authApi(), email);
        (0, chai_1.expect)(signInMethods).to.have.members([
            providerId,
            state_1.PROVIDER_PASSWORD,
            state_1.SIGNIN_METHOD_EMAIL_LINK,
        ]);
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idpSignIn.idToken);
        (0, chai_1.expect)(info.emailVerified).to.be.true;
        (0, chai_1.expect)(info.photoUrl).to.equal(photoUrl);
        (0, chai_1.expect)(info.displayName).to.be.undefined;
    });
    it("should return needConfirmation if both account and IDP has unverified email", async () => {
        const email = "bar@example.com";
        const providerId1 = "facebook.com";
        const originalDisplayName = "Bar";
        const { localId, idToken } = await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId1, {
            sub: "123456789012345678901",
            email,
            email_verified: false,
            name: originalDisplayName,
        });
        const providerId2 = "google.com";
        const fakeIdToken = JSON.stringify((0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            email,
            email_verified: false,
            name: "Foo",
            picture: "http://localhost/photo-from-idp.png",
        }));
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            requestUri: `http://localhost?providerId=${providerId2}&id_token=${encodeURIComponent(fakeIdToken)}`,
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.needConfirmation).to.equal(true);
            (0, chai_1.expect)(res.body.localId).to.equal(localId);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body.verifiedProvider).to.eql([providerId1]);
        });
        const signInMethods = await (0, helpers_1.getSigninMethods)(authApi(), email);
        (0, chai_1.expect)(signInMethods).to.have.members([providerId1]);
        (0, chai_1.expect)(signInMethods).not.to.include([providerId2]);
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.emailVerified).to.be.false;
        (0, chai_1.expect)(info.displayName).to.equal(originalDisplayName);
        (0, chai_1.expect)(info.photoUrl).to.be.undefined;
    });
    it("should error when requestUri is missing or invalid", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("MISSING_REQUEST_URI");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
            requestUri: "notAnAbsoluteUriAndThusInvalid",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("INVALID_REQUEST_URI");
        });
    });
    it("should error when missing providerId is missing", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
            requestUri: "http://localhost",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("INVALID_CREDENTIAL_OR_PROVIDER_ID : Invalid IdP response/credential:");
        });
    });
    it("should error when sub is missing or not a string", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${JSON.stringify({})}`,
            requestUri: "http://localhost",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("INVALID_IDP_RESPONSE");
        });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${JSON.stringify({ sub: 12345 })}`,
            requestUri: "http://localhost",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.contain("INVALID_IDP_RESPONSE");
        });
    });
    it("should link IDP to existing account by idToken", async () => {
        const user = await (0, helpers_1.registerUser)(authApi(), {
            email: "foo@example.com",
            password: "notasecret",
        });
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            name: "Foo",
        });
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken: user.idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(!!res.body.isNewUser).to.equal(false);
            (0, chai_1.expect)(res.body.localId).to.equal(user.localId);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("identities")
                .eql({
                "google.com": [claims.sub],
                email: [user.email],
            });
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("google.com");
        });
        const signInMethods = await (0, helpers_1.getSigninMethods)(authApi(), user.email);
        (0, chai_1.expect)(signInMethods).to.have.members(["google.com", state_1.PROVIDER_PASSWORD]);
    });
    it("should copy IDP email to user-level email if not present", async () => {
        const user = await (0, helpers_1.signInWithPhoneNumber)(authApi(), helpers_1.TEST_PHONE_NUMBER);
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            name: "Foo",
            email: "example@google.com",
        });
        const fakeIdToken = JSON.stringify(claims);
        const idToken = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken: user.idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(!!res.body.isNewUser).to.equal(false);
            (0, chai_1.expect)(res.body.localId).to.equal(user.localId);
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("identities")
                .eql({
                "google.com": [claims.sub],
                email: [claims.email],
                phone: [helpers_1.TEST_PHONE_NUMBER],
            });
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("google.com");
            return res.body.idToken;
        });
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), idToken);
        (0, chai_1.expect)(info.email).to.be.equal(claims.email);
        (0, chai_1.expect)(!!info.emailVerified).to.be.equal(!!claims.email_verified);
    });
    it("should error if user to be linked is disabled", async () => {
        const user = await (0, helpers_1.registerUser)(authApi(), {
            email: "foo@example.com",
            password: "notasecret",
        });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), user.localId, { disableUser: true });
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            name: "Foo",
        });
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken: user.idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("USER_DISABLED");
        });
    });
    it("should return pending credential for MFA-enabled user", async () => {
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            name: "Foo",
            email: "foo@example.com",
            email_verified: true,
        });
        const { idToken, localId } = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", claims);
        await (0, helpers_1.enrollPhoneMfa)(authApi(), idToken, helpers_1.TEST_PHONE_NUMBER);
        const beforeSignIn = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId);
        getClock().tick(3333);
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
            const mfaPendingCredential = res.body.mfaPendingCredential;
            (0, chai_1.expect)(mfaPendingCredential).to.be.a("string");
            (0, chai_1.expect)(res.body.mfaInfo).to.be.an("array").with.lengthOf(1);
        });
        const afterFirstFactor = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId);
        (0, chai_1.expect)(afterFirstFactor.lastLoginAt).to.equal(beforeSignIn.lastLoginAt);
        (0, chai_1.expect)(afterFirstFactor.lastRefreshAt).to.equal(beforeSignIn.lastRefreshAt);
    });
    it("should link IDP for existing MFA-enabled user", async () => {
        const email = "alice@example.com";
        const { idToken, localId } = await (0, helpers_1.signInWithEmailLink)(authApi(), email);
        await (0, helpers_1.enrollPhoneMfa)(authApi(), idToken, helpers_1.TEST_PHONE_NUMBER);
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            name: "Foo",
            email,
            email_verified: true,
        });
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
            const mfaPendingCredential = res.body.mfaPendingCredential;
            (0, chai_1.expect)(mfaPendingCredential).to.be.a("string");
            (0, chai_1.expect)(res.body.mfaInfo).to.be.an("array").with.lengthOf(1);
        });
        (0, chai_1.expect)(await (0, helpers_1.getSigninMethods)(authApi(), email)).to.have.members(["google.com", "emailLink"]);
        const info = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId);
        (0, chai_1.expect)(info.displayName).to.equal(claims.name);
    });
    it("should return error if IDP account is already linked to the same user", async () => {
        const providerId = "google.com";
        const claims = {
            sub: "123456789012345678901",
            email: "alice@example.com",
            email_verified: false,
        };
        const { idToken } = await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId, claims);
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).to.be.undefined;
            (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
            (0, chai_1.expect)(res.body.errorMessage).to.equal("FEDERATED_USER_ID_ALREADY_LINKED");
            (0, chai_1.expect)(res.body.oauthIdToken).to.equal(fakeIdToken);
        });
    });
    it("should return error if IDP account is already linked to another user", async () => {
        const providerId = "google.com";
        const claims = {
            sub: "123456789012345678901",
            email: "alice@example.com",
            email_verified: false,
        };
        await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId, claims);
        const user = await (0, helpers_1.registerUser)(authApi(), {
            email: "foo@example.com",
            password: "notasecret",
        });
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken: user.idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("FEDERATED_USER_ID_ALREADY_LINKED");
        });
        const signInMethods1 = await (0, helpers_1.getSigninMethods)(authApi(), user.email);
        (0, chai_1.expect)(signInMethods1).to.have.members([state_1.PROVIDER_PASSWORD]);
        const signInMethods2 = await (0, helpers_1.getSigninMethods)(authApi(), claims.email);
        (0, chai_1.expect)(signInMethods2).to.have.members([providerId]);
    });
    it("should return error if IDP account email already exists if NOT allowDuplicateEmail", async () => {
        const email = "alice@example.com";
        await (0, helpers_1.registerUser)(authApi(), { email, password: "notasecret" });
        const { idToken } = await (0, helpers_1.registerAnonUser)(authApi());
        const fakeIdToken = JSON.stringify((0, helpers_1.fakeClaims)({
            sub: "12345",
            email,
        }));
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("EMAIL_EXISTS");
        });
    });
    it("should allow linking IDP account with same email to same user", async () => {
        const email = "alice@example.com";
        const { idToken, localId } = await (0, helpers_1.registerUser)(authApi(), { email, password: "notasecret" });
        const fakeIdToken = JSON.stringify((0, helpers_1.fakeClaims)({
            sub: "12345",
            email,
            email_verified: true,
        }));
        const newIdToken = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).to.equal(localId);
            return res.body.idToken;
        });
        const info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), newIdToken);
        (0, chai_1.expect)(info.emailVerified).to.be.true;
    });
    it("should allow linking IDP account with same email if allowDuplicateEmail", async () => {
        const email = "alice@example.com";
        await (0, helpers_1.registerUser)(authApi(), { email, password: "notasecret" });
        await (0, helpers_1.updateProjectConfig)(authApi(), { signIn: { allowDuplicateEmails: true } });
        const { idToken, localId } = await (0, helpers_1.registerAnonUser)(authApi());
        const fakeIdToken = JSON.stringify((0, helpers_1.fakeClaims)({
            sub: "12345",
            email,
        }));
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            idToken,
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.localId).to.equal(localId);
        });
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("PROJECT_DISABLED");
        });
    });
    it("should create a new account with tenantId", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, { disableAuth: false });
        const localId = await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
            tenantId: tenant.tenantId,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.tenantId).to.eql(tenant.tenantId);
            return res.body.localId;
        });
        const user = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId, tenant.tenantId);
        (0, chai_1.expect)(user.tenantId).to.eql(tenant.tenantId);
    });
    it("should return pending credential for MFA-enabled user and enabled on tenant project", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            mfaConfig: {
                state: "ENABLED",
                enabledProviders: ["PHONE_SMS"],
            },
        });
        const claims = (0, helpers_1.fakeClaims)({
            sub: "123456789012345678901",
            name: "Foo",
            email: "foo@example.com",
            email_verified: true,
        });
        const { idToken, localId } = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", claims, tenant.tenantId);
        await (0, helpers_1.enrollPhoneMfa)(authApi(), idToken, helpers_1.TEST_PHONE_NUMBER, tenant.tenantId);
        const beforeSignIn = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId, tenant.tenantId);
        getClock().tick(3333);
        const fakeIdToken = JSON.stringify(claims);
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            tenantId: tenant.tenantId,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("idToken");
            (0, chai_1.expect)(res.body).not.to.have.property("refreshToken");
            const mfaPendingCredential = res.body.mfaPendingCredential;
            (0, chai_1.expect)(mfaPendingCredential).to.be.a("string");
            (0, chai_1.expect)(res.body.mfaInfo).to.be.an("array").with.lengthOf(1);
        });
        const afterFirstFactor = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), localId, tenant.tenantId);
        (0, chai_1.expect)(afterFirstFactor.lastLoginAt).to.equal(beforeSignIn.lastLoginAt);
        (0, chai_1.expect)(afterFirstFactor.lastRefreshAt).to.equal(beforeSignIn.lastRefreshAt);
    });
    it("should error if SAMLResponse is missing assertion", async () => {
        const samlResponse = {};
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=saml.saml&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}&SAMLResponse=${JSON.stringify(samlResponse)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("INVALID_IDP_RESPONSE");
        });
    });
    it("should error if SAMLResponse is missing assertion.subject", async () => {
        const samlResponse = { assertion: {} };
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=saml.saml&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}&SAMLResponse=${JSON.stringify(samlResponse)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("INVALID_IDP_RESPONSE");
        });
    });
    it("should error if SAMLResponse is missing assertion.subject.nameId", async () => {
        const samlResponse = { assertion: { subject: {} } };
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=saml.saml&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}&SAMLResponse=${JSON.stringify(samlResponse)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.include("INVALID_IDP_RESPONSE");
        });
    });
    it("should create an account for generic SAML providers", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=saml.saml&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
            (0, chai_1.expect)(res.body.email).to.equal(helpers_1.FAKE_GOOGLE_ACCOUNT.email);
            (0, chai_1.expect)(res.body.emailVerified).to.equal(true);
            (0, chai_1.expect)(res.body.federatedId).to.equal(helpers_1.FAKE_GOOGLE_ACCOUNT.rawId);
            (0, chai_1.expect)(res.body.oauthIdToken).to.equal(helpers_1.FAKE_GOOGLE_ACCOUNT.idToken);
            (0, chai_1.expect)(res.body.providerId).to.equal("saml.saml");
            (0, chai_1.expect)(res.body).to.have.property("refreshToken").that.is.a("string");
            (0, chai_1.expect)(res.body).not.to.have.property("displayName");
            (0, chai_1.expect)(res.body).not.to.have.property("photoUrl");
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
            (0, chai_1.expect)(decoded.header.alg).to.eql("none");
            (0, chai_1.expect)(decoded.payload).not.to.have.property("provider_id");
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("identities")
                .eql({
                "saml.saml": [helpers_1.FAKE_GOOGLE_ACCOUNT.rawId],
                email: [helpers_1.FAKE_GOOGLE_ACCOUNT.email],
            });
            (0, chai_1.expect)(decoded.payload.firebase).to.have.property("sign_in_provider").equals("saml.saml");
        });
    });
    it("should include fields in SAMLResponse for SAML providers", async () => {
        const otherEmail = "otherEmail@gmail.com";
        const attributeStatements = {
            name: "Jane Doe",
            mail: "otherOtherEmail@gmail.com",
        };
        const samlResponse = { assertion: { subject: { nameId: otherEmail }, attributeStatements } };
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
            .query({ key: "fake-api-key" })
            .send({
            postBody: `providerId=saml.saml&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}&SAMLResponse=${JSON.stringify(samlResponse)}`,
            requestUri: "http://localhost",
            returnIdpCredential: true,
            returnSecureToken: true,
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.email).to.equal(otherEmail);
            const rawUserInfo = JSON.parse(res.body.rawUserInfo);
            (0, chai_1.expect)(rawUserInfo).to.eql(attributeStatements);
            const idToken = res.body.idToken;
            const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
            (0, chai_1.expect)(decoded.payload.firebase)
                .to.have.property("sign_in_attributes")
                .eql(attributeStatements);
        });
    });
    describe("when blocking functions are present", () => {
        afterEach(() => {
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            nock.cleanAll();
        });
        it("should update modifiable fields for new users for beforeCreate", async () => {
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
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
                .query({ key: "fake-api-key" })
                .send({
                postBody: `providerId=google.com&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
                requestUri: "http://localhost",
                returnIdpCredential: true,
                returnSecureToken: true,
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.header.alg).to.eql("none");
                (0, chai_1.expect)(decoded.payload.firebase)
                    .to.have.property("identities")
                    .eql({
                    "google.com": [helpers_1.FAKE_GOOGLE_ACCOUNT.rawId],
                    email: [helpers_1.FAKE_GOOGLE_ACCOUNT.email],
                });
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
            });
        });
        it("should update modifiable fields for new users for beforeSignIn", async () => {
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
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
                .query({ key: "fake-api-key" })
                .send({
                postBody: `providerId=google.com&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
                requestUri: "http://localhost",
                returnIdpCredential: true,
                returnSecureToken: true,
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.header.alg).to.eql("none");
                (0, chai_1.expect)(decoded.payload.firebase)
                    .to.have.property("identities")
                    .eql({
                    "google.com": [helpers_1.FAKE_GOOGLE_ACCOUNT.rawId],
                    email: [helpers_1.FAKE_GOOGLE_ACCOUNT.email],
                });
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
                (0, chai_1.expect)(decoded.payload).to.have.property("sessionAttribute").equals("session");
            });
        });
        it("beforeSignIn fields should overwrite beforeCreate fields for new users", async () => {
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
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
                .query({ key: "fake-api-key" })
                .send({
                postBody: `providerId=google.com&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
                requestUri: "http://localhost",
                returnIdpCredential: true,
                returnSecureToken: true,
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.isNewUser).to.equal(true);
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.header.alg).to.eql("none");
                (0, chai_1.expect)(decoded.payload.firebase)
                    .to.have.property("identities")
                    .eql({
                    "google.com": [helpers_1.FAKE_GOOGLE_ACCOUNT.rawId],
                    email: [helpers_1.FAKE_GOOGLE_ACCOUNT.email],
                });
                (0, chai_1.expect)(decoded.payload.name).to.equal(helpers_1.DISPLAY_NAME);
                (0, chai_1.expect)(decoded.payload.picture).to.equal(helpers_1.PHOTO_URL);
                (0, chai_1.expect)(decoded.payload.email_verified).to.be.true;
                (0, chai_1.expect)(decoded.payload).to.have.property("customAttribute").equals("custom");
                (0, chai_1.expect)(decoded.payload).to.have.property("sessionAttribute").equals("session");
            });
        });
        it("should update modifiable fields for existing users", async () => {
            const user = await (0, helpers_1.registerUser)(authApi(), {
                email: "foo@example.com",
                password: "notasecret",
            });
            const claims = (0, helpers_1.fakeClaims)({
                sub: "123456789012345678901",
                name: "Foo",
            });
            const fakeIdToken = JSON.stringify(claims);
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
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
                .query({ key: "fake-api-key" })
                .send({
                idToken: user.idToken,
                postBody: `providerId=google.com&id_token=${encodeURIComponent(fakeIdToken)}`,
                requestUri: "http://localhost",
                returnIdpCredential: true,
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(!!res.body.isNewUser).to.equal(false);
                const idToken = res.body.idToken;
                const decoded = (0, jsonwebtoken_1.decode)(idToken, { complete: true });
                (0, chai_1.expect)(decoded, "JWT returned by emulator is invalid").not.to.be.null;
                (0, chai_1.expect)(decoded.header.alg).to.eql("none");
                (0, chai_1.expect)(decoded.payload.firebase)
                    .to.have.property("identities")
                    .eql({
                    "google.com": [claims.sub],
                    email: [user.email],
                });
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
            await authApi()
                .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
                .query({ key: "fake-api-key" })
                .send({
                postBody: `providerId=google.com&id_token=${helpers_1.FAKE_GOOGLE_ACCOUNT.idToken}`,
                requestUri: "http://localhost",
                returnIdpCredential: true,
                returnSecureToken: true,
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(400, res);
                (0, chai_1.expect)(res.body.error.message).to.equal("USER_DISABLED");
            });
        });
    });
});
//# sourceMappingURL=idp.spec.js.map