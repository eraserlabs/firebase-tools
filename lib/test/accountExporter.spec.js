"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const os = require("os");
const sinon = require("sinon");
const accountExporter_1 = require("../accountExporter");
describe("accountExporter", () => {
    describe("validateOptions", () => {
        it("should reject when no format provided", () => {
            (0, chai_1.expect)(() => (0, accountExporter_1.validateOptions)({}, "output_file")).to.throw();
        });
        it("should reject when format is not csv or json", () => {
            (0, chai_1.expect)(() => (0, accountExporter_1.validateOptions)({ format: "txt" }, "output_file")).to.throw();
        });
        it("should ignore format param when implicitly specified in file name", () => {
            const ret = (0, accountExporter_1.validateOptions)({ format: "JSON" }, "output_file.csv");
            (0, chai_1.expect)(ret.format).to.eq("csv");
        });
        it("should use format param when not implicitly specified in file name", () => {
            const ret = (0, accountExporter_1.validateOptions)({ format: "JSON" }, "output_file");
            (0, chai_1.expect)(ret.format).to.eq("json");
        });
    });
    describe("serialExportUsers", () => {
        let sandbox;
        let userList = [];
        const writeStream = {
            write: () => { },
            end: () => { },
        };
        let spyWrite;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
            spyWrite = sandbox.spy(writeStream, "write");
            for (let i = 0; i < 7; i++) {
                userList.push({
                    localId: i.toString(),
                    email: "test" + i + "@test.org",
                    displayName: "John Tester" + i,
                    disabled: i % 2 === 0,
                });
            }
        });
        afterEach(() => {
            sandbox.restore();
            nock.cleanAll();
            userList = [];
        });
        it("should call api.request multiple times for JSON export", async () => {
            mockAllUsersRequests();
            await (0, accountExporter_1.serialExportUsers)("test-project-id", {
                format: "JSON",
                batchSize: 3,
                writeStream: writeStream,
            });
            (0, chai_1.expect)(spyWrite.callCount).to.eq(7);
            (0, chai_1.expect)(spyWrite.getCall(0).args[0]).to.eq(JSON.stringify(userList[0], null, 2));
            for (let j = 1; j < 7; j++) {
                (0, chai_1.expect)(spyWrite.getCall(j).args[0]).to.eq("," + os.EOL + JSON.stringify(userList[j], null, 2));
            }
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should call api.request multiple times for CSV export", async () => {
            mockAllUsersRequests();
            await (0, accountExporter_1.serialExportUsers)("test-project-id", {
                format: "csv",
                batchSize: 3,
                writeStream: writeStream,
            });
            (0, chai_1.expect)(spyWrite.callCount).to.eq(userList.length);
            for (let j = 0; j < userList.length; j++) {
                const expectedEntry = userList[j].localId +
                    "," +
                    userList[j].email +
                    ",false,,," +
                    userList[j].displayName +
                    Array(22).join(",") +
                    userList[j].disabled;
                (0, chai_1.expect)(spyWrite.getCall(j).args[0]).to.eq(expectedEntry + ",," + os.EOL);
            }
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should encapsulate displayNames with commas for csv formats", async () => {
            const singleUser = {
                localId: "1",
                email: "test1@test.org",
                displayName: "John Tester1, CFA",
                disabled: false,
            };
            nock("https://www.googleapis.com")
                .post("/identitytoolkit/v3/relyingparty/downloadAccount", {
                maxResults: 1,
                targetProjectId: "test-project-id",
            })
                .reply(200, {
                users: [singleUser],
                nextPageToken: "1",
            })
                .post("/identitytoolkit/v3/relyingparty/downloadAccount", {
                maxResults: 1,
                nextPageToken: "1",
                targetProjectId: "test-project-id",
            })
                .reply(200, {
                users: [],
                nextPageToken: "1",
            });
            await (0, accountExporter_1.serialExportUsers)("test-project-id", {
                format: "csv",
                batchSize: 1,
                writeStream: writeStream,
            });
            (0, chai_1.expect)(spyWrite.callCount).to.eq(1);
            const expectedEntry = singleUser.localId +
                "," +
                singleUser.email +
                ",false,,," +
                '"' +
                singleUser.displayName +
                '"' +
                Array(22).join(",") +
                singleUser.disabled;
            (0, chai_1.expect)(spyWrite.getCall(0).args[0]).to.eq(expectedEntry + ",," + os.EOL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should not emit redundant comma in JSON on consecutive calls", async () => {
            mockAllUsersRequests();
            const correctString = '{\n  "localId": "0",\n  "email": "test0@test.org",\n  "displayName": "John Tester0",\n  "disabled": true\n}';
            const firstWriteSpy = sinon.spy();
            await (0, accountExporter_1.serialExportUsers)("test-project-id", {
                format: "JSON",
                batchSize: 3,
                writeStream: { write: firstWriteSpy, end: () => { } },
            });
            (0, chai_1.expect)(firstWriteSpy.args[0][0]).to.be.eq(correctString, "The first call did not emit the correct string");
            mockAllUsersRequests();
            const secondWriteSpy = sinon.spy();
            await (0, accountExporter_1.serialExportUsers)("test-project-id", {
                format: "JSON",
                batchSize: 3,
                writeStream: { write: secondWriteSpy, end: () => { } },
            });
            (0, chai_1.expect)(secondWriteSpy.args[0][0]).to.be.eq(correctString, "The second call did not emit the correct string");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should export a user's custom attributes for JSON formats", async () => {
            userList[0].customAttributes =
                '{ "customBoolean": true, "customString": "test", "customInt": 99 }';
            userList[1].customAttributes =
                '{ "customBoolean": true, "customString2": "test2", "customInt": 99 }';
            nock("https://www.googleapis.com")
                .post("/identitytoolkit/v3/relyingparty/downloadAccount", {
                maxResults: 3,
                targetProjectId: "test-project-id",
            })
                .reply(200, {
                users: userList.slice(0, 3),
            });
            await (0, accountExporter_1.serialExportUsers)("test-project-id", {
                format: "JSON",
                batchSize: 3,
                writeStream: writeStream,
            });
            (0, chai_1.expect)(spyWrite.getCall(0).args[0]).to.eq(JSON.stringify(userList[0], null, 2));
            (0, chai_1.expect)(spyWrite.getCall(1).args[0]).to.eq("," + os.EOL + JSON.stringify(userList[1], null, 2));
            (0, chai_1.expect)(spyWrite.getCall(2).args[0]).to.eq("," + os.EOL + JSON.stringify(userList[2], null, 2));
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should export a user's custom attributes for CSV formats", async () => {
            userList[0].customAttributes =
                '{ "customBoolean": true, "customString": "test", "customInt": 99 }';
            userList[1].customAttributes = '{ "customBoolean": true }';
            nock("https://www.googleapis.com")
                .post("/identitytoolkit/v3/relyingparty/downloadAccount", {
                maxResults: 3,
                targetProjectId: "test-project-id",
            })
                .reply(200, {
                users: userList.slice(0, 3),
            });
            await (0, accountExporter_1.serialExportUsers)("test-project-id", {
                format: "JSON",
                batchSize: 3,
                writeStream: writeStream,
            });
            (0, chai_1.expect)(spyWrite.getCall(0).args[0]).to.eq(JSON.stringify(userList[0], null, 2));
            (0, chai_1.expect)(spyWrite.getCall(1).args[0]).to.eq("," + os.EOL + JSON.stringify(userList[1], null, 2));
            (0, chai_1.expect)(spyWrite.getCall(2).args[0]).to.eq("," + os.EOL + JSON.stringify(userList[2], null, 2));
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        function mockAllUsersRequests() {
            nock("https://www.googleapis.com")
                .post("/identitytoolkit/v3/relyingparty/downloadAccount", {
                maxResults: 3,
                targetProjectId: "test-project-id",
            })
                .reply(200, {
                users: userList.slice(0, 3),
                nextPageToken: "3",
            })
                .post("/identitytoolkit/v3/relyingparty/downloadAccount", {
                maxResults: 3,
                nextPageToken: "3",
                targetProjectId: "test-project-id",
            })
                .reply(200, {
                users: userList.slice(3, 6),
                nextPageToken: "6",
            })
                .post("/identitytoolkit/v3/relyingparty/downloadAccount", {
                maxResults: 3,
                nextPageToken: "6",
                targetProjectId: "test-project-id",
            })
                .reply(200, {
                users: userList.slice(6, 7),
                nextPageToken: "7",
            })
                .post("/identitytoolkit/v3/relyingparty/downloadAccount", {
                maxResults: 3,
                nextPageToken: "7",
                targetProjectId: "test-project-id",
            })
                .reply(200, {
                users: [],
                nextPageToken: "7",
            });
        }
    });
});
//# sourceMappingURL=accountExporter.spec.js.map