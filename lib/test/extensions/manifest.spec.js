"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const manifest = require("../../extensions/manifest");
const paramHelper = require("../../extensions/paramHelper");
const refs = require("../../extensions/refs");
const config_1 = require("../../config");
const prompt = require("../../prompt");
const error_1 = require("../../error");
const types_1 = require("../../extensions/types");
function generateBaseConfig() {
    return new config_1.Config({
        extensions: {
            "delete-user-data": "firebase/delete-user-data@0.1.12",
            "delete-user-data-gm2h": "firebase/delete-user-data@0.1.12",
        },
    }, {});
}
function generateConfigWithLocal() {
    return new config_1.Config({
        extensions: {
            "delete-user-data": "firebase/delete-user-data@0.1.12",
            "delete-user-data-gm2h": "firebase/delete-user-data@0.1.12",
            "delete-user-data-local": "./delete-user-data",
        },
    }, {});
}
describe("manifest", () => {
    const sandbox = sinon.createSandbox();
    describe(`${manifest.instanceExists.name}`, () => {
        it("should return true for an existing instance", () => {
            const result = manifest.instanceExists("delete-user-data", generateBaseConfig());
            (0, chai_1.expect)(result).to.be.true;
        });
        it("should return false for a non-existing instance", () => {
            const result = manifest.instanceExists("does-not-exist", generateBaseConfig());
            (0, chai_1.expect)(result).to.be.false;
        });
    });
    describe(`${manifest.getInstanceTarget.name}`, () => {
        it("should return the correct source for a local instance", () => {
            const result = manifest.getInstanceTarget("delete-user-data-local", generateConfigWithLocal());
            (0, chai_1.expect)(result).to.equal("./delete-user-data");
        });
        it("should return the correct source for an instance with ref", () => {
            const result = manifest.getInstanceTarget("delete-user-data", generateConfigWithLocal());
            (0, chai_1.expect)(result).to.equal("firebase/delete-user-data@0.1.12");
        });
        it("should throw when looking for a non-existing instance", () => {
            (0, chai_1.expect)(() => manifest.getInstanceTarget("does-not-exist", generateConfigWithLocal())).to.throw(error_1.FirebaseError);
        });
    });
    describe(`${manifest.getInstanceRef.name}`, () => {
        it("should return the correct ref for an existing instance", () => {
            const result = manifest.getInstanceRef("delete-user-data", generateConfigWithLocal());
            (0, chai_1.expect)(refs.toExtensionVersionRef(result)).to.equal(refs.toExtensionVersionRef({
                publisherId: "firebase",
                extensionId: "delete-user-data",
                version: "0.1.12",
            }));
        });
        it("should throw when looking for a non-existing instance", () => {
            (0, chai_1.expect)(() => manifest.getInstanceRef("does-not-exist", generateConfigWithLocal())).to.throw(error_1.FirebaseError);
        });
        it("should throw when looking for a instance with local source", () => {
            (0, chai_1.expect)(() => manifest.getInstanceRef("delete-user-data-local", generateConfigWithLocal())).to.throw(error_1.FirebaseError);
        });
    });
    describe(`${manifest.removeFromManifest.name}`, () => {
        let deleteProjectFileStub;
        let writeProjectFileStub;
        let projectFileExistsStub;
        beforeEach(() => {
            deleteProjectFileStub = sandbox.stub(config_1.Config.prototype, "deleteProjectFile");
            writeProjectFileStub = sandbox.stub(config_1.Config.prototype, "writeProjectFile");
            projectFileExistsStub = sandbox.stub(config_1.Config.prototype, "projectFileExists");
            projectFileExistsStub.returns(true);
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should remove from firebase.json and remove .env file", () => {
            manifest.removeFromManifest("delete-user-data", generateBaseConfig());
            (0, chai_1.expect)(writeProjectFileStub).calledWithExactly("firebase.json", {
                extensions: {
                    "delete-user-data": undefined,
                    "delete-user-data-gm2h": "firebase/delete-user-data@0.1.12",
                },
            });
            (0, chai_1.expect)(deleteProjectFileStub).calledWithExactly("extensions/delete-user-data.env");
        });
    });
    describe(`${manifest.writeToManifest.name}`, () => {
        let askWriteProjectFileStub;
        let writeProjectFileStub;
        beforeEach(() => {
            askWriteProjectFileStub = sandbox.stub(config_1.Config.prototype, "askWriteProjectFile");
            writeProjectFileStub = sandbox.stub(config_1.Config.prototype, "writeProjectFile");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should write to both firebase.json and env files", async () => {
            await manifest.writeToManifest([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: { a: { baseValue: "pikachu" }, b: { baseValue: "bulbasaur" } },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
                {
                    instanceId: "instance-2",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "2.0.0",
                    },
                    params: { a: { baseValue: "eevee" }, b: { baseValue: "squirtle" } },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), { nonInteractive: false, force: false });
            (0, chai_1.expect)(writeProjectFileStub).calledWithExactly("firebase.json", {
                extensions: {
                    "delete-user-data": "firebase/delete-user-data@0.1.12",
                    "delete-user-data-gm2h": "firebase/delete-user-data@0.1.12",
                    "instance-1": "firebase/bigquery-export@1.0.0",
                    "instance-2": "firebase/bigquery-export@2.0.0",
                },
            });
            (0, chai_1.expect)(askWriteProjectFileStub).to.have.been.calledTwice;
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-1.env", `a=pikachu\nb=bulbasaur`, false);
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-2.env", `a=eevee\nb=squirtle`, false);
        });
        it("should write to env files in stable, alphabetical by key order", async () => {
            await manifest.writeToManifest([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: { b: { baseValue: "bulbasaur" }, a: { baseValue: "absol" } },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
                {
                    instanceId: "instance-2",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "2.0.0",
                    },
                    params: { e: { baseValue: "eevee" }, s: { baseValue: "squirtle" } },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), { nonInteractive: false, force: false });
            (0, chai_1.expect)(writeProjectFileStub).calledWithExactly("firebase.json", {
                extensions: {
                    "delete-user-data": "firebase/delete-user-data@0.1.12",
                    "delete-user-data-gm2h": "firebase/delete-user-data@0.1.12",
                    "instance-1": "firebase/bigquery-export@1.0.0",
                    "instance-2": "firebase/bigquery-export@2.0.0",
                },
            });
            (0, chai_1.expect)(askWriteProjectFileStub).to.have.been.calledTwice;
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-1.env", `a=absol\nb=bulbasaur`, false);
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-2.env", `e=eevee\ns=squirtle`, false);
        });
        it("should write events-related env vars", async () => {
            await manifest.writeToManifest([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: {
                        b: { baseValue: "bulbasaur" },
                        a: { baseValue: "absol" },
                        EVENTARC_CHANNEL: {
                            baseValue: "projects/test-project/locations/us-central1/channels/firebase",
                        },
                        ALLOWED_EVENT_TYPES: { baseValue: "google.firebase.custom-event-occurred" },
                    },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        events: [
                            {
                                type: "google.firebase.custom-event-occurred",
                                description: "Custom event occurred",
                            },
                        ],
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
                {
                    instanceId: "instance-2",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "2.0.0",
                    },
                    params: {
                        e: { baseValue: "eevee" },
                        s: { baseValue: "squirtle" },
                        EVENTARC_CHANNEL: {
                            baseValue: "projects/test-project/locations/us-central1/channels/firebase",
                        },
                        ALLOWED_EVENT_TYPES: { baseValue: "google.firebase.custom-event-occurred" },
                    },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "2.0.0",
                        resources: [],
                        sourceUrl: "",
                        events: [
                            {
                                type: "google.firebase.custom-event-occurred",
                                description: "Custom event occurred",
                            },
                        ],
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), { nonInteractive: false, force: false });
            (0, chai_1.expect)(writeProjectFileStub).calledWithExactly("firebase.json", {
                extensions: {
                    "delete-user-data": "firebase/delete-user-data@0.1.12",
                    "delete-user-data-gm2h": "firebase/delete-user-data@0.1.12",
                    "instance-1": "firebase/bigquery-export@1.0.0",
                    "instance-2": "firebase/bigquery-export@2.0.0",
                },
            });
            (0, chai_1.expect)(askWriteProjectFileStub).to.have.been.calledTwice;
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-1.env", "a=absol\n" +
                "ALLOWED_EVENT_TYPES=google.firebase.custom-event-occurred\n" +
                "b=bulbasaur\n" +
                "EVENTARC_CHANNEL=projects/test-project/locations/us-central1/channels/firebase", false);
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-2.env", "ALLOWED_EVENT_TYPES=google.firebase.custom-event-occurred\n" +
                "e=eevee\n" +
                "EVENTARC_CHANNEL=projects/test-project/locations/us-central1/channels/firebase\n" +
                "s=squirtle", false);
        });
        it("should overwrite when user chooses to", async () => {
            sandbox.stub(prompt, "promptOnce").resolves(true);
            await manifest.writeToManifest([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: { a: { baseValue: "pikachu" }, b: { baseValue: "bulbasaur" } },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
                {
                    instanceId: "instance-2",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "2.0.0",
                    },
                    params: { a: { baseValue: "eevee" }, b: { baseValue: "squirtle" } },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), { nonInteractive: false, force: false }, true);
            (0, chai_1.expect)(writeProjectFileStub).calledWithExactly("firebase.json", {
                extensions: {
                    "instance-1": "firebase/bigquery-export@1.0.0",
                    "instance-2": "firebase/bigquery-export@2.0.0",
                },
            });
            (0, chai_1.expect)(askWriteProjectFileStub).to.have.been.calledTwice;
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-1.env", `a=pikachu\nb=bulbasaur`, false);
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-2.env", `a=eevee\nb=squirtle`, false);
        });
        it("should not write empty values", async () => {
            sandbox.stub(prompt, "promptOnce").resolves(true);
            await manifest.writeToManifest([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: { a: { baseValue: "pikachu" }, b: { baseValue: "" } },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), { nonInteractive: false, force: false }, true);
            (0, chai_1.expect)(writeProjectFileStub).calledWithExactly("firebase.json", {
                extensions: {
                    "instance-1": "firebase/bigquery-export@1.0.0",
                },
            });
            (0, chai_1.expect)(askWriteProjectFileStub).to.have.been.calledOnce;
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-1.env", `a=pikachu`, false);
        });
    });
    describe(`${manifest.writeLocalSecrets.name}`, () => {
        let askWriteProjectFileStub;
        beforeEach(() => {
            askWriteProjectFileStub = sandbox.stub(config_1.Config.prototype, "askWriteProjectFile");
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should write all secret params that have local values", async () => {
            await manifest.writeLocalSecrets([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: {
                        a: { baseValue: "base", local: "pikachu" },
                        b: { baseValue: "base", local: "bulbasaur" },
                    },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                        ],
                        systemParams: [],
                    },
                },
                {
                    instanceId: "instance-2",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "2.0.0",
                    },
                    params: {
                        a: { baseValue: "base", local: "eevee" },
                        b: { baseValue: "base", local: "squirtle" },
                    },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), true);
            (0, chai_1.expect)(askWriteProjectFileStub).to.have.been.calledTwice;
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-1.secret.local", `a=pikachu\nb=bulbasaur`, true);
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-2.secret.local", `a=eevee\nb=squirtle`, true);
        });
        it("should write only secret with local values", async () => {
            await manifest.writeLocalSecrets([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: {
                        a: { baseValue: "base", local: "pikachu" },
                        b: { baseValue: "base" },
                    },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), true);
            (0, chai_1.expect)(askWriteProjectFileStub).to.have.been.calledOnce;
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-1.secret.local", `a=pikachu`, true);
        });
        it("should write only local values that are ParamType.SECRET", async () => {
            await manifest.writeLocalSecrets([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: {
                        a: { baseValue: "base", local: "pikachu" },
                        b: { baseValue: "base", local: "bulbasaur" },
                    },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), true);
            (0, chai_1.expect)(askWriteProjectFileStub).to.have.been.calledOnce;
            (0, chai_1.expect)(askWriteProjectFileStub).calledWithExactly("extensions/instance-1.secret.local", `a=pikachu`, true);
        });
        it("should not write the file if there's no matching params", async () => {
            await manifest.writeLocalSecrets([
                {
                    instanceId: "instance-1",
                    ref: {
                        publisherId: "firebase",
                        extensionId: "bigquery-export",
                        version: "1.0.0",
                    },
                    params: {
                        a: { baseValue: "base" },
                        b: { baseValue: "base" },
                    },
                    extensionSpec: {
                        name: "bigquery-export",
                        version: "1.0.0",
                        resources: [],
                        sourceUrl: "",
                        params: [
                            {
                                param: "a",
                                label: "",
                                type: types_1.ParamType.SECRET,
                            },
                            {
                                param: "b",
                                label: "",
                                type: types_1.ParamType.STRING,
                            },
                        ],
                        systemParams: [],
                    },
                },
            ], generateBaseConfig(), true);
            (0, chai_1.expect)(askWriteProjectFileStub).to.not.have.been.called;
        });
    });
    describe("readParams", () => {
        let readEnvFileStub;
        const testProjectDir = "test";
        const testProjectId = "my-project";
        const testProjectNumber = "123456";
        const testInstanceId = "extensionId";
        beforeEach(() => {
            readEnvFileStub = sinon.stub(paramHelper, "readEnvFile").returns({});
        });
        afterEach(() => {
            readEnvFileStub.restore();
        });
        it("should read from generic .env file", () => {
            readEnvFileStub
                .withArgs("test/extensions/extensionId.env")
                .returns({ param: "otherValue", param2: "value2" });
            (0, chai_1.expect)(manifest.readInstanceParam({
                projectDir: testProjectDir,
                instanceId: testInstanceId,
                projectId: testProjectId,
                projectNumber: testProjectNumber,
                aliases: [],
            })).to.deep.equal({ param: "otherValue", param2: "value2" });
        });
        it("should read from project id .env file", () => {
            readEnvFileStub
                .withArgs("test/extensions/extensionId.env.my-project")
                .returns({ param: "otherValue", param2: "value2" });
            (0, chai_1.expect)(manifest.readInstanceParam({
                projectDir: testProjectDir,
                instanceId: testInstanceId,
                projectId: testProjectId,
                projectNumber: testProjectNumber,
                aliases: [],
            })).to.deep.equal({ param: "otherValue", param2: "value2" });
        });
        it("should read from project number .env file", () => {
            readEnvFileStub
                .withArgs("test/extensions/extensionId.env.123456")
                .returns({ param: "otherValue", param2: "value2" });
            (0, chai_1.expect)(manifest.readInstanceParam({
                projectDir: testProjectDir,
                instanceId: testInstanceId,
                projectId: testProjectId,
                projectNumber: testProjectNumber,
                aliases: [],
            })).to.deep.equal({ param: "otherValue", param2: "value2" });
        });
        it("should read from an alias .env file", () => {
            readEnvFileStub
                .withArgs("test/extensions/extensionId.env.prod")
                .returns({ param: "otherValue", param2: "value2" });
            (0, chai_1.expect)(manifest.readInstanceParam({
                projectDir: testProjectDir,
                instanceId: testInstanceId,
                projectId: testProjectId,
                projectNumber: testProjectNumber,
                aliases: ["prod"],
            })).to.deep.equal({ param: "otherValue", param2: "value2" });
        });
        it("should prefer values from project specific env files", () => {
            readEnvFileStub
                .withArgs("test/extensions/extensionId.env.my-project")
                .returns({ param: "value" });
            readEnvFileStub
                .withArgs("test/extensions/extensionId.env")
                .returns({ param: "otherValue", param2: "value2" });
            (0, chai_1.expect)(manifest.readInstanceParam({
                projectDir: testProjectDir,
                instanceId: testInstanceId,
                projectId: testProjectId,
                projectNumber: testProjectNumber,
                aliases: [],
            })).to.deep.equal({ param: "value", param2: "value2" });
        });
    });
});
//# sourceMappingURL=manifest.spec.js.map