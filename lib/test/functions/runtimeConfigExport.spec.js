"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const configExport = require("../../../src/functions/runtimeConfigExport");
const env = require("../../../src/functions/env");
const sinon = require("sinon");
const rc = require("../../rc");
describe("functions-config-export", () => {
    describe("getAllProjects", () => {
        let loadRCStub;
        beforeEach(() => {
            loadRCStub = sinon.stub(rc, "loadRC").returns({});
        });
        afterEach(() => {
            loadRCStub.restore();
        });
        it("should include projectId from the options", () => {
            (0, chai_1.expect)(configExport.getProjectInfos({ projectId: "project-0" })).to.have.deep.members([
                {
                    projectId: "project-0",
                },
            ]);
        });
        it("should include project and its alias from firebaserc", () => {
            loadRCStub.returns({ projects: { dev: "project-0", prod: "project-1" } });
            (0, chai_1.expect)(configExport.getProjectInfos({ projectId: "project-0" })).to.have.deep.members([
                {
                    projectId: "project-0",
                    alias: "dev",
                },
                {
                    projectId: "project-1",
                    alias: "prod",
                },
            ]);
        });
    });
    describe("convertKey", () => {
        it("should converts valid config key", () => {
            (0, chai_1.expect)(configExport.convertKey("service.api.url", "")).to.be.equal("SERVICE_API_URL");
            (0, chai_1.expect)(configExport.convertKey("foo-bar.car", "")).to.be.equal("FOO_BAR_CAR");
        });
        it("should throw error if conversion is invalid", () => {
            (0, chai_1.expect)(() => {
                configExport.convertKey("1.api.url", "");
            }).to.throw();
            (0, chai_1.expect)(() => {
                configExport.convertKey("x.google.env", "");
            }).to.throw();
            (0, chai_1.expect)(() => {
                configExport.convertKey("k.service", "");
            }).to.throw();
        });
        it("should use prefix to fix invalid config keys", () => {
            (0, chai_1.expect)(configExport.convertKey("1.api.url", "CONFIG_")).to.equal("CONFIG_1_API_URL");
            (0, chai_1.expect)(configExport.convertKey("x.google.env", "CONFIG_")).to.equal("CONFIG_X_GOOGLE_ENV");
            (0, chai_1.expect)(configExport.convertKey("k.service", "CONFIG_")).to.equal("CONFIG_K_SERVICE");
        });
        it("should throw error if prefix is invalid", () => {
            (0, chai_1.expect)(() => {
                configExport.convertKey("1.api.url", "X_GOOGLE_");
            }).to.throw();
            (0, chai_1.expect)(() => {
                configExport.convertKey("x.google.env", "FIREBASE_");
            }).to.throw();
            (0, chai_1.expect)(() => {
                configExport.convertKey("k.service", "123_");
            }).to.throw();
        });
    });
    describe("configToEnv", () => {
        it("should convert valid functions config ", () => {
            const { success, errors } = configExport.configToEnv({ foo: { bar: "foobar" }, service: { api: { url: "foobar", name: "a service" } } }, "");
            (0, chai_1.expect)(success).to.have.deep.members([
                { origKey: "service.api.url", newKey: "SERVICE_API_URL", value: "foobar" },
                { origKey: "service.api.name", newKey: "SERVICE_API_NAME", value: "a service" },
                { origKey: "foo.bar", newKey: "FOO_BAR", value: "foobar" },
            ]);
            (0, chai_1.expect)(errors).to.be.empty;
        });
        it("should collect errors for invalid conversions", () => {
            const { success, errors } = configExport.configToEnv({ firebase: { name: "foobar" }, service: { api: { url: "foobar", name: "a service" } } }, "");
            (0, chai_1.expect)(success).to.have.deep.members([
                { origKey: "service.api.url", newKey: "SERVICE_API_URL", value: "foobar" },
                { origKey: "service.api.name", newKey: "SERVICE_API_NAME", value: "a service" },
            ]);
            (0, chai_1.expect)(errors).to.not.be.empty;
        });
        it("should use prefix to fix invalid keys", () => {
            const { success, errors } = configExport.configToEnv({ firebase: { name: "foobar" }, service: { api: { url: "foobar", name: "a service" } } }, "CONFIG_");
            (0, chai_1.expect)(success).to.have.deep.members([
                { origKey: "service.api.url", newKey: "SERVICE_API_URL", value: "foobar" },
                { origKey: "service.api.name", newKey: "SERVICE_API_NAME", value: "a service" },
                { origKey: "firebase.name", newKey: "CONFIG_FIREBASE_NAME", value: "foobar" },
            ]);
            (0, chai_1.expect)(errors).to.be.empty;
        });
    });
    describe("toDotenvFormat", () => {
        it("should produce valid dotenv file with keys", () => {
            const dotenv = configExport.toDotenvFormat([
                { origKey: "service.api.url", newKey: "SERVICE_API_URL", value: "hello" },
                { origKey: "service.api.name", newKey: "SERVICE_API_NAME", value: "world" },
            ]);
            const { envs, errors } = env.parse(dotenv);
            (0, chai_1.expect)(envs).to.be.deep.equal({
                SERVICE_API_URL: "hello",
                SERVICE_API_NAME: "world",
            });
            (0, chai_1.expect)(errors).to.be.empty;
        });
        it("should preserve newline characters", () => {
            const dotenv = configExport.toDotenvFormat([
                { origKey: "service.api.url", newKey: "SERVICE_API_URL", value: "hello\nthere\nworld" },
            ]);
            const { envs, errors } = env.parse(dotenv);
            (0, chai_1.expect)(envs).to.be.deep.equal({
                SERVICE_API_URL: "hello\nthere\nworld",
            });
            (0, chai_1.expect)(errors).to.be.empty;
        });
    });
    describe("generateDotenvFilename", () => {
        it("should generate dotenv filename using project alias", () => {
            (0, chai_1.expect)(configExport.generateDotenvFilename({ projectId: "my-project", alias: "prod" })).to.equal(".env.prod");
        });
        it("should generate dotenv filename using project id if alias doesn't exist", () => {
            (0, chai_1.expect)(configExport.generateDotenvFilename({ projectId: "my-project" })).to.equal(".env.my-project");
        });
    });
});
//# sourceMappingURL=runtimeConfigExport.spec.js.map