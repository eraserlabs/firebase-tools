"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const nock = require("nock");
const api = require("../../api");
const database_1 = require("../../management/database");
const error_1 = require("../../error");
const PROJECT_ID = "the-best-firebase-project";
const DATABASE_INSTANCE_NAME = "some_instance";
const SOME_DATABASE_INSTANCE = {
    name: DATABASE_INSTANCE_NAME,
    location: database_1.DatabaseLocation.US_CENTRAL1,
    project: PROJECT_ID,
    databaseUrl: generateDatabaseUrl(DATABASE_INSTANCE_NAME, database_1.DatabaseLocation.US_CENTRAL1),
    type: database_1.DatabaseInstanceType.USER_DATABASE,
    state: database_1.DatabaseInstanceState.ACTIVE,
};
const SOME_DATABASE_INSTANCE_EUROPE_WEST1 = {
    name: DATABASE_INSTANCE_NAME,
    location: database_1.DatabaseLocation.EUROPE_WEST1,
    project: PROJECT_ID,
    databaseUrl: generateDatabaseUrl(DATABASE_INSTANCE_NAME, database_1.DatabaseLocation.EUROPE_WEST1),
    type: database_1.DatabaseInstanceType.USER_DATABASE,
    state: database_1.DatabaseInstanceState.ACTIVE,
};
const INSTANCE_RESPONSE_US_CENTRAL1 = {
    name: `projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.US_CENTRAL1}/instances/${DATABASE_INSTANCE_NAME}`,
    project: PROJECT_ID,
    databaseUrl: generateDatabaseUrl(DATABASE_INSTANCE_NAME, database_1.DatabaseLocation.US_CENTRAL1),
    type: database_1.DatabaseInstanceType.USER_DATABASE,
    state: database_1.DatabaseInstanceState.ACTIVE,
};
const INSTANCE_RESPONSE_EUROPE_WEST1 = {
    name: `projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.EUROPE_WEST1}/instances/${DATABASE_INSTANCE_NAME}`,
    project: PROJECT_ID,
    databaseUrl: generateDatabaseUrl(DATABASE_INSTANCE_NAME, database_1.DatabaseLocation.EUROPE_WEST1),
    type: database_1.DatabaseInstanceType.USER_DATABASE,
    state: database_1.DatabaseInstanceState.ACTIVE,
};
function generateDatabaseUrl(instanceName, location) {
    if (location === database_1.DatabaseLocation.ANY) {
        throw new Error("can't generate url for any location");
    }
    if (location === database_1.DatabaseLocation.US_CENTRAL1) {
        return `https://${instanceName}.firebaseio.com`;
    }
    return `https://${instanceName}.${location}.firebasedatabase.app`;
}
function generateInstanceList(counts, location) {
    return Array.from(Array(counts), (_, i) => {
        const name = `my-db-instance-${i}`;
        return {
            name: name,
            location: location,
            project: PROJECT_ID,
            databaseUrl: generateDatabaseUrl(name, location),
            type: database_1.DatabaseInstanceType.USER_DATABASE,
            state: database_1.DatabaseInstanceState.ACTIVE,
        };
    });
}
function generateInstanceListApiResponse(counts, location) {
    return Array.from(Array(counts), (_, i) => {
        const name = `my-db-instance-${i}`;
        return {
            name: `projects/${PROJECT_ID}/locations/${location}/instances/${name}`,
            project: PROJECT_ID,
            databaseUrl: generateDatabaseUrl(name, location),
            type: database_1.DatabaseInstanceType.USER_DATABASE,
            state: database_1.DatabaseInstanceState.ACTIVE,
        };
    });
}
describe("Database management", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        nock.disableNetConnect();
    });
    afterEach(() => {
        nock.enableNetConnect();
        sandbox.restore();
    });
    describe("getDatabaseInstanceDetails", () => {
        it("should resolve with DatabaseInstance if API call succeeds", async () => {
            const expectedDatabaseInstance = SOME_DATABASE_INSTANCE;
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/-/instances/${DATABASE_INSTANCE_NAME}`)
                .reply(200, INSTANCE_RESPONSE_US_CENTRAL1);
            const resultDatabaseInstance = await (0, database_1.getDatabaseInstanceDetails)(PROJECT_ID, DATABASE_INSTANCE_NAME);
            (0, chai_1.expect)(resultDatabaseInstance).to.deep.equal(expectedDatabaseInstance);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if API call fails", async () => {
            const badInstanceName = "non-existent-instance";
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/-/instances/${badInstanceName}`)
                .reply(404);
            let err;
            try {
                await (0, database_1.getDatabaseInstanceDetails)(PROJECT_ID, badInstanceName);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to get instance details for instance: ${badInstanceName}. See firebase-debug.log for more details.`);
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createInstance", () => {
        it("should resolve with new DatabaseInstance if API call succeeds", async () => {
            const expectedDatabaseInstance = SOME_DATABASE_INSTANCE_EUROPE_WEST1;
            nock(api.rtdbManagementOrigin)
                .post(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.EUROPE_WEST1}/instances`)
                .query({ databaseId: DATABASE_INSTANCE_NAME })
                .reply(200, INSTANCE_RESPONSE_EUROPE_WEST1);
            const resultDatabaseInstance = await (0, database_1.createInstance)(PROJECT_ID, DATABASE_INSTANCE_NAME, database_1.DatabaseLocation.EUROPE_WEST1, database_1.DatabaseInstanceType.USER_DATABASE);
            (0, chai_1.expect)(resultDatabaseInstance).to.deep.equal(expectedDatabaseInstance);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if API call fails", async () => {
            const badInstanceName = "non-existent-instance";
            nock(api.rtdbManagementOrigin)
                .post(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.US_CENTRAL1}/instances`)
                .query({ databaseId: badInstanceName })
                .reply(404);
            let err;
            try {
                await (0, database_1.createInstance)(PROJECT_ID, badInstanceName, database_1.DatabaseLocation.US_CENTRAL1, database_1.DatabaseInstanceType.DEFAULT_DATABASE);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to create instance: ${badInstanceName}. See firebase-debug.log for more details.`);
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("checkInstanceNameAvailable", () => {
        it("should resolve with new DatabaseInstance if specified instance name is available and API call succeeds", async () => {
            nock(api.rtdbManagementOrigin)
                .post(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.EUROPE_WEST1}/instances`)
                .query({ databaseId: DATABASE_INSTANCE_NAME, validateOnly: true })
                .reply(200, INSTANCE_RESPONSE_EUROPE_WEST1);
            const output = await (0, database_1.checkInstanceNameAvailable)(PROJECT_ID, DATABASE_INSTANCE_NAME, database_1.DatabaseInstanceType.USER_DATABASE, database_1.DatabaseLocation.EUROPE_WEST1);
            (0, chai_1.expect)(output).to.deep.equal({ available: true });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with suggested instance names if the API call fails with suggestions ", async () => {
            const badInstanceName = "invalid:database|name";
            const expectedErrorObj = {
                error: {
                    details: [
                        {
                            metadata: {
                                suggested_database_ids: "dbName1,dbName2,dbName3",
                            },
                        },
                    ],
                },
            };
            nock(api.rtdbManagementOrigin)
                .post(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.EUROPE_WEST1}/instances`)
                .query({ databaseId: badInstanceName, validateOnly: true })
                .reply(409, expectedErrorObj);
            const output = await (0, database_1.checkInstanceNameAvailable)(PROJECT_ID, badInstanceName, database_1.DatabaseInstanceType.USER_DATABASE, database_1.DatabaseLocation.EUROPE_WEST1);
            (0, chai_1.expect)(output).to.deep.equal({
                available: false,
                suggestedIds: ["dbName1", "dbName2", "dbName3"],
            });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if API call fails without suggestions", async () => {
            const badInstanceName = "non-existent-instance";
            const expectedErrorObj = {
                error: {
                    details: [
                        {
                            metadata: {},
                        },
                    ],
                },
            };
            nock(api.rtdbManagementOrigin)
                .post(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.US_CENTRAL1}/instances`)
                .query({ databaseId: badInstanceName, validateOnly: true })
                .reply(409, expectedErrorObj);
            let err;
            try {
                await (0, database_1.checkInstanceNameAvailable)(PROJECT_ID, badInstanceName, database_1.DatabaseInstanceType.DEFAULT_DATABASE, database_1.DatabaseLocation.US_CENTRAL1);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to validate Realtime Database instance name: ${badInstanceName}.`);
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "409");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listDatabaseInstances", () => {
        it("should resolve with instance list if it succeeds with only 1 api call", async () => {
            const pageSize = 5;
            const instancesPerLocation = 2;
            const expectedInstanceList = [
                ...generateInstanceList(instancesPerLocation, database_1.DatabaseLocation.US_CENTRAL1),
                ...generateInstanceList(instancesPerLocation, database_1.DatabaseLocation.EUROPE_WEST1),
            ];
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.ANY}/instances`)
                .query({ pageSize })
                .reply(200, {
                instances: [
                    ...generateInstanceListApiResponse(instancesPerLocation, database_1.DatabaseLocation.US_CENTRAL1),
                    ...generateInstanceListApiResponse(instancesPerLocation, database_1.DatabaseLocation.EUROPE_WEST1),
                ],
            });
            const instances = await (0, database_1.listDatabaseInstances)(PROJECT_ID, database_1.DatabaseLocation.ANY, pageSize);
            (0, chai_1.expect)(instances).to.deep.equal(expectedInstanceList);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with specific location", async () => {
            const instancesPerLocation = 2;
            const expectedInstancesList = generateInstanceList(instancesPerLocation, database_1.DatabaseLocation.US_CENTRAL1);
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.US_CENTRAL1}/instances`)
                .query({ pageSize: database_1.APP_LIST_PAGE_SIZE })
                .reply(200, {
                instances: [
                    ...generateInstanceListApiResponse(instancesPerLocation, database_1.DatabaseLocation.US_CENTRAL1),
                ],
            });
            const instances = await (0, database_1.listDatabaseInstances)(PROJECT_ID, database_1.DatabaseLocation.US_CENTRAL1);
            (0, chai_1.expect)(instances).to.deep.equal(expectedInstancesList);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should concatenate pages to get instances list if it succeeds", async () => {
            const countPerLocation = 3;
            const pageSize = 5;
            const nextPageToken = "next-page-token";
            const expectedInstancesList = [
                ...generateInstanceList(countPerLocation, database_1.DatabaseLocation.US_CENTRAL1),
                ...generateInstanceList(countPerLocation, database_1.DatabaseLocation.EUROPE_WEST1),
                ...generateInstanceList(countPerLocation, database_1.DatabaseLocation.EUROPE_WEST1),
            ];
            const expectedResponsesList = [
                ...generateInstanceListApiResponse(countPerLocation, database_1.DatabaseLocation.US_CENTRAL1),
                ...generateInstanceListApiResponse(countPerLocation, database_1.DatabaseLocation.EUROPE_WEST1),
                ...generateInstanceListApiResponse(countPerLocation, database_1.DatabaseLocation.EUROPE_WEST1),
            ];
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.ANY}/instances`)
                .query({ pageSize: pageSize })
                .reply(200, {
                instances: expectedResponsesList.slice(0, pageSize),
                nextPageToken,
            });
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.ANY}/instances`)
                .query({ pageSize: pageSize, pageToken: nextPageToken })
                .reply(200, {
                instances: expectedResponsesList.slice(pageSize),
            });
            const instances = await (0, database_1.listDatabaseInstances)(PROJECT_ID, database_1.DatabaseLocation.ANY, pageSize);
            (0, chai_1.expect)(instances).to.deep.equal(expectedInstancesList);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the first api call fails", async () => {
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.ANY}/instances`)
                .query({ pageSize: database_1.APP_LIST_PAGE_SIZE })
                .reply(404);
            let err;
            try {
                await (0, database_1.listDatabaseInstances)(PROJECT_ID, database_1.DatabaseLocation.ANY);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal("Failed to list Firebase Realtime Database instances. See firebase-debug.log for more info.");
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if error is thrown in subsequent api call", async () => {
            const countPerLocation = 5;
            const pageSize = 5;
            const nextPageToken = "next-page-token";
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.US_CENTRAL1}/instances`)
                .query({ pageSize: pageSize })
                .reply(200, {
                instances: [
                    ...generateInstanceListApiResponse(countPerLocation, database_1.DatabaseLocation.US_CENTRAL1),
                ].slice(0, pageSize),
                nextPageToken,
            });
            nock(api.rtdbManagementOrigin)
                .get(`/${database_1.MGMT_API_VERSION}/projects/${PROJECT_ID}/locations/${database_1.DatabaseLocation.US_CENTRAL1}/instances`)
                .query({ pageSize: pageSize, pageToken: nextPageToken })
                .reply(404);
            let err;
            try {
                await (0, database_1.listDatabaseInstances)(PROJECT_ID, database_1.DatabaseLocation.US_CENTRAL1, pageSize);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to list Firebase Realtime Database instances for location ${database_1.DatabaseLocation.US_CENTRAL1}. See firebase-debug.log for more info.`);
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=database.spec.js.map