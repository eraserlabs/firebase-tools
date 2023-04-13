"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
const setup_1 = require("./setup");
(0, setup_1.describeAuthEmulator)("REST API mapping", ({ authApi }) => {
    it("should respond to status checks", async () => {
        await authApi()
            .get("/")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.authEmulator).to.be.an("object");
        });
    });
    it("should allow cross-origin requests", async () => {
        await authApi()
            .options("/")
            .set("Origin", "example.com")
            .set("Access-Control-Request-Headers", "Authorization,X-Client-Version,X-Whatever-Header")
            .set("Access-Control-Request-Private-Network", "true")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(204, res);
            (0, chai_1.expect)(res.header["access-control-allow-origin"]).to.eql("example.com");
            (0, chai_1.expect)(res.header["access-control-allow-headers"].split(",")).to.have.members([
                "Authorization",
                "X-Client-Version",
                "X-Whatever-Header",
            ]);
            (0, chai_1.expect)(res.header["access-control-allow-private-network"]).to.eql("true");
        });
    });
    it("should handle integer values for enums", async () => {
        const requestType = 6;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:sendOobCode")
            .set("Authorization", "Bearer owner")
            .send({ email: "bob@example.com", requestType, returnOobLink: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.oobLink).to.include("mode=signIn");
        });
    });
    it("should handle integer values for enums (legacy API path)", async () => {
        const requestType = 6;
        await authApi()
            .post("/www.googleapis.com/identitytoolkit/v3/relyingparty/getOobConfirmationCode")
            .set("Authorization", "Bearer owner")
            .send({ email: "bob@example.com", requestType, returnOobLink: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body.oobLink).to.include("mode=signIn");
        });
    });
    it("should convert numbers to strings for type:string fields", async () => {
        const validSince = 1611780718;
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:update")
            .set("Authorization", "Bearer owner")
            .send({ localId: "nosuch", validSince })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error.message).to.equal("USER_NOT_FOUND");
        });
    });
});
(0, setup_1.describeAuthEmulator)("authentication", ({ authApi }) => {
    it("should throw 403 if API key is not provided", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
            .query({})
            .send({ returnSecureToken: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(403, res);
            (0, chai_1.expect)(res.body.error).to.have.property("status").equal("PERMISSION_DENIED");
        });
    });
    it("should accept API key as a query parameter", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
            .query({ key: "fake-api-key" })
            .send({})
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("error");
        });
    });
    it("should accept API key in HTTP Header x-goog-api-key", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
            .set("x-goog-api-key", "fake-api-key")
            .send({})
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("error");
        });
    });
    it("should ignore non-Bearer Authorization headers", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
            .set("Authorization", "Basic YWxhZGRpbjpvcGVuc2VzYW1l")
            .query({})
            .send({ returnSecureToken: true })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(403, res);
            (0, chai_1.expect)(res.body.error).to.have.property("status").equal("PERMISSION_DENIED");
        });
    });
    it("should treat Bearer owner as authenticated to project", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
            .set("Authorization", "Bearer owner")
            .send({
            targetProjectId: "example2",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("error");
        });
    });
    it("should ignore casing of Bearer / owner in Authorization header", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
            .set("Authorization", "bEArEr OWNER")
            .send({
            targetProjectId: "example2",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("error");
        });
    });
    it("should treat production service account as authenticated to project", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
            .set("Authorization", "Bearer ya" + "29.AHES0ZZZZZ0fff" + "ff0XXXX0mmmm0wwwww0-LL_l-0bb0b0bbbbbb")
            .send({
            targetProjectId: "example2",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(200, res);
            (0, chai_1.expect)(res.body).not.to.have.property("error");
        });
    });
    it("should deny requests with targetProjectId but without OAuth 2", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/accounts:signUp")
            .query({ key: "fake-api-key" })
            .send({
            targetProjectId: "example2",
        })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error)
                .to.have.property("message")
                .equals("INSUFFICIENT_PERMISSION : Only authenticated requests can specify target_project_id.");
        });
    });
    it("should deny requests where tenant IDs do not match in the request body and path", async () => {
        await authApi()
            .post("/identitytoolkit.googleapis.com/v1/projects/project-id/tenants/tenant-id/accounts:delete")
            .set("Authorization", "Bearer owner")
            .send({ localId: "local-id", tenantId: "mismatching-tenant-id" })
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("TENANT_ID_MISMATCH");
        });
    });
    it("should deny requests where tenant IDs do not match in the ID token and path", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            allowPasswordSignup: true,
        });
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
            tenantId: tenant.tenantId,
        });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${setup_1.PROJECT_ID}/tenants/not-matching-tenant-id/accounts:lookup`)
            .send({ idToken })
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("TENANT_ID_MISMATCH");
        });
    });
    it("should deny requests where tenant IDs do not match in the ID token and request body", async () => {
        const tenant = await (0, helpers_1.registerTenant)(authApi(), setup_1.PROJECT_ID, {
            disableAuth: false,
            allowPasswordSignup: true,
        });
        const { idToken } = await (0, helpers_1.registerUser)(authApi(), {
            email: "alice@example.com",
            password: "notasecret",
            tenantId: tenant.tenantId,
        });
        await authApi()
            .post(`/identitytoolkit.googleapis.com/v1/projects/${setup_1.PROJECT_ID}/accounts:lookup`)
            .send({ idToken, tenantId: "not-matching-tenant-id" })
            .set("Authorization", "Bearer owner")
            .then((res) => {
            (0, helpers_1.expectStatusCode)(400, res);
            (0, chai_1.expect)(res.body.error).to.have.property("message").equals("TENANT_ID_MISMATCH");
        });
    });
});
//# sourceMappingURL=rest.spec.js.map