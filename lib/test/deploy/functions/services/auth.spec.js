"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth = require("../../../../deploy/functions/services/auth");
const backend = require("../../../../deploy/functions/backend");
const identityPlatform = require("../../../../gcp/identityPlatform");
const sinon = require("sinon");
const chai_1 = require("chai");
const v1_1 = require("../../../../functions/events/v1");
const BASE_EP = {
    id: "id",
    region: "us-east1",
    project: "project",
    entryPoint: "func",
    runtime: "nodejs16",
};
const authBlockingService = new auth.AuthBlockingService();
describe("authBlocking", () => {
    let getConfig;
    let setConfig;
    beforeEach(() => {
        getConfig = sinon
            .stub(identityPlatform, "getBlockingFunctionsConfig")
            .rejects(new Error("Unexpected call to getBlockingFunctionsConfig"));
        setConfig = sinon
            .stub(identityPlatform, "setBlockingFunctionsConfig")
            .rejects(new Error("Unexpected call to setBlockingFunctionsConfig"));
    });
    afterEach(() => {
        sinon.verifyAndRestore();
    });
    describe("validateBlockingTrigger", () => {
        it("should throw an error if more than one beforeCreate blocking endpoint", () => {
            const ep1 = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", id: "id1", entryPoint: "func1", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                } });
            const ep2 = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", id: "id2", entryPoint: "func2", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                } });
            (0, chai_1.expect)(() => authBlockingService.validateTrigger(ep1, backend.of(ep1, ep2))).to.throw(`Can only create at most one Auth Blocking Trigger for ${v1_1.BEFORE_CREATE_EVENT} events`);
        });
        it("should throw an error if more than one beforeSignIn blocking endpoint", () => {
            const ep1 = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", id: "id1", entryPoint: "func1", blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                } });
            const ep2 = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", id: "id2", entryPoint: "func2", blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                } });
            (0, chai_1.expect)(() => authBlockingService.validateTrigger(ep1, backend.of(ep1, ep2))).to.throw(`Can only create at most one Auth Blocking Trigger for ${v1_1.BEFORE_SIGN_IN_EVENT} events`);
        });
        it("should not throw on valid blocking endpoints", () => {
            const ep1 = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", id: "id1", entryPoint: "func1", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                    },
                } });
            const ep2 = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", id: "id2", entryPoint: "func2", blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                    options: {
                        accessToken: true,
                    },
                } });
            const want = Object.assign({}, backend.of(ep1, ep2));
            (0, chai_1.expect)(() => authBlockingService.validateTrigger(ep1, want)).to.not.throw();
        });
    });
    describe("registerBlockingTrigger", () => {
        it("should handle an empty config", async () => {
            const blockingConfig = {};
            const newBlockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "somethingnew.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: false,
                    idToken: true,
                    refreshToken: false,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                        refreshToken: false,
                    },
                } });
            getConfig.resolves(blockingConfig);
            setConfig.resolves(newBlockingConfig);
            await authBlockingService.registerTrigger(ep);
            (0, chai_1.expect)(setConfig).to.have.been.calledWith("project", newBlockingConfig);
        });
        it("should register on a new beforeCreate endpoint", async () => {
            const blockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "beforecreate.url",
                    },
                    beforeSignIn: {
                        functionUri: "beforesignin.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const newBlockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "somethingnew.url",
                    },
                    beforeSignIn: {
                        functionUri: "beforesignin.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: false,
                    idToken: true,
                    refreshToken: false,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                        refreshToken: false,
                    },
                } });
            getConfig.resolves(blockingConfig);
            setConfig.resolves(newBlockingConfig);
            await authBlockingService.registerTrigger(ep);
            (0, chai_1.expect)(setConfig).to.have.been.calledWith("project", newBlockingConfig);
        });
        it("should register on a new beforeSignIn endpoint", async () => {
            const blockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "beforecreate.url",
                    },
                    beforeSignIn: {
                        functionUri: "beforesignin.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const newBlockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "beforecreate.url",
                    },
                    beforeSignIn: {
                        functionUri: "somethingnew.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: false,
                    idToken: true,
                    refreshToken: false,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                        refreshToken: false,
                    },
                } });
            getConfig.resolves(blockingConfig);
            setConfig.resolves(newBlockingConfig);
            await authBlockingService.registerTrigger(ep);
            (0, chai_1.expect)(setConfig).to.have.been.calledWith("project", newBlockingConfig);
        });
        it("should do not set the config if the config is unchanged", async () => {
            const blockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "somethingnew.url",
                    },
                    beforeSignIn: {
                        functionUri: "beforesignin.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: true,
                    },
                } });
            getConfig.resolves(blockingConfig);
            await authBlockingService.registerTrigger(ep);
            (0, chai_1.expect)(setConfig).to.not.have.been.called;
        });
    });
    describe("unregisterBlockingTrigger", () => {
        it("should not unregister a beforeCreate endpoint if uri does not match", async () => {
            const blockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "beforecreate.url",
                    },
                    beforeSignIn: {
                        functionUri: "beforesignin.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                        refreshToken: false,
                    },
                } });
            getConfig.resolves(blockingConfig);
            await authBlockingService.unregisterTrigger(ep);
            (0, chai_1.expect)(setConfig).to.not.have.been.called;
        });
        it("should not unregister a beforeSignIn endpoint if the uri does not match", async () => {
            const blockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "beforecreate.url",
                    },
                    beforeSignIn: {
                        functionUri: "beforesignin.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                        refreshToken: false,
                    },
                } });
            getConfig.resolves(blockingConfig);
            await authBlockingService.unregisterTrigger(ep);
            (0, chai_1.expect)(setConfig).to.not.have.been.called;
        });
        it("should unregister a beforeCreate endpoint", async () => {
            const blockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "somethingnew.url",
                    },
                    beforeSignIn: {
                        functionUri: "beforesignin.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const newBlockingConfig = {
                triggers: {
                    beforeSignIn: {
                        functionUri: "beforesignin.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_CREATE_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                        refreshToken: false,
                    },
                } });
            getConfig.resolves(blockingConfig);
            setConfig.resolves(newBlockingConfig);
            await authBlockingService.unregisterTrigger(ep);
            (0, chai_1.expect)(setConfig).to.have.been.calledWith("project", newBlockingConfig);
        });
        it("should unregister a beforeSignIn endpoint", async () => {
            const blockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "beforecreate.url",
                    },
                    beforeSignIn: {
                        functionUri: "somethingnew.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const newBlockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "beforecreate.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                        refreshToken: false,
                    },
                } });
            getConfig.resolves(blockingConfig);
            setConfig.resolves(newBlockingConfig);
            await authBlockingService.unregisterTrigger(ep);
            (0, chai_1.expect)(setConfig).to.have.been.calledWith("project", newBlockingConfig);
        });
        it("should unregister a beforeSignIn endpoint that was registered to both event types", async () => {
            const blockingConfig = {
                triggers: {
                    beforeCreate: {
                        functionUri: "somethingnew.url",
                    },
                    beforeSignIn: {
                        functionUri: "somethingnew.url",
                    },
                },
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const newBlockingConfig = {
                triggers: {},
                forwardInboundCredentials: {
                    accessToken: true,
                },
            };
            const ep = Object.assign(Object.assign({}, BASE_EP), { platform: "gcfv1", uri: "somethingnew.url", blockingTrigger: {
                    eventType: v1_1.BEFORE_SIGN_IN_EVENT,
                    options: {
                        accessToken: false,
                        idToken: true,
                        refreshToken: false,
                    },
                } });
            getConfig.resolves(blockingConfig);
            setConfig.resolves(newBlockingConfig);
            await authBlockingService.unregisterTrigger(ep);
            (0, chai_1.expect)(setConfig).to.have.been.calledWith("project", newBlockingConfig);
        });
    });
});
//# sourceMappingURL=auth.spec.js.map