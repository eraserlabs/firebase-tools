"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
const setup_1 = require("./setup");
(0, setup_1.describeAuthEmulator)("tenant management", ({ authApi }) => {
    describe("createTenant", () => {
        it("should create tenants", async () => {
            await authApi()
                .post("/identitytoolkit.googleapis.com/v2/projects/project-id/tenants")
                .set("Authorization", "Bearer owner")
                .send({
                allowPasswordSignup: true,
                disableAuth: false,
                displayName: "display",
                enableAnonymousUser: true,
                enableEmailLinkSignin: true,
                mfaConfig: {
                    enabledProviders: ["PROVIDER_UNSPECIFIED", "PHONE_SMS"],
                    state: "ENABLED",
                },
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.allowPasswordSignup).to.be.true;
                (0, chai_1.expect)(res.body.disableAuth).to.be.false;
                (0, chai_1.expect)(res.body.displayName).to.eql("display");
                (0, chai_1.expect)(res.body.enableAnonymousUser).to.be.true;
                (0, chai_1.expect)(res.body.enableEmailLinkSignin).to.be.true;
                (0, chai_1.expect)(res.body.mfaConfig).to.eql({
                    enabledProviders: ["PROVIDER_UNSPECIFIED", "PHONE_SMS"],
                    state: "ENABLED",
                });
                (0, chai_1.expect)(res.body).to.have.property("tenantId");
                (0, chai_1.expect)(res.body.tenantId).to.not.eql("");
                (0, chai_1.expect)(res.body).to.have.property("name");
                (0, chai_1.expect)(res.body.name).to.eql(`projects/project-id/tenants/${res.body.tenantId}`);
            });
        });
        it("should create a tenant with default disabled settings", async () => {
            await authApi()
                .post("/identitytoolkit.googleapis.com/v2/projects/project-id/tenants")
                .set("Authorization", "Bearer owner")
                .send({})
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.allowPasswordSignup).to.be.false;
                (0, chai_1.expect)(res.body.disableAuth).to.be.false;
                (0, chai_1.expect)(res.body.enableAnonymousUser).to.be.false;
                (0, chai_1.expect)(res.body.enableEmailLinkSignin).to.be.false;
                (0, chai_1.expect)(res.body.mfaConfig).to.eql({
                    state: "DISABLED",
                    enabledProviders: [],
                });
            });
        });
    });
    describe("getTenants", () => {
        it("should get tenants", async () => {
            const projectId = "project-id";
            const tenant = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenant.tenantId}`)
                .set("Authorization", "Bearer owner")
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.eql(tenant);
            });
        });
        it("should create tenants with default enabled settings if they do not exist", async () => {
            const projectId = "project-id";
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants`)
                .set("Authorization", "Bearer owner")
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.tenants).to.have.length(0);
            });
            const tenantId = "tenant-id";
            const createdTenant = {
                tenantId,
                name: `projects/${projectId}/tenants/${tenantId}`,
                allowPasswordSignup: true,
                disableAuth: false,
                enableAnonymousUser: true,
                enableEmailLinkSignin: true,
                mfaConfig: {
                    enabledProviders: ["PHONE_SMS"],
                    state: "ENABLED",
                },
            };
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenantId}`)
                .set("Authorization", "Bearer owner")
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.eql(createdTenant);
            });
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants`)
                .set("Authorization", "Bearer owner")
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.tenants).to.have.length(1);
                (0, chai_1.expect)(res.body.tenants[0].tenantId).to.eql(tenantId);
            });
        });
    });
    describe("deleteTenants", () => {
        it("should delete tenants", async () => {
            const projectId = "project-id";
            const tenant = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            await authApi()
                .delete(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenant.tenantId}`)
                .set("Authorization", "Bearer owner")
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
            });
        });
        it("should delete tenants if request body is passed", async () => {
            const projectId = "project-id";
            const tenant = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            await authApi()
                .delete(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenant.tenantId}`)
                .set("Authorization", "Bearer owner")
                .send({})
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
            });
        });
    });
    describe("listTenants", () => {
        it("should list tenants", async () => {
            const projectId = "project-id";
            const tenant1 = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            const tenant2 = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants`)
                .set("Authorization", "Bearer owner")
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.tenants).to.have.length(2);
                (0, chai_1.expect)(res.body.tenants.map((tenant) => tenant.tenantId)).to.have.members([
                    tenant1.tenantId,
                    tenant2.tenantId,
                ]);
                (0, chai_1.expect)(res.body).not.to.have.property("nextPageToken");
            });
        });
        it("should allow specifying pageSize and pageToken", async () => {
            const projectId = "project-id";
            const tenant1 = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            const tenant2 = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            const tenantIds = [tenant1.tenantId, tenant2.tenantId].sort();
            const nextPageToken = await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants`)
                .set("Authorization", "Bearer owner")
                .query({ pageSize: 1 })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.tenants).to.have.length(1);
                (0, chai_1.expect)(res.body.tenants[0].tenantId).to.eql(tenantIds[0]);
                (0, chai_1.expect)(res.body).to.have.property("nextPageToken").which.is.a("string");
                return res.body.nextPageToken;
            });
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants`)
                .set("Authorization", "Bearer owner")
                .query({ pageToken: nextPageToken })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.tenants).to.have.length(1);
                (0, chai_1.expect)(res.body.tenants[0].tenantId).to.eql(tenantIds[1]);
                (0, chai_1.expect)(res.body).not.to.have.property("nextPageToken");
            });
        });
        it("should always return a page token even if page is full", async () => {
            const projectId = "project-id";
            const tenant1 = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            const tenant2 = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            const tenantIds = [tenant1.tenantId, tenant2.tenantId].sort();
            const nextPageToken = await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants`)
                .set("Authorization", "Bearer owner")
                .query({ pageSize: 2 })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.tenants).to.have.length(2);
                (0, chai_1.expect)(res.body.tenants[0].tenantId).to.eql(tenantIds[0]);
                (0, chai_1.expect)(res.body.tenants[1].tenantId).to.eql(tenantIds[1]);
                (0, chai_1.expect)(res.body).to.have.property("nextPageToken").which.is.a("string");
                return res.body.nextPageToken;
            });
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants`)
                .set("Authorization", "Bearer owner")
                .query({ pageToken: nextPageToken })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.tenants || []).to.have.length(0);
                (0, chai_1.expect)(res.body).not.to.have.property("nextPageToken");
            });
        });
    });
    describe("updateTenants", () => {
        it("updates tenant config", async () => {
            const projectId = "project-id";
            const tenant = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            const updateMask = "allowPasswordSignup,disableAuth,displayName,enableAnonymousUser,enableEmailLinkSignin,mfaConfig";
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenant.tenantId}`)
                .set("Authorization", "Bearer owner")
                .query({ updateMask })
                .send({
                allowPasswordSignup: true,
                disableAuth: false,
                displayName: "display",
                enableAnonymousUser: true,
                enableEmailLinkSignin: true,
                mfaConfig: {
                    enabledProviders: ["PROVIDER_UNSPECIFIED", "PHONE_SMS"],
                    state: "ENABLED",
                },
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.allowPasswordSignup).to.be.true;
                (0, chai_1.expect)(res.body.disableAuth).to.be.false;
                (0, chai_1.expect)(res.body.displayName).to.eql("display");
                (0, chai_1.expect)(res.body.enableAnonymousUser).to.be.true;
                (0, chai_1.expect)(res.body.enableEmailLinkSignin).to.be.true;
                (0, chai_1.expect)(res.body.mfaConfig).to.eql({
                    enabledProviders: ["PROVIDER_UNSPECIFIED", "PHONE_SMS"],
                    state: "ENABLED",
                });
            });
        });
        it("does not update if the field does not exist on the update tenant", async () => {
            const projectId = "project-id";
            const tenant = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            const updateMask = "displayName";
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenant.tenantId}`)
                .set("Authorization", "Bearer owner")
                .query({ updateMask })
                .send({})
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).not.to.have.property("displayName");
            });
        });
        it("does not update if indexing a primitive field or array on the update tenant", async () => {
            const projectId = "project-id";
            const tenant = await (0, helpers_1.registerTenant)(authApi(), projectId, {
                displayName: "display",
                mfaConfig: {
                    enabledProviders: ["PROVIDER_UNSPECIFIED", "PHONE_SMS"],
                },
            });
            const updateMask = "displayName.0,mfaConfig.enabledProviders.nonexistentField";
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenant.tenantId}`)
                .set("Authorization", "Bearer owner")
                .query({ updateMask })
                .send({
                displayName: "unused",
                mfaConfig: {
                    enabledProviders: ["PROVIDER_UNSPECIFIED"],
                },
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.displayName).to.eql("display");
                (0, chai_1.expect)(res.body.mfaConfig.enabledProviders).to.eql(["PROVIDER_UNSPECIFIED", "PHONE_SMS"]);
            });
        });
        it("performs a full update if the update mask is empty", async () => {
            const projectId = "project-id";
            const tenant = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenant.tenantId}`)
                .set("Authorization", "Bearer owner")
                .send({
                allowPasswordSignup: true,
                disableAuth: false,
                displayName: "display",
                enableAnonymousUser: true,
                enableEmailLinkSignin: true,
                mfaConfig: {
                    enabledProviders: ["PROVIDER_UNSPECIFIED", "PHONE_SMS"],
                    state: "ENABLED",
                },
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.allowPasswordSignup).to.be.true;
                (0, chai_1.expect)(res.body.disableAuth).to.be.false;
                (0, chai_1.expect)(res.body.displayName).to.eql("display");
                (0, chai_1.expect)(res.body.enableAnonymousUser).to.be.true;
                (0, chai_1.expect)(res.body.enableEmailLinkSignin).to.be.true;
                (0, chai_1.expect)(res.body.mfaConfig).to.eql({
                    enabledProviders: ["PROVIDER_UNSPECIFIED", "PHONE_SMS"],
                    state: "ENABLED",
                });
            });
        });
        it("performs a full update with production defaults if the update mask is empty", async () => {
            const projectId = "project-id";
            const tenant = await (0, helpers_1.registerTenant)(authApi(), projectId, {});
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${projectId}/tenants/${tenant.tenantId}`)
                .set("Authorization", "Bearer owner")
                .send({})
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body.allowPasswordSignup).to.be.false;
                (0, chai_1.expect)(res.body.disableAuth).to.be.false;
                (0, chai_1.expect)(res.body.enableAnonymousUser).to.be.false;
                (0, chai_1.expect)(res.body.enableEmailLinkSignin).to.be.false;
                (0, chai_1.expect)(res.body.mfaConfig).to.eql({
                    enabledProviders: [],
                    state: "DISABLED",
                });
            });
        });
    });
});
//# sourceMappingURL=tenant.spec.js.map