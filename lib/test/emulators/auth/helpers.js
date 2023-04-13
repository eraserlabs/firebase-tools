"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfig = exports.registerTenant = exports.deleteAccount = exports.enrollPhoneMfa = exports.updateAccountByLocalId = exports.updateProjectConfig = exports.getSigninMethods = exports.createEmailSignInOob = exports.inspectVerificationCodes = exports.inspectOobs = exports.getAccountInfoByLocalId = exports.getAccountInfoByIdToken = exports.expectIdTokenExpired = exports.expectUserNotExistsForIdToken = exports.signInWithFakeClaims = exports.signInWithPhoneNumber = exports.signInWithPassword = exports.signInWithEmailLink = exports.registerAnonUser = exports.registerUser = exports.fakeClaims = exports.expectStatusCode = exports.BEFORE_SIGN_IN_URL = exports.BEFORE_CREATE_URL = exports.BEFORE_SIGN_IN_PATH = exports.BEFORE_CREATE_PATH = exports.BLOCKING_FUNCTION_HOST = exports.REAL_GOOGLE_ACCOUNT = exports.FAKE_GOOGLE_ACCOUNT = exports.PHOTO_URL = exports.DISPLAY_NAME = exports.TEST_INVALID_PHONE_NUMBER = exports.TEST_MFA_INFO = exports.TEST_PHONE_NUMBER_3 = exports.TEST_PHONE_NUMBER_2 = exports.TEST_PHONE_NUMBER_OBFUSCATED = exports.TEST_PHONE_NUMBER = exports.PROJECT_ID = void 0;
const http_1 = require("http");
const util_1 = require("util");
const chai_1 = require("chai");
const setup_1 = require("./setup");
Object.defineProperty(exports, "PROJECT_ID", { enumerable: true, get: function () { return setup_1.PROJECT_ID; } });
exports.TEST_PHONE_NUMBER = "+15555550100";
exports.TEST_PHONE_NUMBER_OBFUSCATED = "+*******0100";
exports.TEST_PHONE_NUMBER_2 = "+15555550101";
exports.TEST_PHONE_NUMBER_3 = "+15555550102";
exports.TEST_MFA_INFO = {
    displayName: "Cell Phone",
    phoneInfo: exports.TEST_PHONE_NUMBER,
};
exports.TEST_INVALID_PHONE_NUMBER = "5555550100";
exports.DISPLAY_NAME = "Example User";
exports.PHOTO_URL = "http://fakephotourl.test";
exports.FAKE_GOOGLE_ACCOUNT = {
    displayName: "Example User",
    email: "example@gmail.com",
    emailVerified: true,
    rawId: "123456789012345678901",
    idToken: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjI4NzQ2ODI4NDQtYjBzOHM3NWIzaWVkYjJtZDRobHMydm9xNnNsbGJzbTMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMjg3NDY4Mjg0NC1iMHM4czc1YjNpZWRiMm1kNGhsczJ2b3E2c2xsYnNtMy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEyMzQ1Njc4OTAxMjM0NTY3ODkwMSIsImVtYWlsIjoiZXhhbXBsZUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCJpYXQiOjE1OTc4ODI2ODEsImV4cCI6MTU5Nzg4NjI4MX0.",
    idTokenNoEmail: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjI4NzQ2ODI4NDQtYjBzOHM3NWIzaWVkYjJtZDRobHMydm9xNnNsbGJzbTMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMjg3NDY4Mjg0NC1iMHM4czc1YjNpZWRiMm1kNGhsczJ2b3E2c2xsYnNtMy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEyMzQ1Njc4OTAxMjM0NTY3ODkwMSIsImF0X2hhc2giOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIiwiaWF0IjoxNTk3ODgyNjgxLCJleHAiOjE1OTc4ODYyODF9.",
};
exports.REAL_GOOGLE_ACCOUNT = {
    displayName: "Oberyn Baelish",
    email: "oberynbaelish.331826@gmail.com",
    emailVerified: true,
    rawId: "115113236566683398301",
    photoUrl: "https://lh3.googleusercontent.com/-KNaMyFnKZ9o/AAAAAAAAAAI/AAAAAAAAAAA/AMZuucnZC9bn4HcT-8bQka3uG3lUYd4lSA/photo.jpg",
    idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjZiYzYzZTlmMThkNTYxYjM0ZjU2NjhmODhhZTI3ZDQ4ODc2ZDgwNzMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjI4NzQ2ODI4NDQtYjBzOHM3NWIzaWVkYjJtZDRobHMydm9xNnNsbGJzbTMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMjg3NDY4Mjg0NC1iMHM4czc1YjNpZWRiMm1kNGhsczJ2b3E2c2xsYnNtMy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExNTExMzIzNjU2NjY4MzM5ODMwMSIsImVtYWlsIjoib2JlcnluYmFlbGlzaC4zMzE4MjZAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJXNTlTOEs4Y3g0Y3hYYmh0YmFXYndBIiwiaWF0IjoxNTk3ODgyNjgxLCJleHAiOjE1OTc4ODYyODF9.000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    idTokenNoEmail: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjZiYzYzZTlmMThkNTYxYjM0ZjU2NjhmODhhZTI3ZDQ4ODc2ZDgwNzMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMjI4NzQ2ODI4NDQtYjBzOHM3NWIzaWVkYjJtZDRobHMydm9xNnNsbGJzbTMuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIyMjg3NDY4Mjg0NC1iMHM4czc1YjNpZWRiMm1kNGhsczJ2b3E2c2xsYnNtMy5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjExNTExMzIzNjU2NjY4MzM5ODMwMSIsImF0X2hhc2giOiJJRHA0UFFldFItLUFyaWhXX2NYMmd3IiwiaWF0IjoxNTk3ODgyNDQyLCJleHAiOjE1OTc4ODYwNDJ9.000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
};
exports.BLOCKING_FUNCTION_HOST = "http://my-blocking-function.test";
exports.BEFORE_CREATE_PATH = "/beforeCreate";
exports.BEFORE_SIGN_IN_PATH = "/beforeSignIn";
exports.BEFORE_CREATE_URL = exports.BLOCKING_FUNCTION_HOST + exports.BEFORE_CREATE_PATH;
exports.BEFORE_SIGN_IN_URL = exports.BLOCKING_FUNCTION_HOST + exports.BEFORE_SIGN_IN_PATH;
function expectStatusCode(expected, res) {
    if (res.status !== expected) {
        const body = (0, util_1.inspect)(res.body);
        throw new chai_1.AssertionError(`expected ${expected} "${http_1.STATUS_CODES[expected]}", got ${res.status} "${http_1.STATUS_CODES[res.status]}", with response body:\n${body}`);
    }
}
exports.expectStatusCode = expectStatusCode;
function fakeClaims(input) {
    return Object.assign({
        iss: "example.com",
        aud: "example.com",
        exp: 1597974008,
        iat: 1597970408,
    }, input);
}
exports.fakeClaims = fakeClaims;
function registerUser(testAgent, user) {
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
        .send(user)
        .query({ key: "fake-api-key" })
        .then((res) => {
        expectStatusCode(200, res);
        return {
            idToken: res.body.idToken,
            localId: res.body.localId,
            refreshToken: res.body.refreshToken,
            email: res.body.email,
        };
    });
}
exports.registerUser = registerUser;
function registerAnonUser(testAgent) {
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
        .send({ returnSecureToken: true })
        .query({ key: "fake-api-key" })
        .then((res) => {
        expectStatusCode(200, res);
        return {
            idToken: res.body.idToken,
            localId: res.body.localId,
            refreshToken: res.body.refreshToken,
        };
    });
}
exports.registerAnonUser = registerAnonUser;
async function signInWithEmailLink(testAgent, email, idTokenToLink) {
    const { oobCode } = await createEmailSignInOob(testAgent, email);
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithEmailLink")
        .query({ key: "fake-api-key" })
        .send({ email, oobCode, idToken: idTokenToLink })
        .then((res) => {
        return {
            idToken: res.body.idToken,
            localId: res.body.localId,
            refreshToken: res.body.refreshToken,
            email,
        };
    });
}
exports.signInWithEmailLink = signInWithEmailLink;
function signInWithPassword(testAgent, email, password, extractMfaPending = false) {
    if (extractMfaPending) {
        return testAgent
            .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
            .send({ email, password })
            .query({ key: "fake-api-key" })
            .then((res) => {
            expectStatusCode(200, res);
            const mfaPendingCredential = res.body.mfaPendingCredential;
            const mfaInfo = res.body.mfaInfo;
            return { mfaPendingCredential, mfaEnrollmentId: mfaInfo[0].mfaEnrollmentId };
        });
    }
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword")
        .send({ email, password })
        .query({ key: "fake-api-key" })
        .then((res) => {
        expectStatusCode(200, res);
        return {
            idToken: res.body.idToken,
            localId: res.body.localId,
            refreshToken: res.body.refreshToken,
            email: res.body.email,
        };
    });
}
exports.signInWithPassword = signInWithPassword;
async function signInWithPhoneNumber(testAgent, phoneNumber) {
    const sessionInfo = await testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode")
        .query({ key: "fake-api-key" })
        .send({ phoneNumber, recaptchaToken: "ignored" })
        .then((res) => {
        expectStatusCode(200, res);
        return res.body.sessionInfo;
    });
    const codes = await inspectVerificationCodes(testAgent);
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber")
        .query({ key: "fake-api-key" })
        .send({ sessionInfo, code: codes[0].code })
        .then((res) => {
        expectStatusCode(200, res);
        return {
            idToken: res.body.idToken,
            localId: res.body.localId,
            refreshToken: res.body.refreshToken,
        };
    });
}
exports.signInWithPhoneNumber = signInWithPhoneNumber;
function signInWithFakeClaims(testAgent, providerId, claims, tenantId) {
    const fakeIdToken = JSON.stringify(fakeClaims(claims));
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp")
        .query({ key: "fake-api-key" })
        .send({
        postBody: `providerId=${encodeURIComponent(providerId)}&id_token=${encodeURIComponent(fakeIdToken)}`,
        requestUri: "http://localhost",
        returnIdpCredential: true,
        returnSecureToken: true,
        tenantId,
    })
        .then((res) => {
        expectStatusCode(200, res);
        return {
            idToken: res.body.idToken,
            localId: res.body.localId,
            refreshToken: res.body.refreshToken,
            email: res.body.email,
        };
    });
}
exports.signInWithFakeClaims = signInWithFakeClaims;
async function expectUserNotExistsForIdToken(testAgent, idToken, tenantId) {
    await testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:lookup")
        .send({ idToken, tenantId })
        .query({ key: "fake-api-key" })
        .then((res) => {
        expectStatusCode(400, res);
        (0, chai_1.expect)(res.body.error).to.have.property("message").equals("USER_NOT_FOUND");
    });
}
exports.expectUserNotExistsForIdToken = expectUserNotExistsForIdToken;
async function expectIdTokenExpired(testAgent, idToken) {
    await testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:lookup")
        .send({ idToken })
        .query({ key: "fake-api-key" })
        .then((res) => {
        expectStatusCode(400, res);
        (0, chai_1.expect)(res.body.error).to.have.property("message").equals("TOKEN_EXPIRED");
    });
}
exports.expectIdTokenExpired = expectIdTokenExpired;
function getAccountInfoByIdToken(testAgent, idToken, tenantId) {
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:lookup")
        .send({ idToken, tenantId })
        .query({ key: "fake-api-key" })
        .then((res) => {
        expectStatusCode(200, res);
        (0, chai_1.expect)(res.body.users || []).to.have.length(1);
        return res.body.users[0];
    });
}
exports.getAccountInfoByIdToken = getAccountInfoByIdToken;
function getAccountInfoByLocalId(testAgent, localId, tenantId) {
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:lookup")
        .send({ localId: [localId], tenantId })
        .set("Authorization", "Bearer owner")
        .then((res) => {
        expectStatusCode(200, res);
        (0, chai_1.expect)(res.body.users || []).to.have.length(1);
        return res.body.users[0];
    });
}
exports.getAccountInfoByLocalId = getAccountInfoByLocalId;
function inspectOobs(testAgent, tenantId) {
    const path = tenantId
        ? `/emulator/v1/projects/${setup_1.PROJECT_ID}/tenants/${tenantId}/oobCodes`
        : `/emulator/v1/projects/${setup_1.PROJECT_ID}/oobCodes`;
    return testAgent.get(path).then((res) => {
        expectStatusCode(200, res);
        return res.body.oobCodes;
    });
}
exports.inspectOobs = inspectOobs;
function inspectVerificationCodes(testAgent, tenantId) {
    const path = tenantId
        ? `/emulator/v1/projects/${setup_1.PROJECT_ID}/tenants/${tenantId}/verificationCodes`
        : `/emulator/v1/projects/${setup_1.PROJECT_ID}/verificationCodes`;
    return testAgent.get(path).then((res) => {
        expectStatusCode(200, res);
        return res.body.verificationCodes;
    });
}
exports.inspectVerificationCodes = inspectVerificationCodes;
function createEmailSignInOob(testAgent, email, tenantId) {
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
        .send({ email, requestType: "EMAIL_SIGNIN", returnOobLink: true, tenantId })
        .set("Authorization", "Bearer owner")
        .then((res) => {
        expectStatusCode(200, res);
        return {
            oobCode: res.body.oobCode,
            oobLink: res.body.oobLink,
        };
    });
}
exports.createEmailSignInOob = createEmailSignInOob;
function getSigninMethods(testAgent, email) {
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:createAuthUri")
        .send({ continueUri: "http://example.com/", identifier: email })
        .query({ key: "fake-api-key" })
        .then((res) => {
        expectStatusCode(200, res);
        return res.body.signinMethods;
    });
}
exports.getSigninMethods = getSigninMethods;
function updateProjectConfig(testAgent, config) {
    return testAgent
        .patch(`/emulator/v1/projects/${setup_1.PROJECT_ID}/config`)
        .set("Authorization", "Bearer owner")
        .send(config)
        .then((res) => {
        expectStatusCode(200, res);
    });
}
exports.updateProjectConfig = updateProjectConfig;
function updateAccountByLocalId(testAgent, localId, fields) {
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:update")
        .set("Authorization", "Bearer owner")
        .send(Object.assign({ localId }, fields))
        .then((res) => {
        expectStatusCode(200, res);
    });
}
exports.updateAccountByLocalId = updateAccountByLocalId;
async function enrollPhoneMfa(testAgent, idToken, phoneNumber, tenantId) {
    const sessionInfo = await testAgent
        .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:start")
        .query({ key: "fake-api-key" })
        .send({ idToken, phoneEnrollmentInfo: { phoneNumber }, tenantId })
        .then((res) => {
        expectStatusCode(200, res);
        (0, chai_1.expect)(res.body.phoneSessionInfo.sessionInfo).to.be.a("string");
        return res.body.phoneSessionInfo.sessionInfo;
    });
    const code = (await inspectVerificationCodes(testAgent, tenantId))[0].code;
    return testAgent
        .post("/identitytoolkit.googleapis.com/v2/accounts/mfaEnrollment:finalize")
        .query({ key: "fake-api-key" })
        .send({ idToken, phoneVerificationInfo: { code, sessionInfo }, tenantId })
        .then((res) => {
        expectStatusCode(200, res);
        (0, chai_1.expect)(res.body.idToken).to.be.a("string");
        (0, chai_1.expect)(res.body.refreshToken).to.be.a("string");
        return { idToken: res.body.idToken, refreshToken: res.body.refreshToken };
    });
}
exports.enrollPhoneMfa = enrollPhoneMfa;
function deleteAccount(testAgent, reqBody) {
    return testAgent
        .post("/identitytoolkit.googleapis.com/v1/accounts:delete")
        .send(reqBody)
        .query({ key: "fake-api-key" })
        .then((res) => {
        expectStatusCode(200, res);
        (0, chai_1.expect)(res.body).not.to.have.property("error");
        return res.body.kind;
    });
}
exports.deleteAccount = deleteAccount;
function registerTenant(testAgent, projectId, tenant) {
    return testAgent
        .post(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants`)
        .query({ key: "fake-api-key" })
        .set("Authorization", "Bearer owner")
        .send(tenant)
        .then((res) => {
        expectStatusCode(200, res);
        return res.body;
    });
}
exports.registerTenant = registerTenant;
async function updateConfig(testAgent, projectId, config, updateMask) {
    await testAgent
        .patch(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/config`)
        .set("Authorization", "Bearer owner")
        .query({ updateMask })
        .send(config)
        .then((res) => {
        expectStatusCode(200, res);
    });
}
exports.updateConfig = updateConfig;
//# sourceMappingURL=helpers.js.map