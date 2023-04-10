"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const helpers_1 = require("./helpers");
const setup_1 = require("./setup");
(0, setup_1.describeAuthEmulator)("config management", ({ authApi }) => {
    describe("updateConfig", () => {
        it("updates the project level config", async () => {
            const updateMask = "signIn.allowDuplicateEmails,blockingFunctions.forwardInboundCredentials.idToken";
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .query({ updateMask })
                .send({
                signIn: { allowDuplicateEmails: true },
                blockingFunctions: { forwardInboundCredentials: { idToken: true } },
            })
                .then((res) => {
                var _a;
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)((_a = res.body.signIn) === null || _a === void 0 ? void 0 : _a.allowDuplicateEmails).to.be.true;
                (0, chai_1.expect)(res.body.blockingFunctions).to.eql({
                    forwardInboundCredentials: { idToken: true },
                });
            });
        });
        it("does not update if the field does not exist on the update config", async () => {
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .query({ updateMask: "displayName" })
                .send({})
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).not.to.have.property("displayName");
            });
        });
        it("performs a full update if the update mask is empty", async () => {
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .send({
                signIn: { allowDuplicateEmails: true },
                blockingFunctions: { forwardInboundCredentials: { idToken: true } },
            })
                .then((res) => {
                var _a;
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)((_a = res.body.signIn) === null || _a === void 0 ? void 0 : _a.allowDuplicateEmails).to.be.true;
                (0, chai_1.expect)(res.body.blockingFunctions).to.eql({
                    forwardInboundCredentials: { idToken: true },
                });
            });
        });
        it("performs a full update with production defaults if the update mask is empty", async () => {
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .send({
                signIn: { allowDuplicateEmails: true },
                blockingFunctions: { forwardInboundCredentials: { idToken: true } },
            })
                .then((res) => {
                var _a;
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)((_a = res.body.signIn) === null || _a === void 0 ? void 0 : _a.allowDuplicateEmails).to.be.true;
                (0, chai_1.expect)(res.body.blockingFunctions).to.eql({
                    forwardInboundCredentials: { idToken: true },
                });
            });
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .send({})
                .then((res) => {
                var _a;
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)((_a = res.body.signIn) === null || _a === void 0 ? void 0 : _a.allowDuplicateEmails).to.be.false;
                (0, chai_1.expect)(res.body.blockingFunctions).to.eql({});
            });
        });
        it("should error when updating an invalid blocking function event", async () => {
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .send({
                blockingFunctions: {
                    triggers: {
                        invalidEventTrigger: {
                            functionUri: "http://localhost",
                        },
                    },
                },
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(400, res);
                (0, chai_1.expect)(res.body.error).to.have.property("message").contains("INVALID_BLOCKING_FUNCTION");
            });
        });
        it("should error if functionUri is invalid", async () => {
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .send({
                blockingFunctions: {
                    triggers: {
                        beforeCreate: {
                            functionUri: "invalidUri",
                        },
                    },
                },
            })
                .then((res) => {
                (0, helpers_1.expectStatusCode)(400, res);
                (0, chai_1.expect)(res.body.error).to.have.property("message").contains("INVALID_BLOCKING_FUNCTION");
            });
        });
    });
    describe("getConfig", () => {
        it("should return the project level config", async () => {
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .send()
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.have.property("signIn").eql({
                    allowDuplicateEmails: false,
                });
                (0, chai_1.expect)(res.body).to.have.property("blockingFunctions").eql({});
            });
        });
        it("should return updated config fields", async () => {
            await authApi()
                .patch(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .send({
                signIn: { allowDuplicateEmails: true },
                blockingFunctions: { forwardInboundCredentials: { idToken: true } },
            });
            await authApi()
                .get(`/identitytoolkit.googleapis.com/v2/projects/${setup_1.PROJECT_ID}/config`)
                .set("Authorization", "Bearer owner")
                .send()
                .then((res) => {
                (0, helpers_1.expectStatusCode)(200, res);
                (0, chai_1.expect)(res.body).to.have.property("signIn").eql({
                    allowDuplicateEmails: true,
                });
                (0, chai_1.expect)(res.body)
                    .to.have.property("blockingFunctions")
                    .eql({
                    forwardInboundCredentials: { idToken: true },
                });
            });
        });
    });
});
//# sourceMappingURL=config.spec.js.map