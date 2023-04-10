"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const error_1 = require("../../error");
const extensionsApi = require("../../extensions/extensionsApi");
const extensionsHelper = require("../../extensions/extensionsHelper");
const getProjectNumber = require("../../getProjectNumber");
const functionsConfig = require("../../functionsConfig");
const gcp_1 = require("../../gcp");
const archiveDirectory = require("../../archiveDirectory");
const prompt = require("../../prompt");
const types_1 = require("../../extensions/types");
const stream_1 = require("stream");
const extensionsHelper_1 = require("../../extensions/extensionsHelper");
const planner = require("../../deploy/extensions/planner");
const EXT_SPEC_1 = {
    name: "cool-things",
    version: "0.0.1-rc.0",
    resources: [
        {
            name: "cool-resource",
            type: "firebaseextensions.v1beta.function",
        },
    ],
    sourceUrl: "www.google.com/cool-things-here",
    params: [],
    systemParams: [],
};
const EXT_SPEC_2 = {
    name: "cool-things",
    version: "0.0.1-rc.1",
    resources: [
        {
            name: "cool-resource",
            type: "firebaseextensions.v1beta.function",
        },
    ],
    sourceUrl: "www.google.com/cool-things-here",
    params: [],
    systemParams: [],
};
const TEST_EXT_VERSION_1 = {
    name: "publishers/test-pub/extensions/ext-one/versions/0.0.1-rc.0",
    ref: "test-pub/ext-one@0.0.1-rc.0",
    spec: EXT_SPEC_1,
    state: "PUBLISHED",
    hash: "12345",
    createTime: "2020-06-30T00:21:06.722782Z",
    sourceDownloadUri: "",
};
const TEST_EXT_VERSION_2 = {
    name: "publishers/test-pub/extensions/ext-one/versions/0.0.1-rc.1",
    ref: "test-pub/ext-one@0.0.1-rc.1",
    spec: EXT_SPEC_2,
    state: "PUBLISHED",
    hash: "23456",
    createTime: "2020-06-30T00:21:06.722782Z",
    sourceDownloadUri: "",
};
describe("extensionsHelper", () => {
    describe("substituteParams", () => {
        it("should substitute env variables", () => {
            const testResources = [
                {
                    resourceOne: {
                        name: "${VAR_ONE}",
                        source: "path/${VAR_ONE}",
                    },
                },
                {
                    resourceTwo: {
                        property: "${VAR_TWO}",
                        another: "$NOT_ENV",
                    },
                },
            ];
            const testParam = { VAR_ONE: "foo", VAR_TWO: "bar", UNUSED: "faz" };
            (0, chai_1.expect)(extensionsHelper.substituteParams(testResources, testParam)).to.deep.equal([
                {
                    resourceOne: {
                        name: "foo",
                        source: "path/foo",
                    },
                },
                {
                    resourceTwo: {
                        property: "bar",
                        another: "$NOT_ENV",
                    },
                },
            ]);
        });
    });
    it("should support both ${PARAM_NAME} AND ${param:PARAM_NAME} syntax", () => {
        const testResources = [
            {
                resourceOne: {
                    name: "${param:VAR_ONE}",
                    source: "path/${param:VAR_ONE}",
                },
            },
            {
                resourceTwo: {
                    property: "${param:VAR_TWO}",
                    another: "$NOT_ENV",
                },
            },
            {
                resourceThree: {
                    property: "${VAR_TWO}${VAR_TWO}${param:VAR_TWO}",
                    another: "${not:VAR_TWO}",
                },
            },
        ];
        const testParam = { VAR_ONE: "foo", VAR_TWO: "bar", UNUSED: "faz" };
        (0, chai_1.expect)(extensionsHelper.substituteParams(testResources, testParam)).to.deep.equal([
            {
                resourceOne: {
                    name: "foo",
                    source: "path/foo",
                },
            },
            {
                resourceTwo: {
                    property: "bar",
                    another: "$NOT_ENV",
                },
            },
            {
                resourceThree: {
                    property: "barbarbar",
                    another: "${not:VAR_TWO}",
                },
            },
        ]);
    });
    describe("getDBInstanceFromURL", () => {
        it("returns the correct instance name", () => {
            (0, chai_1.expect)(extensionsHelper.getDBInstanceFromURL("https://my-db.firebaseio.com")).to.equal("my-db");
        });
    });
    describe("populateDefaultParams", () => {
        const expected = {
            ENV_VAR_ONE: "12345",
            ENV_VAR_TWO: "hello@example.com",
            ENV_VAR_THREE: "https://${PROJECT_ID}.web.app/?acceptInvitation={token}",
        };
        const exampleParamSpec = [
            {
                param: "ENV_VAR_ONE",
                label: "env1",
                required: true,
            },
            {
                param: "ENV_VAR_TWO",
                label: "env2",
                required: true,
                validationRegex: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$",
                validationErrorMessage: "You must provide a valid email address.\n",
            },
            {
                param: "ENV_VAR_THREE",
                label: "env3",
                default: "https://${PROJECT_ID}.web.app/?acceptInvitation={token}",
                validationRegex: ".*\\{token\\}.*",
                validationErrorMessage: "Your URL must include {token} so that it can be replaced with an actual invitation token.\n",
            },
            {
                param: "ENV_VAR_FOUR",
                label: "env4",
                default: "users/{sender}.friends",
                required: false,
                validationRegex: ".+/.+\\..+",
                validationErrorMessage: "Values must be comma-separated document path + field, e.g. coll/doc.field,coll/doc.field\n",
            },
        ];
        it("should set default if default is available", () => {
            const envFile = {
                ENV_VAR_ONE: "12345",
                ENV_VAR_TWO: "hello@example.com",
                ENV_VAR_THREE: "https://${PROJECT_ID}.web.app/?acceptInvitation={token}",
            };
            (0, chai_1.expect)(extensionsHelper.populateDefaultParams(envFile, exampleParamSpec)).to.deep.equal(expected);
        });
        it("should throw error if no default is available", () => {
            const envFile = {
                ENV_VAR_ONE: "12345",
                ENV_VAR_THREE: "https://${PROJECT_ID}.web.app/?acceptInvitation={token}",
                ENV_VAR_FOUR: "users/{sender}.friends",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.populateDefaultParams(envFile, exampleParamSpec);
            }).to.throw(error_1.FirebaseError, /no default available/);
        });
    });
    describe("validateCommandLineParams", () => {
        const exampleParamSpec = [
            {
                param: "ENV_VAR_ONE",
                label: "env1",
                required: true,
            },
            {
                param: "ENV_VAR_TWO",
                label: "env2",
                required: true,
                validationRegex: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$",
                validationErrorMessage: "You must provide a valid email address.\n",
            },
            {
                param: "ENV_VAR_THREE",
                label: "env3",
                default: "https://${PROJECT_ID}.web.app/?acceptInvitation={token}",
                validationRegex: ".*\\{token\\}.*",
                validationErrorMessage: "Your URL must include {token} so that it can be replaced with an actual invitation token.\n",
            },
            {
                param: "ENV_VAR_FOUR",
                label: "env3",
                default: "users/{sender}.friends",
                required: false,
                validationRegex: ".+/.+\\..+",
                validationErrorMessage: "Values must be comma-separated document path + field, e.g. coll/doc.field,coll/doc.field\n",
            },
        ];
        it("should throw error if param variable value is invalid", () => {
            const envFile = {
                ENV_VAR_ONE: "12345",
                ENV_VAR_TWO: "invalid",
                ENV_VAR_THREE: "https://${PROJECT_ID}.web.app/?acceptInvitation={token}",
                ENV_VAR_FOUR: "users/{sender}.friends",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(envFile, exampleParamSpec);
            }).to.throw(error_1.FirebaseError, /not valid/);
        });
        it("should throw error if # commandLineParams does not match # env vars from extension.yaml", () => {
            const envFile = {
                ENV_VAR_ONE: "12345",
                ENV_VAR_TWO: "invalid",
                ENV_VAR_THREE: "https://${PROJECT_ID}.web.app/?acceptInvitation={token}",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(envFile, exampleParamSpec);
            }).to.throw(error_1.FirebaseError);
        });
        it("should throw an error if a required param is missing", () => {
            const testParamSpec = [
                {
                    param: "HI",
                    label: "hello",
                    required: true,
                },
                {
                    param: "BYE",
                    label: "goodbye",
                    required: false,
                },
            ];
            const testParams = {
                BYE: "val",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).to.throw(error_1.FirebaseError);
        });
        it("should not throw a error if a non-required param is missing", () => {
            const testParamSpec = [
                {
                    param: "HI",
                    label: "hello",
                    required: true,
                },
                {
                    param: "BYE",
                    label: "goodbye",
                    required: false,
                },
            ];
            const testParams = {
                HI: "val",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).not.to.throw();
        });
        it("should not throw a regex error if a non-required param is missing", () => {
            const testParamSpec = [
                {
                    param: "BYE",
                    label: "goodbye",
                    required: false,
                    validationRegex: "FAIL",
                },
            ];
            const testParams = {};
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).not.to.throw();
        });
        it("should throw a error if a param value doesn't pass the validation regex", () => {
            const testParamSpec = [
                {
                    param: "HI",
                    label: "hello",
                    validationRegex: "FAIL",
                    required: true,
                },
            ];
            const testParams = {
                HI: "val",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).to.throw(error_1.FirebaseError);
        });
        it("should throw a error if a multiselect value isn't an option", () => {
            const testParamSpec = [
                {
                    param: "HI",
                    label: "hello",
                    type: types_1.ParamType.MULTISELECT,
                    options: [
                        {
                            value: "val",
                        },
                    ],
                    required: true,
                },
            ];
            const testParams = {
                HI: "val,FAIL",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).to.throw(error_1.FirebaseError);
        });
        it("should throw a error if a multiselect param is missing options", () => {
            const testParamSpec = [
                {
                    param: "HI",
                    label: "hello",
                    type: types_1.ParamType.MULTISELECT,
                    options: [],
                    validationRegex: "FAIL",
                    required: true,
                },
            ];
            const testParams = {
                HI: "FAIL,val",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).to.throw(error_1.FirebaseError);
        });
        it("should throw a error if a select param is missing options", () => {
            const testParamSpec = [
                {
                    param: "HI",
                    label: "hello",
                    type: types_1.ParamType.SELECT,
                    validationRegex: "FAIL",
                    options: [],
                    required: true,
                },
            ];
            const testParams = {
                HI: "FAIL,val",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).to.throw(error_1.FirebaseError);
        });
        it("should not throw if a select value is an option", () => {
            const testParamSpec = [
                {
                    param: "HI",
                    label: "hello",
                    type: types_1.ParamType.SELECT,
                    options: [
                        {
                            value: "val",
                        },
                    ],
                    required: true,
                },
            ];
            const testParams = {
                HI: "val",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).not.to.throw();
        });
        it("should not throw if all multiselect values are options", () => {
            const testParamSpec = [
                {
                    param: "HI",
                    label: "hello",
                    type: types_1.ParamType.MULTISELECT,
                    options: [
                        {
                            value: "val",
                        },
                        {
                            value: "val2",
                        },
                    ],
                    required: true,
                },
            ];
            const testParams = {
                HI: "val,val2",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateCommandLineParams(testParams, testParamSpec);
            }).not.to.throw();
        });
    });
    describe("incrementPrereleaseVersion", () => {
        let listExtensionVersionsStub;
        beforeEach(() => {
            listExtensionVersionsStub = sinon.stub(extensionsApi, "listExtensionVersions");
            listExtensionVersionsStub.returns(Promise.resolve([TEST_EXT_VERSION_1, TEST_EXT_VERSION_2]));
        });
        afterEach(() => {
            listExtensionVersionsStub.restore();
        });
        it("should increment rc version", async () => {
            const newVersion = await extensionsHelper.incrementPrereleaseVersion("test-pub/ext-one", "0.0.1", "rc");
            (0, chai_1.expect)(newVersion).to.eql("0.0.1-rc.2");
        });
        it("should be first beta version", async () => {
            const newVersion = await extensionsHelper.incrementPrereleaseVersion("test-pub/ext-one", "0.0.1", "beta");
            (0, chai_1.expect)(newVersion).to.eql("0.0.1-beta.0");
        });
        it("should not increment version", async () => {
            const newVersion = await extensionsHelper.incrementPrereleaseVersion("test-pub/ext-one", "0.0.1", "stable");
            (0, chai_1.expect)(newVersion).to.eql("0.0.1");
        });
    });
    describe("validateSpec", () => {
        it("should not error on a valid spec", () => {
            const testSpec = {
                name: "test",
                version: "0.1.0",
                specVersion: "v1beta",
                resources: [],
                params: [],
                systemParams: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).not.to.throw();
        });
        it("should error if license is missing", () => {
            const testSpec = {
                name: "test",
                version: "0.1.0",
                specVersion: "v1beta",
                resources: [],
                params: [],
                systemParams: [],
                sourceUrl: "https://test-source.fake",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /license/);
        });
        it("should error if license is invalid", () => {
            const testSpec = {
                name: "test",
                version: "0.1.0",
                specVersion: "v1beta",
                resources: [],
                params: [],
                systemParams: [],
                sourceUrl: "https://test-source.fake",
                license: "invalid-license",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /license/);
        });
        it("should error if name is missing", () => {
            const testSpec = {
                version: "0.1.0",
                specVersion: "v1beta",
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /name/);
        });
        it("should error if specVersion is missing", () => {
            const testSpec = {
                name: "test",
                version: "0.1.0",
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /specVersion/);
        });
        it("should error if version is missing", () => {
            const testSpec = {
                name: "test",
                specVersion: "v1beta",
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /version/);
        });
        it("should error if a resource is malformed", () => {
            const testSpec = {
                version: "0.1.0",
                specVersion: "v1beta",
                resources: [{}],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /name/);
        });
        it("should error if an api is malformed", () => {
            const testSpec = {
                version: "0.1.0",
                specVersion: "v1beta",
                apis: [{}],
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /apiName/);
        });
        it("should error if a param is malformed", () => {
            const testSpec = {
                version: "0.1.0",
                specVersion: "v1beta",
                params: [{}],
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /param/);
        });
        it("should error if a STRING param has options.", () => {
            const testSpec = {
                version: "0.1.0",
                specVersion: "v1beta",
                params: [{ options: [] }],
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /options/);
        });
        it("should error if a select param has validationRegex.", () => {
            const testSpec = {
                version: "0.1.0",
                specVersion: "v1beta",
                params: [{ type: extensionsHelper.SpecParamType.SELECT, validationRegex: "test" }],
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /validationRegex/);
        });
        it("should error if a param has an invalid type.", () => {
            const testSpec = {
                version: "0.1.0",
                specVersion: "v1beta",
                params: [{ type: "test-type", validationRegex: "test" }],
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /Invalid type/);
        });
        it("should error if a param selectResource missing resourceType.", () => {
            const testSpec = {
                version: "0.1.0",
                specVersion: "v1beta",
                params: [
                    {
                        type: extensionsHelper.SpecParamType.SELECTRESOURCE,
                        validationRegex: "test",
                        default: "fail",
                    },
                ],
                resources: [],
                sourceUrl: "https://test-source.fake",
                license: "apache-2.0",
            };
            (0, chai_1.expect)(() => {
                extensionsHelper.validateSpec(testSpec);
            }).to.throw(error_1.FirebaseError, /must have resourceType/);
        });
    });
    describe("promptForValidInstanceId", () => {
        let promptStub;
        beforeEach(() => {
            promptStub = sinon.stub(prompt, "promptOnce");
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should prompt the user and return if the user provides a valid id", async () => {
            const extensionName = "extension-name";
            const userInput = "a-valid-name";
            promptStub.returns(userInput);
            const instanceId = await extensionsHelper.promptForValidInstanceId(extensionName);
            (0, chai_1.expect)(instanceId).to.equal(userInput);
            (0, chai_1.expect)(promptStub).to.have.been.calledOnce;
        });
        it("should prompt the user again if the provided id is shorter than 6 characters", async () => {
            const extensionName = "extension-name";
            const userInput1 = "short";
            const userInput2 = "a-valid-name";
            promptStub.onCall(0).returns(userInput1);
            promptStub.onCall(1).returns(userInput2);
            const instanceId = await extensionsHelper.promptForValidInstanceId(extensionName);
            (0, chai_1.expect)(instanceId).to.equal(userInput2);
            (0, chai_1.expect)(promptStub).to.have.been.calledTwice;
        });
        it("should prompt the user again if the provided id is longer than 45 characters", async () => {
            const extensionName = "extension-name";
            const userInput1 = "a-really-long-name-that-is-really-longer-than-were-ok-with";
            const userInput2 = "a-valid-name";
            promptStub.onCall(0).returns(userInput1);
            promptStub.onCall(1).returns(userInput2);
            const instanceId = await extensionsHelper.promptForValidInstanceId(extensionName);
            (0, chai_1.expect)(instanceId).to.equal(userInput2);
            (0, chai_1.expect)(promptStub).to.have.been.calledTwice;
        });
        it("should prompt the user again if the provided id ends in a -", async () => {
            const extensionName = "extension-name";
            const userInput1 = "invalid-";
            const userInput2 = "-invalid";
            const userInput3 = "a-valid-name";
            promptStub.onCall(0).returns(userInput1);
            promptStub.onCall(1).returns(userInput2);
            promptStub.onCall(2).returns(userInput3);
            const instanceId = await extensionsHelper.promptForValidInstanceId(extensionName);
            (0, chai_1.expect)(instanceId).to.equal(userInput3);
            (0, chai_1.expect)(promptStub).to.have.been.calledThrice;
        });
        it("should prompt the user again if the provided id starts with a number", async () => {
            const extensionName = "extension-name";
            const userInput1 = "1invalid";
            const userInput2 = "a-valid-name";
            promptStub.onCall(0).returns(userInput1);
            promptStub.onCall(1).returns(userInput2);
            const instanceId = await extensionsHelper.promptForValidInstanceId(extensionName);
            (0, chai_1.expect)(instanceId).to.equal(userInput2);
            (0, chai_1.expect)(promptStub).to.have.been.calledTwice;
        });
        it("should prompt the user again if the provided id contains illegal characters", async () => {
            const extensionName = "extension-name";
            const userInput1 = "na.name@name";
            const userInput2 = "a-valid-name";
            promptStub.onCall(0).returns(userInput1);
            promptStub.onCall(1).returns(userInput2);
            const instanceId = await extensionsHelper.promptForValidInstanceId(extensionName);
            (0, chai_1.expect)(instanceId).to.equal(userInput2);
            (0, chai_1.expect)(promptStub).to.have.been.calledTwice;
        });
    });
    describe("createSourceFromLocation", () => {
        let archiveStub;
        let uploadStub;
        let createSourceStub;
        let deleteStub;
        const testUrl = "https://storage.googleapis.com/firebase-ext-eap-uploads/object.zip";
        const testSource = {
            name: "test",
            packageUri: testUrl,
            hash: "abc123",
            state: "ACTIVE",
            spec: {
                name: "projects/test-proj/sources/abc123",
                version: "0.0.0",
                sourceUrl: testUrl,
                resources: [],
                params: [],
                systemParams: [],
            },
        };
        const testArchivedFiles = {
            file: "somefile",
            manifest: ["file"],
            size: 4,
            source: "/some/path",
            stream: new stream_1.Readable(),
        };
        const testUploadedArchive = {
            bucket: extensionsHelper.EXTENSIONS_BUCKET_NAME,
            object: "object.zip",
            generation: "1",
        };
        beforeEach(() => {
            archiveStub = sinon.stub(archiveDirectory, "archiveDirectory").resolves(testArchivedFiles);
            uploadStub = sinon.stub(gcp_1.storage, "uploadObject").resolves(testUploadedArchive);
            createSourceStub = sinon.stub(extensionsApi, "createSource").resolves(testSource);
            deleteStub = sinon.stub(gcp_1.storage, "deleteObject").resolves();
        });
        afterEach(() => {
            sinon.restore();
        });
        it("should upload local sources to Firebase Storage then create an ExtensionSource", async () => {
            const result = await extensionsHelper.createSourceFromLocation("test-proj", ".");
            (0, chai_1.expect)(result).to.equal(testSource);
            (0, chai_1.expect)(archiveStub).to.have.been.calledWith(".");
            (0, chai_1.expect)(uploadStub).to.have.been.calledWith(testArchivedFiles, extensionsHelper.EXTENSIONS_BUCKET_NAME);
            (0, chai_1.expect)(createSourceStub).to.have.been.calledWith("test-proj", testUrl + "?alt=media", "/");
            (0, chai_1.expect)(deleteStub).to.have.been.calledWith(`/${extensionsHelper.EXTENSIONS_BUCKET_NAME}/object.zip`);
        });
        it("should succeed even when it fails to delete the uploaded archive", async () => {
            deleteStub.throws();
            const result = await extensionsHelper.createSourceFromLocation("test-proj", ".");
            (0, chai_1.expect)(result).to.equal(testSource);
            (0, chai_1.expect)(archiveStub).to.have.been.calledWith(".");
            (0, chai_1.expect)(uploadStub).to.have.been.calledWith(testArchivedFiles, extensionsHelper.EXTENSIONS_BUCKET_NAME);
            (0, chai_1.expect)(createSourceStub).to.have.been.calledWith("test-proj", testUrl + "?alt=media", "/");
            (0, chai_1.expect)(deleteStub).to.have.been.calledWith(`/${extensionsHelper.EXTENSIONS_BUCKET_NAME}/object.zip`);
        });
        it("should throw an error if one is thrown while uploading a local source", async () => {
            uploadStub.throws(new error_1.FirebaseError("something bad happened"));
            await (0, chai_1.expect)(extensionsHelper.createSourceFromLocation("test-proj", ".")).to.be.rejectedWith(error_1.FirebaseError);
            (0, chai_1.expect)(archiveStub).to.have.been.calledWith(".");
            (0, chai_1.expect)(uploadStub).to.have.been.calledWith(testArchivedFiles, extensionsHelper.EXTENSIONS_BUCKET_NAME);
            (0, chai_1.expect)(createSourceStub).not.to.have.been.called;
            (0, chai_1.expect)(deleteStub).not.to.have.been.called;
        });
    });
    describe("checkIfInstanceIdAlreadyExists", () => {
        const TEST_NAME = "image-resizer";
        let getInstanceStub;
        beforeEach(() => {
            getInstanceStub = sinon.stub(extensionsApi, "getInstance");
        });
        afterEach(() => {
            getInstanceStub.restore();
        });
        it("should return false if no instance with that name exists", async () => {
            getInstanceStub.throws(new error_1.FirebaseError("Not Found", { status: 404 }));
            const exists = await extensionsHelper.instanceIdExists("proj", TEST_NAME);
            (0, chai_1.expect)(exists).to.be.false;
        });
        it("should return true if an instance with that name exists", async () => {
            getInstanceStub.resolves({ name: TEST_NAME });
            const exists = await extensionsHelper.instanceIdExists("proj", TEST_NAME);
            (0, chai_1.expect)(exists).to.be.true;
        });
        it("should throw if it gets an unexpected error response from getInstance", async () => {
            getInstanceStub.throws(new error_1.FirebaseError("Internal Error", { status: 500 }));
            await (0, chai_1.expect)(extensionsHelper.instanceIdExists("proj", TEST_NAME)).to.be.rejectedWith(error_1.FirebaseError, "Unexpected error when checking if instance ID exists: FirebaseError: Internal Error");
        });
    });
    describe("getFirebaseProjectParams", () => {
        const sandbox = sinon.createSandbox();
        let projectNumberStub;
        let getFirebaseConfigStub;
        beforeEach(() => {
            projectNumberStub = sandbox.stub(getProjectNumber, "getProjectNumber").resolves("1");
            getFirebaseConfigStub = sandbox.stub(functionsConfig, "getFirebaseConfig").resolves({
                projectId: "test",
                storageBucket: "real-test.appspot.com",
                databaseURL: "https://real-test.firebaseio.com",
                locationId: "us-west1",
            });
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should not call prodution when using a demo- project in emulator mode", async () => {
            const res = await extensionsHelper.getFirebaseProjectParams("demo-test", true);
            (0, chai_1.expect)(res).to.deep.equal({
                DATABASE_INSTANCE: "demo-test",
                DATABASE_URL: "https://demo-test.firebaseio.com",
                FIREBASE_CONFIG: '{"projectId":"demo-test","databaseURL":"https://demo-test.firebaseio.com","storageBucket":"demo-test.appspot.com"}',
                PROJECT_ID: "demo-test",
                PROJECT_NUMBER: "0",
                STORAGE_BUCKET: "demo-test.appspot.com",
            });
            (0, chai_1.expect)(projectNumberStub).not.to.have.been.called;
            (0, chai_1.expect)(getFirebaseConfigStub).not.to.have.been.called;
        });
        it("should return real values for non 'demo-' projects", async () => {
            const res = await extensionsHelper.getFirebaseProjectParams("real-test", false);
            (0, chai_1.expect)(res).to.deep.equal({
                DATABASE_INSTANCE: "real-test",
                DATABASE_URL: "https://real-test.firebaseio.com",
                FIREBASE_CONFIG: '{"projectId":"real-test","databaseURL":"https://real-test.firebaseio.com","storageBucket":"real-test.appspot.com"}',
                PROJECT_ID: "real-test",
                PROJECT_NUMBER: "1",
                STORAGE_BUCKET: "real-test.appspot.com",
            });
            (0, chai_1.expect)(projectNumberStub).to.have.been.called;
            (0, chai_1.expect)(getFirebaseConfigStub).to.have.been.called;
        });
    });
    describe(`${extensionsHelper_1.canonicalizeRefInput.name}`, () => {
        let resolveVersionStub;
        beforeEach(() => {
            resolveVersionStub = sinon.stub(planner, "resolveVersion").resolves("10.1.1");
        });
        afterEach(() => {
            resolveVersionStub.restore();
        });
        it("should do nothing to a valid ref", async () => {
            (0, chai_1.expect)(await (0, extensionsHelper_1.canonicalizeRefInput)("firebase/bigquery-export@10.1.1")).to.equal("firebase/bigquery-export@10.1.1");
        });
        it("should infer latest version", async () => {
            (0, chai_1.expect)(await (0, extensionsHelper_1.canonicalizeRefInput)("firebase/bigquery-export")).to.equal("firebase/bigquery-export@10.1.1");
        });
        it("should infer publisher name as firebase", async () => {
            (0, chai_1.expect)(await (0, extensionsHelper_1.canonicalizeRefInput)("firebase/bigquery-export")).to.equal("firebase/bigquery-export@10.1.1");
        });
        it("should infer publisher name as firebase and also infer latest as version", async () => {
            (0, chai_1.expect)(await (0, extensionsHelper_1.canonicalizeRefInput)("bigquery-export")).to.equal("firebase/bigquery-export@10.1.1");
        });
    });
});
//# sourceMappingURL=extensionsHelper.spec.js.map