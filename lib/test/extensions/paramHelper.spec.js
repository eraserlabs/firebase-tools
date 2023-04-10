"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs-extra");
const error_1 = require("../../error");
const types_1 = require("../../extensions/types");
const extensionsHelper = require("../../extensions/extensionsHelper");
const paramHelper = require("../../extensions/paramHelper");
const prompt = require("../../prompt");
const utils_1 = require("../../utils");
const PROJECT_ID = "test-proj";
const INSTANCE_ID = "ext-instance";
const TEST_PARAMS = [
    {
        param: "A_PARAMETER",
        label: "Param",
        type: types_1.ParamType.STRING,
        required: true,
    },
    {
        param: "ANOTHER_PARAMETER",
        label: "Another Param",
        default: "default",
        type: types_1.ParamType.STRING,
        required: true,
    },
];
const TEST_PARAMS_2 = [
    {
        param: "ANOTHER_PARAMETER",
        label: "Another Param",
        type: types_1.ParamType.STRING,
        default: "default",
    },
    {
        param: "NEW_PARAMETER",
        label: "New Param",
        type: types_1.ParamType.STRING,
        default: "${PROJECT_ID}",
    },
    {
        param: "THIRD_PARAMETER",
        label: "3",
        type: types_1.ParamType.STRING,
        default: "default",
    },
];
const TEST_PARAMS_3 = [
    {
        param: "A_PARAMETER",
        label: "Param",
        type: types_1.ParamType.STRING,
    },
    {
        param: "ANOTHER_PARAMETER",
        label: "Another Param",
        default: "default",
        type: types_1.ParamType.STRING,
        description: "Something new",
        required: false,
    },
];
const SPEC = {
    name: "test",
    version: "0.1.0",
    roles: [],
    resources: [],
    sourceUrl: "test.com",
    params: TEST_PARAMS,
    systemParams: [],
};
describe("paramHelper", () => {
    describe(`${paramHelper.getBaseParamBindings.name}`, () => {
        it("should extract the baseValue param bindings", () => {
            const input = {
                pokeball: {
                    baseValue: "pikachu",
                    local: "local",
                },
                greatball: {
                    baseValue: "eevee",
                },
            };
            const output = paramHelper.getBaseParamBindings(input);
            (0, chai_1.expect)(output).to.eql({
                pokeball: "pikachu",
                greatball: "eevee",
            });
        });
    });
    describe(`${paramHelper.buildBindingOptionsWithBaseValue.name}`, () => {
        it("should build given baseValue values", () => {
            const input = {
                pokeball: "pikachu",
                greatball: "eevee",
            };
            const output = paramHelper.buildBindingOptionsWithBaseValue(input);
            (0, chai_1.expect)(output).to.eql({
                pokeball: {
                    baseValue: "pikachu",
                },
                greatball: {
                    baseValue: "eevee",
                },
            });
        });
    });
    describe("getParams", () => {
        let promptStub;
        beforeEach(() => {
            sinon.stub(fs, "readFileSync").returns("");
            sinon.stub(extensionsHelper, "getFirebaseProjectParams").resolves({ PROJECT_ID });
            promptStub = sinon.stub(prompt, "promptOnce").resolves("user input");
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should prompt the user for params", async () => {
            const params = await paramHelper.getParams({
                projectId: PROJECT_ID,
                paramSpecs: TEST_PARAMS,
                instanceId: INSTANCE_ID,
            });
            (0, chai_1.expect)(params).to.eql({
                A_PARAMETER: { baseValue: "user input" },
                ANOTHER_PARAMETER: { baseValue: "user input" },
            });
            (0, chai_1.expect)(promptStub).to.have.been.calledTwice;
            (0, chai_1.expect)(promptStub.firstCall.args[0]).to.eql({
                default: undefined,
                message: "Enter a value for Param:",
                name: "A_PARAMETER",
                type: "input",
            });
            (0, chai_1.expect)(promptStub.secondCall.args[0]).to.eql({
                default: "default",
                message: "Enter a value for Another Param:",
                name: "ANOTHER_PARAMETER",
                type: "input",
            });
        });
    });
    describe("getParamsWithCurrentValuesAsDefaults", () => {
        let params;
        let testInstance;
        beforeEach(() => {
            params = { A_PARAMETER: "new default" };
            testInstance = {
                config: {
                    source: {
                        state: "ACTIVE",
                        name: "",
                        packageUri: "",
                        hash: "",
                        spec: {
                            name: "",
                            version: "0.1.0",
                            roles: [],
                            resources: [],
                            params: [...TEST_PARAMS],
                            systemParams: [],
                            sourceUrl: "",
                        },
                    },
                    name: "test",
                    createTime: "now",
                    params,
                    systemParams: {},
                },
                name: "test",
                createTime: "now",
                updateTime: "now",
                state: "ACTIVE",
                serviceAccountEmail: "test@test.com",
            };
            it("should add defaults to params without them using the current state and leave other values unchanged", () => {
                const newParams = paramHelper.getParamsWithCurrentValuesAsDefaults(testInstance);
                (0, chai_1.expect)(newParams).to.eql([
                    {
                        param: "A_PARAMETER",
                        label: "Param",
                        default: "new default",
                        type: types_1.ParamType.STRING,
                        required: true,
                    },
                    {
                        param: "ANOTHER_PARAMETER",
                        label: "Another",
                        default: "default",
                        type: types_1.ParamType.STRING,
                    },
                ]);
            });
        });
        it("should change existing defaults to the current state and leave other values unchanged", () => {
            var _a, _b, _c;
            (((_c = (_b = (_a = testInstance.config) === null || _a === void 0 ? void 0 : _a.source) === null || _b === void 0 ? void 0 : _b.spec) === null || _c === void 0 ? void 0 : _c.params) || []).push({
                param: "THIRD",
                label: "3rd",
                default: "default",
                type: types_1.ParamType.STRING,
            });
            testInstance.config.params.THIRD = "New Default";
            const newParams = paramHelper.getParamsWithCurrentValuesAsDefaults(testInstance);
            (0, chai_1.expect)(newParams).to.eql([
                {
                    param: "A_PARAMETER",
                    label: "Param",
                    default: "new default",
                    type: types_1.ParamType.STRING,
                    required: true,
                },
                {
                    param: "ANOTHER_PARAMETER",
                    label: "Another Param",
                    default: "default",
                    required: true,
                    type: types_1.ParamType.STRING,
                },
                {
                    param: "THIRD",
                    label: "3rd",
                    default: "New Default",
                    type: types_1.ParamType.STRING,
                },
            ]);
        });
    });
    describe("promptForNewParams", () => {
        let promptStub;
        beforeEach(() => {
            promptStub = sinon.stub(prompt, "promptOnce");
            sinon.stub(extensionsHelper, "getFirebaseProjectParams").resolves({ PROJECT_ID });
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should prompt the user for any params in the new spec that are not in the current one", async () => {
            promptStub.resolves("user input");
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_2;
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "value" },
                NEW_PARAMETER: { baseValue: "user input" },
                THIRD_PARAMETER: { baseValue: "user input" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(promptStub.callCount).to.equal(2);
            (0, chai_1.expect)(promptStub.firstCall.args).to.eql([
                {
                    default: "test-proj",
                    message: "Enter a value for New Param:",
                    name: "NEW_PARAMETER",
                    type: "input",
                },
            ]);
            (0, chai_1.expect)(promptStub.secondCall.args).to.eql([
                {
                    default: "default",
                    message: "Enter a value for 3:",
                    name: "THIRD_PARAMETER",
                    type: "input",
                },
            ]);
        });
        it("should prompt for params that are not currently populated", async () => {
            promptStub.resolves("user input");
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_2;
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "user input" },
                NEW_PARAMETER: { baseValue: "user input" },
                THIRD_PARAMETER: { baseValue: "user input" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
        });
        it("should not prompt the user for params that did not change type or param", async () => {
            promptStub.resolves("Fail");
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_3;
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "value" },
                A_PARAMETER: { baseValue: "value" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(promptStub).not.to.have.been.called;
        });
        it("should populate the spec with the default value if it is returned by prompt", async () => {
            promptStub.onFirstCall().resolves("test-proj");
            promptStub.onSecondCall().resolves("user input");
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_2;
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "value" },
                NEW_PARAMETER: { baseValue: "test-proj" },
                THIRD_PARAMETER: { baseValue: "user input" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(promptStub.callCount).to.equal(2);
            (0, chai_1.expect)(promptStub.firstCall.args).to.eql([
                {
                    default: "test-proj",
                    message: "Enter a value for New Param:",
                    name: "NEW_PARAMETER",
                    type: "input",
                },
            ]);
            (0, chai_1.expect)(promptStub.secondCall.args).to.eql([
                {
                    default: "default",
                    message: "Enter a value for 3:",
                    name: "THIRD_PARAMETER",
                    type: "input",
                },
            ]);
        });
        it("shouldn't prompt if there are no new params", async () => {
            promptStub.resolves("Fail");
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            const newParams = await paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            });
            const expected = {
                ANOTHER_PARAMETER: { baseValue: "value" },
                A_PARAMETER: { baseValue: "value" },
            };
            (0, chai_1.expect)(newParams).to.eql(expected);
            (0, chai_1.expect)(promptStub).not.to.have.been.called;
        });
        it("should exit if a prompt fails", async () => {
            promptStub.rejects(new error_1.FirebaseError("this is an error"));
            const newSpec = (0, utils_1.cloneDeep)(SPEC);
            newSpec.params = TEST_PARAMS_2;
            await (0, chai_1.expect)(paramHelper.promptForNewParams({
                spec: SPEC,
                newSpec,
                currentParams: {
                    A_PARAMETER: "value",
                    ANOTHER_PARAMETER: "value",
                },
                projectId: PROJECT_ID,
                instanceId: INSTANCE_ID,
            })).to.be.rejectedWith(error_1.FirebaseError, "this is an error");
            (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
        });
    });
});
//# sourceMappingURL=paramHelper.spec.js.map