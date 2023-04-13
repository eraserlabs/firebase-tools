"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const jsonwebtoken_1 = require("jsonwebtoken");
const setup_1 = require("./setup");
const helpers_1 = require("./helpers");
(0, setup_1.describeAuthEmulator)("accounts:batchGet", ({ authApi }) => {
    it("should allow listing all accounts", async () => {
        const user1 = await (0, helpers_1.registerAnonUser)(authApi());
        const user2 = await (0, helpers_1.registerUser)(authApi(), { email: "foo@example.com", password: "foobar" });
        await authApi()
            .get(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchGet`)
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(2);
            (0, chai_1.expect)(res.body.users.map((user) => user.localId)).to.have.members([
                user1.localId,
                user2.localId,
            ]);
            (0, chai_1.expect)(res.body).not.to.have.property("nextPageToken");
        });
    });
    it("should return MFA info", async () => {
        const user1 = await (0, helpers_1.signInWithEmailLink)(authApi(), "test@example.com");
        await (0, helpers_1.enrollPhoneMfa)(authApi(), user1.idToken, helpers_1.TEST_PHONE_NUMBER);
        await authApi()
            .get(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchGet`)
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            const user = res.body.users[0];
            (0, chai_1.expect)(user.mfaInfo[0]).to.contain({
                enrolledAt: "1970-01-01T00:00:00.000Z",
                phoneInfo: helpers_1.TEST_PHONE_NUMBER,
                unobfuscatedPhoneInfo: helpers_1.TEST_PHONE_NUMBER,
            });
        });
    });
    it("should allow listing all accounts using legacy endpoint", async () => {
        const user1 = await (0, helpers_1.registerAnonUser)(authApi());
        const user2 = await (0, helpers_1.registerUser)(authApi(), { email: "foo@example.com", password: "foobar" });
        await authApi()
            .post("/www.googleapis.com/identitytoolkit/v3/relyingparty/downloadAccount")
            .set("Authorization", "Bearer owner")
            .send({ targetProjectId: helpers_1.PROJECT_ID })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(2);
            (0, chai_1.expect)(res.body.users.map((user) => user.localId)).to.have.members([
                user1.localId,
                user2.localId,
            ]);
            (0, chai_1.expect)(res.body).not.to.have.property("nextPageToken");
        });
    });
    it("should allow specifying maxResults and pagination", async () => {
        const user1 = await (0, helpers_1.registerAnonUser)(authApi());
        const user2 = await (0, helpers_1.registerUser)(authApi(), { email: "foo@example.com", password: "foobar" });
        const localIds = [user1.localId, user2.localId].sort();
        const nextPageToken = await authApi()
            .get(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchGet`)
            .query({ maxResults: 1 })
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            (0, chai_1.expect)(res.body.users[0].localId).to.equal(localIds[0]);
            (0, chai_1.expect)(res.body).to.have.property("nextPageToken").which.is.a("string");
            return res.body.nextPageToken;
        });
        await authApi()
            .get(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchGet`)
            .query({ nextPageToken })
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            (0, chai_1.expect)(res.body.users[0].localId).to.equal(localIds[1]);
            (0, chai_1.expect)(res.body).not.to.have.property("nextPageToken");
        });
        await authApi()
            .post("/www.googleapis.com/identitytoolkit/v3/relyingparty/downloadAccount")
            .set("Authorization", "Bearer owner")
            .send({ targetProjectId: helpers_1.PROJECT_ID, nextPageToken })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(1);
            (0, chai_1.expect)(res.body.users[0].localId).to.equal(user1.localId > user2.localId ? user1.localId : user2.localId);
            (0, chai_1.expect)(res.body).not.to.have.property("nextPageToken");
        });
    });
    it("should always return a page token if page is full", async () => {
        const user1 = await (0, helpers_1.registerAnonUser)(authApi());
        const user2 = await (0, helpers_1.registerUser)(authApi(), { email: "foo@example.com", password: "foobar" });
        const localIds = [user1.localId, user2.localId].sort();
        const nextPageToken = await authApi()
            .get(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchGet`)
            .query({ maxResults: 2 })
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users).to.have.length(2);
            (0, chai_1.expect)(res.body.users[0].localId).to.equal(localIds[0]);
            (0, chai_1.expect)(res.body.users[1].localId).to.equal(localIds[1]);
            (0, chai_1.expect)(res.body).to.have.property("nextPageToken").which.is.a("string");
            return res.body.nextPageToken;
        });
        await authApi()
            .get(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchGet`)
            .query({ nextPageToken })
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.users || []).to.have.length(0);
            (0, chai_1.expect)(res.body).not.to.have.property("nextPageToken");
        });
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .get(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/tenants/${tenant.tenantId}/accounts:batchGet`)
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").includes("PROJECT_DISABLED");
        });
    });
});
(0, setup_1.describeAuthEmulator)("accounts:batchCreate", ({ authApi }) => {
    it("should create specified accounts", async () => {
        const user1 = { localId: "foo", email: "foo@example.com", rawPassword: "notasecret" };
        const user2 = {
            localId: "bar",
            phoneNumber: helpers_1.TEST_PHONE_NUMBER,
            customAttributes: '{"hello": "world"}',
        };
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ users: [user1, user2] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
        const user1SignInMethods = await (0, helpers_1.getSigninMethods)(authApi(), user1.email);
        (0, chai_1.expect)(user1SignInMethods).to.eql(["password"]);
        const user2SignIn = await (0, helpers_1.signInWithPhoneNumber)(authApi(), user2.phoneNumber);
        (0, chai_1.expect)(user2SignIn.localId).to.equal(user2.localId);
        (0, chai_1.expect)((0, jsonwebtoken_1.decode)(user2SignIn.idToken)).to.have.property("hello").equal("world");
    });
    it("should create specified accounts via legacy endpoint", async () => {
        const user1 = { localId: "foo", email: "foo@example.com", rawPassword: "notasecret" };
        const user2 = { localId: "bar", phoneNumber: helpers_1.TEST_PHONE_NUMBER };
        await authApi()
            .post("/www.googleapis.com/identitytoolkit/v3/relyingparty/uploadAccount")
            .set("Authorization", "Bearer owner")
            .send({ users: [user1, user2], targetProjectId: helpers_1.PROJECT_ID })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
        const user1SignInMethods = await (0, helpers_1.getSigninMethods)(authApi(), user1.email);
        (0, chai_1.expect)(user1SignInMethods).to.eql(["password"]);
        const user2SignIn = await (0, helpers_1.signInWithPhoneNumber)(authApi(), user2.phoneNumber);
        (0, chai_1.expect)(user2SignIn.localId).to.equal(user2.localId);
    });
    it("should error if users is empty or missing", async () => {
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ users: [] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("MISSING_USER_ACCOUNT");
        });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({})
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("MISSING_USER_ACCOUNT");
        });
    });
    it("should convert emails to lowercase", async () => {
        const user = { localId: "foo", email: "FOO@EXAMPLE.COM", rawPassword: "notasecret" };
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ users: [user] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
        const userInfo = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), user.localId);
        (0, chai_1.expect)(userInfo.email).to.eql(user.email.toLowerCase());
    });
    it("should accept Auth Emulator fake passwordHash from request", async () => {
        const password = "hawaii";
        const salt = "beach";
        const user = {
            localId: "foo",
            email: "FOO@EXAMPLE.COM",
            salt,
            passwordHash: `fakeHash:salt=${salt}:password=${password}`,
        };
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ users: [user] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
        const userInfo = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), user.localId);
        (0, chai_1.expect)(userInfo.passwordHash).to.eql(user.passwordHash);
        (0, chai_1.expect)(userInfo.salt).to.eql(user.salt);
        const userSignIn = await (0, helpers_1.signInWithPassword)(authApi(), user.email, password);
        (0, chai_1.expect)(userSignIn.localId).to.equal(user.localId);
    });
    it.skip("should reject production passwordHash", async () => {
        const user = {
            localId: "foo",
            email: "FOO@EXAMPLE.COM",
            passwordHash: "T8cY66FE7V0ejwZqdYH6OgQO8ZiMwqQ2XW-wgUUDf3LNfNPz1Uu6vlwak8GzSd295SmtuQV54qDdidSKYLx7Cg==",
            salt: "nteWfb8brZ0NIA==",
        };
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ users: [user] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
    });
    it("should error for duplicate emails in payload if sanityCheck is true", async () => {
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            sanityCheck: true,
            users: [
                { localId: "test1", email: "foo@example.com" },
                { localId: "test2", email: "foo@example.com" },
            ],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error)
                .to.have.property("message")
                .equal("DUPLICATE_EMAIL : foo@example.com");
        });
    });
    it("should block reusing existing email if sanityCheck is true", async () => {
        const user = await (0, helpers_1.signInWithEmailLink)(authApi(), "bar@example.com");
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            sanityCheck: true,
            users: [{ localId: "test1", email: user.email }],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error).to.eql([
                {
                    index: 0,
                    message: "email exists in other account in database",
                },
            ]);
        });
    });
    it("should error for duplicate providerId+rawIds in payload if sanityCheck is true", async () => {
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            sanityCheck: true,
            users: [
                { localId: "test1", providerUserInfo: [{ providerId: "google.com", rawId: "dup" }] },
                { localId: "test2", providerUserInfo: [{ providerId: "google.com", rawId: "dup" }] },
            ],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error)
                .to.have.property("message")
                .equal("DUPLICATE_RAW_ID : Provider id(google.com), Raw id(dup)");
        });
    });
    it("should block reusing exisiting providerId+rawIds if sanityCheck is true", async () => {
        const providerId = "google.com";
        const rawId = "0123456";
        await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId, { sub: rawId });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            sanityCheck: true,
            users: [{ localId: "test1", providerUserInfo: [{ providerId, rawId }] }],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error).to.eql([
                {
                    index: 0,
                    message: "raw id exists in other account in database",
                },
            ]);
        });
    });
    it("should block duplicate localIds by default", async () => {
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            users: [
                { localId: "test1" },
                { localId: "test1" },
            ],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equal("DUPLICATE_LOCAL_ID : test1");
        });
        const { localId } = await (0, helpers_1.registerAnonUser)(authApi());
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            users: [{ localId }],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error).eql([
                {
                    index: 0,
                    message: "localId belongs to an existing account - can not overwrite.",
                },
            ]);
        });
    });
    it("should not error for empty MFA info", async () => {
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            users: [{ localId: "test1", mfaInfo: [] }],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
    });
    it("should return error for individual invalid entries", async () => {
        const longString = new Array(999).join("x");
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            users: [
                { email: "foo@example.com" },
                { localId: "test1" },
                { localId: "test2", email: "not#an$email" },
                { localId: "test3", phoneNumber: "not#a$phone%number" },
                { localId: "test4", customAttributes: "not#a$json%object" },
                { localId: "test5", customAttributes: '{"sub": "123"}' },
                { localId: "test6", customAttributes: `{"a":"${longString}"}` },
                {
                    localId: "test7",
                    providerUserInfo: [{ providerId: "google.com" }],
                },
                { localId: "test8", providerUserInfo: [{ rawId: "012345" }] },
                { localId: "test9", providerUserInfo: [{ federatedId: "foo-bar" }] },
                {
                    localId: "test10",
                    mfaInfo: [{ phoneInfo: helpers_1.TEST_PHONE_NUMBER }],
                },
                {
                    localId: "test11",
                    email: "someone@example.com",
                    mfaInfo: [{ phoneInfo: helpers_1.TEST_PHONE_NUMBER }],
                },
            ],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error).eql([
                {
                    index: 0,
                    message: "localId is missing",
                },
                {
                    index: 2,
                    message: "email is invalid",
                },
                {
                    index: 3,
                    message: "phone number format is invalid",
                },
                {
                    index: 4,
                    message: "Invalid custom claims provided.",
                },
                {
                    index: 5,
                    message: "Custom claims provided include a reserved claim.",
                },
                {
                    index: 6,
                    message: "Custom claims provided are too large.",
                },
                {
                    index: 7,
                    message: "federatedId or (providerId & rawId) is required",
                },
                {
                    index: 8,
                    message: "federatedId or (providerId & rawId) is required",
                },
                {
                    index: 9,
                    message: "((Parsing federatedId is not implemented in Auth Emulator; please specify providerId AND rawId as a workaround.))",
                },
                {
                    index: 10,
                    message: "Second factor account requires email to be presented.",
                },
                {
                    index: 11,
                    message: "Second factor account requires email to be verified.",
                },
            ]);
        });
    });
    it("should overwrite users with matching localIds if allowOverwrite", async () => {
        const user1ToBeOverwritten = await (0, helpers_1.signInWithFakeClaims)(authApi(), "google.com", {
            sub: "doh",
        });
        const user2ToBeOverwritten = await (0, helpers_1.registerUser)(authApi(), {
            email: "bar@example.com",
            password: "hawaii",
            displayName: "Old Display Name",
        });
        const user1 = {
            localId: user1ToBeOverwritten.localId,
            email: "foo@example.com",
            rawPassword: "notasecret",
        };
        const user2 = {
            localId: user2ToBeOverwritten.localId,
            phoneNumber: helpers_1.TEST_PHONE_NUMBER,
            displayName: "New Display Name",
        };
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ users: [user1, user2], allowOverwrite: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
        const user1Info = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), user1.localId);
        (0, chai_1.expect)(user1Info.email).to.eql(user1.email);
        (0, chai_1.expect)(user1Info.providerUserInfo).to.eql([
            {
                providerId: "password",
                rawId: "foo@example.com",
                email: "foo@example.com",
                federatedId: "foo@example.com",
            },
        ]);
        const user2SignIn = await (0, helpers_1.signInWithPhoneNumber)(authApi(), user2.phoneNumber);
        (0, chai_1.expect)(user2SignIn.localId).to.equal(user2.localId);
        const user2Info = await (0, helpers_1.getAccountInfoByIdToken)(authApi(), user2SignIn.idToken);
        (0, chai_1.expect)(user2Info.email || "").to.be.empty;
        (0, chai_1.expect)(user2Info.passwordHash || "").to.be.empty;
        (0, chai_1.expect)(user2Info.displayName).to.equal(user2.displayName);
    });
    it("should import identity provider info", async () => {
        const email = "foo@example.com";
        const providerId = "google.com";
        const rawId = "0123456";
        const user1 = {
            localId: "foo",
            email,
            providerUserInfo: [{ providerId, rawId, displayName: "Foo", email }],
        };
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ users: [user1] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
        const user1SignInMethods = await (0, helpers_1.getSigninMethods)(authApi(), user1.email);
        (0, chai_1.expect)(user1SignInMethods).to.eql([providerId]);
        const user1SignIn = await (0, helpers_1.signInWithFakeClaims)(authApi(), providerId, {
            sub: rawId,
        });
        (0, chai_1.expect)(user1SignIn.localId).to.equal(user1.localId);
    });
    it("should import MFA info", async () => {
        const email = "foo@example.com";
        const user1 = {
            localId: "foo",
            email,
            emailVerified: true,
            mfaInfo: [
                {
                    enrolledAt: "2123-04-05T06:07:28.990Z",
                    phoneInfo: helpers_1.TEST_PHONE_NUMBER,
                },
            ],
        };
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ users: [user1] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
        const user1Info = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), user1.localId);
        (0, chai_1.expect)(user1Info.mfaInfo).to.have.length(1);
        (0, chai_1.expect)(user1Info.mfaInfo[0]).to.contain({
            enrolledAt: user1.mfaInfo[0].enrolledAt,
            phoneInfo: helpers_1.TEST_PHONE_NUMBER,
            unobfuscatedPhoneInfo: helpers_1.TEST_PHONE_NUMBER,
        });
        (0, chai_1.expect)(user1Info.mfaInfo[0].mfaEnrollmentId).to.be.a("string").and.not.empty;
    });
    it("should error if auth is disabled", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, { disableAuth: true });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ tenantId: tenant.tenantId })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").includes("PROJECT_DISABLED");
        });
    });
    it("should error if user tenantId does not match state tenantId", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, { disableAuth: false });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({
            tenantId: tenant.tenantId,
            users: [{ localId: "test1", tenantId: "not-matching-tenant-id" }],
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error).eql([
                {
                    index: 0,
                    message: "Tenant id in userInfo does not match the tenant id in request.",
                },
            ]);
        });
    });
    it("should create users with tenantId if present", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), helpers_1.PROJECT_ID, { disableAuth: false });
        const user = {
            localId: "foo",
            email: "me@example.com",
            rawPassword: "notasecret",
        };
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchCreate`)
            .set("Authorization", "Bearer owner")
            .send({ tenantId: tenant.tenantId, users: [user] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.error || []).to.have.length(0);
        });
        const userInfo = await (0, helpers_1.getAccountInfoByLocalId)(authApi(), user.localId, tenant.tenantId);
        (0, chai_1.expect)(userInfo.tenantId).to.eql(tenant.tenantId);
    });
});
(0, setup_1.describeAuthEmulator)("accounts:batchDelete", ({ authApi }) => {
    it("should delete specified disabled accounts", async () => {
        const user1 = await (0, helpers_1.registerAnonUser)(authApi());
        const user2 = await (0, helpers_1.registerUser)(authApi(), {
            email: "foobar@example.com",
            password: "barbaz",
        });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), user1.localId, { disableUser: true });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), user2.localId, { disableUser: true });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchDelete`)
            .set("Authorization", "Bearer owner")
            .send({ localIds: [user1.localId, user2.localId] })
            .then((res) => {
            var _a;
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)((_a = res.body.errors) !== null && _a !== void 0 ? _a : []).to.be.empty;
        });
    });
    it("should error for accounts not disabled", async () => {
        const user1 = await (0, helpers_1.registerAnonUser)(authApi());
        const user2 = await (0, helpers_1.registerUser)(authApi(), {
            email: "foobar@example.com",
            password: "barbaz",
        });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), user2.localId, { disableUser: true });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchDelete`)
            .set("Authorization", "Bearer owner")
            .send({ localIds: [user1.localId, user2.localId] })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.errors).to.eql([
                {
                    index: 0,
                    localId: user1.localId,
                    message: "NOT_DISABLED : Disable the account before batch deletion.",
                },
            ]);
        });
    });
    it("should delete disabled and not disabled accounts with force: true", async () => {
        const user1 = await (0, helpers_1.registerAnonUser)(authApi());
        const user2 = await (0, helpers_1.registerUser)(authApi(), {
            email: "foobar@example.com",
            password: "barbaz",
        });
        await (0, helpers_1.updateAccountByLocalId)(authApi(), user2.localId, { disableUser: true });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchDelete`)
            .set("Authorization", "Bearer owner")
            .send({ localIds: [user1.localId, user2.localId], force: true })
            .then((res) => {
            var _a;
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)((_a = res.body.errors) !== null && _a !== void 0 ? _a : []).to.be.empty;
        });
    });
    it("should not report errors for nonexistent localIds", async () => {
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchDelete`)
            .set("Authorization", "Bearer owner")
            .send({ localIds: ["nosuch", "nosuch2"] })
            .then((res) => {
            var _a;
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)((_a = res.body.errors) !== null && _a !== void 0 ? _a : []).to.be.empty;
        });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchDelete`)
            .set("Authorization", "Bearer owner")
            .send({ localIds: ["nosuch", "nosuch2"], force: true })
            .then((res) => {
            var _a;
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)((_a = res.body.errors) !== null && _a !== void 0 ? _a : []).to.be.empty;
        });
    });
    it("should error if localIds array is empty", async () => {
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchDelete`)
            .set("Authorization", "Bearer owner")
            .send({ localIds: [], force: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("LOCAL_ID_LIST_EXCEEDS_LIMIT");
        });
    });
    it("should error if localId count is more than limit", async () => {
        const localIds = [];
        for (let i = 0; i < 1000; i++) {
            localIds.push(`localId-${i}`);
        }
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchDelete`)
            .set("Authorization", "Bearer owner")
            .send({ localIds, force: true })
            .then((res) => {
            var _a;
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)((_a = res.body.errors) !== null && _a !== void 0 ? _a : []).to.be.empty;
        });
        localIds.push("extraOne");
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${helpers_1.PROJECT_ID}/accounts:batchDelete`)
            .set("Authorization", "Bearer owner")
            .send({ localIds, force: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("LOCAL_ID_LIST_EXCEEDS_LIMIT");
        });
    });
});
//# sourceMappingURL=batch.spec.js.map