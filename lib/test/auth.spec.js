"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const auth_1 = require("../auth");
const configstore_1 = require("../configstore");
describe("auth", () => {
    const sandbox = sinon.createSandbox();
    let fakeConfigStore = {};
    beforeEach(() => {
        const configstoreGetStub = sandbox.stub(configstore_1.configstore, "get");
        configstoreGetStub.callsFake((key) => {
            return fakeConfigStore[key];
        });
        const configstoreSetStub = sandbox.stub(configstore_1.configstore, "set");
        configstoreSetStub.callsFake((...values) => {
            fakeConfigStore[values[0]] = values[1];
        });
        const configstoreDeleteStub = sandbox.stub(configstore_1.configstore, "delete");
        configstoreDeleteStub.callsFake((key) => {
            delete fakeConfigStore[key];
        });
    });
    afterEach(() => {
        fakeConfigStore = {};
        sandbox.restore();
    });
    describe("no accounts", () => {
        it("returns no global account when config is empty", () => {
            const account = (0, auth_1.getGlobalDefaultAccount)();
            (0, chai_1.expect)(account).to.be.undefined;
        });
    });
    describe("single account", () => {
        const defaultAccount = {
            user: {
                email: "test@test.com",
            },
            tokens: {
                access_token: "abc1234",
            },
        };
        beforeEach(() => {
            configstore_1.configstore.set("user", defaultAccount.user);
            configstore_1.configstore.set("tokens", defaultAccount.tokens);
        });
        it("returns global default account", () => {
            const account = (0, auth_1.getGlobalDefaultAccount)();
            (0, chai_1.expect)(account).to.deep.equal(defaultAccount);
        });
        it("returns no additional accounts", () => {
            const additional = (0, auth_1.getAdditionalAccounts)();
            (0, chai_1.expect)(additional.length).to.equal(0);
        });
        it("returns exactly one total account", () => {
            const all = (0, auth_1.getAllAccounts)();
            (0, chai_1.expect)(all.length).to.equal(1);
            (0, chai_1.expect)(all[0]).to.deep.equal(defaultAccount);
        });
    });
    describe("multi account", () => {
        const defaultAccount = {
            user: {
                email: "test@test.com",
            },
            tokens: {
                access_token: "abc1234",
            },
        };
        const additionalUser1 = {
            user: {
                email: "test1@test.com",
            },
            tokens: {
                access_token: "token1",
            },
        };
        const additionalUser2 = {
            user: {
                email: "test2@test.com",
            },
            tokens: {
                access_token: "token2",
            },
        };
        const additionalAccounts = [additionalUser1, additionalUser2];
        const activeAccounts = {
            "/path/project1": "test1@test.com",
        };
        beforeEach(() => {
            configstore_1.configstore.set("user", defaultAccount.user);
            configstore_1.configstore.set("tokens", defaultAccount.tokens);
            configstore_1.configstore.set("additionalAccounts", additionalAccounts);
            configstore_1.configstore.set("activeAccounts", activeAccounts);
        });
        it("returns global default account", () => {
            const account = (0, auth_1.getGlobalDefaultAccount)();
            (0, chai_1.expect)(account).to.deep.equal(defaultAccount);
        });
        it("returns additional accounts", () => {
            const additional = (0, auth_1.getAdditionalAccounts)();
            (0, chai_1.expect)(additional).to.deep.equal(additionalAccounts);
        });
        it("returns all accounts", () => {
            const all = (0, auth_1.getAllAccounts)();
            (0, chai_1.expect)(all).to.deep.equal([defaultAccount, ...additionalAccounts]);
        });
        it("respects project default when present", () => {
            const account = (0, auth_1.getProjectDefaultAccount)("/path/project1");
            (0, chai_1.expect)(account).to.deep.equal(additionalUser1);
        });
        it("ignores project default when not present", () => {
            const account = (0, auth_1.getProjectDefaultAccount)("/path/project2");
            (0, chai_1.expect)(account).to.deep.equal(defaultAccount);
        });
        it("prefers account flag to project root", () => {
            const account = (0, auth_1.selectAccount)("test2@test.com", "/path/project1");
            (0, chai_1.expect)(account).to.deep.equal(additionalUser2);
        });
    });
});
//# sourceMappingURL=auth.spec.js.map