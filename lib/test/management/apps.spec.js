"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs");
const nock = require("nock");
const api = require("../../api");
const apps_1 = require("../../management/apps");
const pollUtils = require("../../operation-poller");
const error_1 = require("../../error");
const api_1 = require("../../api");
const PROJECT_ID = "the-best-firebase-project";
const OPERATION_RESOURCE_NAME_1 = "operations/cp.11111111111111111";
const APP_ID = "appId";
const IOS_APP_BUNDLE_ID = "bundleId";
const IOS_APP_STORE_ID = "appStoreId";
const IOS_APP_DISPLAY_NAME = "iOS app";
const ANDROID_APP_PACKAGE_NAME = "com.google.packageName";
const ANDROID_APP_DISPLAY_NAME = "Android app";
const WEB_APP_DISPLAY_NAME = "Web app";
function generateIosAppList(counts) {
    return Array.from(Array(counts), (_, i) => ({
        name: `projects/project-id-${i}/apps/app-id-${i}`,
        projectId: `project-id`,
        appId: `app-id-${i}`,
        platform: apps_1.AppPlatform.IOS,
        displayName: `Project ${i}`,
        bundleId: `bundle-id-${i}`,
    }));
}
function generateAndroidAppList(counts) {
    return Array.from(Array(counts), (_, i) => ({
        name: `projects/project-id-${i}/apps/app-id-${i}`,
        projectId: `project-id`,
        appId: `app-id-${i}`,
        platform: apps_1.AppPlatform.ANDROID,
        displayName: `Project ${i}`,
        packageName: `package.name.app${i}`,
    }));
}
function generateWebAppList(counts) {
    return Array.from(Array(counts), (_, i) => ({
        name: `projects/project-id-${i}/apps/app-id-${i}`,
        projectId: `project-id`,
        appId: `app-id-${i}`,
        platform: apps_1.AppPlatform.WEB,
        displayName: `Project ${i}`,
    }));
}
describe("App management", () => {
    let sandbox;
    let pollOperationStub;
    let readFileSyncStub;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        pollOperationStub = sandbox.stub(pollUtils, "pollOperation").throws("Unexpected poll call");
        readFileSyncStub = sandbox.stub(fs, "readFileSync").throws("Unxpected readFileSync call");
        nock.disableNetConnect();
    });
    afterEach(() => {
        sandbox.restore();
        nock.enableNetConnect();
    });
    describe("getAppPlatform", () => {
        it("should return the iOS platform", () => {
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("IOS")).to.equal(apps_1.AppPlatform.IOS);
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("iOS")).to.equal(apps_1.AppPlatform.IOS);
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("Ios")).to.equal(apps_1.AppPlatform.IOS);
        });
        it("should return the Android platform", () => {
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("Android")).to.equal(apps_1.AppPlatform.ANDROID);
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("ANDROID")).to.equal(apps_1.AppPlatform.ANDROID);
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("aNDroiD")).to.equal(apps_1.AppPlatform.ANDROID);
        });
        it("should return the Web platform", () => {
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("Web")).to.equal(apps_1.AppPlatform.WEB);
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("WEB")).to.equal(apps_1.AppPlatform.WEB);
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("wEb")).to.equal(apps_1.AppPlatform.WEB);
        });
        it("should return the ANY platform", () => {
            (0, chai_1.expect)((0, apps_1.getAppPlatform)("")).to.equal(apps_1.AppPlatform.ANY);
        });
        it("should throw if the platform is unknown", () => {
            (0, chai_1.expect)(() => (0, apps_1.getAppPlatform)("unknown")).to.throw(error_1.FirebaseError, "Unexpected platform. Only iOS, Android, and Web apps are supported");
        });
    });
    describe("createIosApp", () => {
        it("should resolve with app data if it succeeds", async () => {
            const expectedAppMetadata = {
                appId: APP_ID,
                displayName: IOS_APP_DISPLAY_NAME,
                bundleId: IOS_APP_BUNDLE_ID,
                appStoreId: IOS_APP_STORE_ID,
            };
            nock(api_1.firebaseApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/iosApps`)
                .reply(200, { name: OPERATION_RESOURCE_NAME_1 });
            pollOperationStub.onFirstCall().resolves(expectedAppMetadata);
            const resultAppInfo = await (0, apps_1.createIosApp)(PROJECT_ID, {
                displayName: IOS_APP_DISPLAY_NAME,
                bundleId: IOS_APP_BUNDLE_ID,
                appStoreId: IOS_APP_STORE_ID,
            });
            (0, chai_1.expect)(resultAppInfo).to.deep.equal(expectedAppMetadata);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.calledOnceWith({
                pollerName: "Create iOS app Poller",
                apiOrigin: api.firebaseApiOrigin,
                apiVersion: "v1beta1",
                operationResourceName: OPERATION_RESOURCE_NAME_1,
            });
        });
        it("should reject if app creation api call fails", async () => {
            nock(api_1.firebaseApiOrigin).post(`/v1beta1/projects/${PROJECT_ID}/iosApps`).reply(404);
            let err;
            try {
                await (0, apps_1.createIosApp)(PROJECT_ID, {
                    displayName: IOS_APP_DISPLAY_NAME,
                    bundleId: IOS_APP_BUNDLE_ID,
                    appStoreId: IOS_APP_STORE_ID,
                });
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to create iOS app for project ${PROJECT_ID}. See firebase-debug.log for more info.`);
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.not.called;
        });
        it("should reject if polling throws error", async () => {
            const expectedError = new Error("Permission denied");
            nock(api_1.firebaseApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/iosApps`)
                .reply(200, { name: OPERATION_RESOURCE_NAME_1 });
            pollOperationStub.onFirstCall().rejects(expectedError);
            let err;
            try {
                await (0, apps_1.createIosApp)(PROJECT_ID, {
                    displayName: IOS_APP_DISPLAY_NAME,
                    bundleId: IOS_APP_BUNDLE_ID,
                    appStoreId: IOS_APP_STORE_ID,
                });
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to create iOS app for project ${PROJECT_ID}. See firebase-debug.log for more info.`);
            (0, chai_1.expect)(err.original).to.equal(expectedError);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.calledOnceWith({
                pollerName: "Create iOS app Poller",
                apiOrigin: api.firebaseApiOrigin,
                apiVersion: "v1beta1",
                operationResourceName: OPERATION_RESOURCE_NAME_1,
            });
        });
    });
    describe("createAndroidApp", () => {
        it("should resolve with app data if it succeeds", async () => {
            const expectedAppMetadata = {
                appId: APP_ID,
                displayName: ANDROID_APP_DISPLAY_NAME,
                packageName: ANDROID_APP_PACKAGE_NAME,
            };
            nock(api_1.firebaseApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/androidApps`)
                .reply(200, { name: OPERATION_RESOURCE_NAME_1 });
            pollOperationStub.onFirstCall().resolves(expectedAppMetadata);
            const resultAppInfo = await (0, apps_1.createAndroidApp)(PROJECT_ID, {
                displayName: ANDROID_APP_DISPLAY_NAME,
                packageName: ANDROID_APP_PACKAGE_NAME,
            });
            (0, chai_1.expect)(resultAppInfo).to.equal(expectedAppMetadata);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.calledOnceWith({
                pollerName: "Create Android app Poller",
                apiOrigin: api.firebaseApiOrigin,
                apiVersion: "v1beta1",
                operationResourceName: OPERATION_RESOURCE_NAME_1,
            });
        });
        it("should reject if app creation api call fails", async () => {
            nock(api_1.firebaseApiOrigin).post(`/v1beta1/projects/${PROJECT_ID}/androidApps`).reply(404);
            let err;
            try {
                await (0, apps_1.createAndroidApp)(PROJECT_ID, {
                    displayName: ANDROID_APP_DISPLAY_NAME,
                    packageName: ANDROID_APP_PACKAGE_NAME,
                });
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to create Android app for project ${PROJECT_ID}. See firebase-debug.log for more info.`);
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.not.called;
        });
        it("should reject if polling throws error", async () => {
            const expectedError = new Error("Permission denied");
            nock(api_1.firebaseApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/androidApps`)
                .reply(200, { name: OPERATION_RESOURCE_NAME_1 });
            pollOperationStub.onFirstCall().rejects(expectedError);
            let err;
            try {
                await (0, apps_1.createAndroidApp)(PROJECT_ID, {
                    displayName: ANDROID_APP_DISPLAY_NAME,
                    packageName: ANDROID_APP_PACKAGE_NAME,
                });
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to create Android app for project ${PROJECT_ID}. See firebase-debug.log for more info.`);
            (0, chai_1.expect)(err.original).to.equal(expectedError);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.calledOnceWith({
                pollerName: "Create Android app Poller",
                apiOrigin: api.firebaseApiOrigin,
                apiVersion: "v1beta1",
                operationResourceName: OPERATION_RESOURCE_NAME_1,
            });
        });
    });
    describe("createWebApp", () => {
        it("should resolve with app data if it succeeds", async () => {
            const expectedAppMetadata = {
                appId: APP_ID,
                displayName: WEB_APP_DISPLAY_NAME,
            };
            nock(api_1.firebaseApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/webApps`)
                .reply(200, { name: OPERATION_RESOURCE_NAME_1 });
            pollOperationStub.onFirstCall().resolves(expectedAppMetadata);
            const resultAppInfo = await (0, apps_1.createWebApp)(PROJECT_ID, { displayName: WEB_APP_DISPLAY_NAME });
            (0, chai_1.expect)(resultAppInfo).to.equal(expectedAppMetadata);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.calledOnceWith({
                pollerName: "Create Web app Poller",
                apiOrigin: api.firebaseApiOrigin,
                apiVersion: "v1beta1",
                operationResourceName: OPERATION_RESOURCE_NAME_1,
            });
        });
        it("should reject if app creation api call fails", async () => {
            nock(api_1.firebaseApiOrigin).post(`/v1beta1/projects/${PROJECT_ID}/webApps`).reply(404);
            let err;
            try {
                await (0, apps_1.createWebApp)(PROJECT_ID, { displayName: WEB_APP_DISPLAY_NAME });
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to create Web app for project ${PROJECT_ID}. See firebase-debug.log for more info.`);
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.not.called;
        });
        it("should reject if polling throws error", async () => {
            const expectedError = new Error("Permission denied");
            nock(api_1.firebaseApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/webApps`)
                .reply(200, { name: OPERATION_RESOURCE_NAME_1 });
            pollOperationStub.onFirstCall().rejects(expectedError);
            let err;
            try {
                await (0, apps_1.createWebApp)(PROJECT_ID, { displayName: WEB_APP_DISPLAY_NAME });
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal(`Failed to create Web app for project ${PROJECT_ID}. See firebase-debug.log for more info.`);
            (0, chai_1.expect)(err.original).to.equal(expectedError);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(pollOperationStub).to.be.calledOnceWith({
                pollerName: "Create Web app Poller",
                apiOrigin: api.firebaseApiOrigin,
                apiVersion: "v1beta1",
                operationResourceName: OPERATION_RESOURCE_NAME_1,
            });
        });
    });
    describe("listFirebaseApps", () => {
        it("should resolve with app list if it succeeds with only 1 api call", async () => {
            const appCountsPerPlatform = 3;
            const expectedAppList = [
                ...generateIosAppList(appCountsPerPlatform),
                ...generateAndroidAppList(appCountsPerPlatform),
                ...generateWebAppList(appCountsPerPlatform),
            ];
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}:searchApps`)
                .query({ pageSize: apps_1.APP_LIST_PAGE_SIZE })
                .reply(200, { apps: expectedAppList });
            const apps = await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.ANY);
            (0, chai_1.expect)(apps).to.deep.equal(expectedAppList);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with iOS app list", async () => {
            const appCounts = 10;
            const expectedAppList = generateIosAppList(appCounts);
            const apiResponseAppList = expectedAppList.map((app) => {
                const iosApp = Object.assign({}, app);
                delete iosApp.platform;
                return iosApp;
            });
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/iosApps`)
                .query({ pageSize: apps_1.APP_LIST_PAGE_SIZE })
                .reply(200, { apps: apiResponseAppList });
            const apps = await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.IOS);
            (0, chai_1.expect)(apps).to.deep.equal(expectedAppList);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with Android app list", async () => {
            const appCounts = 10;
            const expectedAppList = generateAndroidAppList(appCounts);
            const apiResponseAppList = expectedAppList.map((app) => {
                const androidApps = Object.assign({}, app);
                delete androidApps.platform;
                return androidApps;
            });
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/androidApps`)
                .query({ pageSize: apps_1.APP_LIST_PAGE_SIZE })
                .reply(200, { apps: apiResponseAppList });
            const apps = await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.ANDROID);
            (0, chai_1.expect)(apps).to.deep.equal(expectedAppList);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with Web app list", async () => {
            const appCounts = 10;
            const expectedAppList = generateWebAppList(appCounts);
            const apiResponseAppList = expectedAppList.map((app) => {
                const webApp = Object.assign({}, app);
                delete webApp.platform;
                return webApp;
            });
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/webApps`)
                .query({ pageSize: apps_1.APP_LIST_PAGE_SIZE })
                .reply(200, { apps: apiResponseAppList });
            const apps = await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.WEB);
            (0, chai_1.expect)(apps).to.deep.equal(expectedAppList);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should concatenate pages to get app list if it succeeds", async () => {
            const appCountsPerPlatform = 3;
            const pageSize = 5;
            const nextPageToken = "next-page-token";
            const expectedAppList = [
                ...generateIosAppList(appCountsPerPlatform),
                ...generateAndroidAppList(appCountsPerPlatform),
                ...generateWebAppList(appCountsPerPlatform),
            ];
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}:searchApps`)
                .query({ pageSize })
                .reply(200, { apps: expectedAppList.slice(0, pageSize), nextPageToken });
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}:searchApps`)
                .query({ pageSize, pageToken: nextPageToken })
                .reply(200, { apps: expectedAppList.slice(pageSize, appCountsPerPlatform * 3) });
            const apps = await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.ANY, pageSize);
            (0, chai_1.expect)(apps).to.deep.equal(expectedAppList);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the first api call fails", async () => {
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}:searchApps`)
                .query({ pageSize: apps_1.APP_LIST_PAGE_SIZE })
                .reply(404);
            let err;
            try {
                await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.ANY);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal("Failed to list Firebase apps. See firebase-debug.log for more info.");
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should rejects if error is thrown in subsequence api call", async () => {
            const appCounts = 10;
            const pageSize = 5;
            const nextPageToken = "next-page-token";
            const expectedAppList = generateAndroidAppList(appCounts);
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}:searchApps`)
                .query({ pageSize })
                .reply(200, { apps: expectedAppList.slice(0, pageSize), nextPageToken });
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}:searchApps`)
                .query({ pageSize, pageToken: nextPageToken })
                .reply(404);
            let err;
            try {
                await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.ANY, pageSize);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal("Failed to list Firebase apps. See firebase-debug.log for more info.");
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the list iOS apps fails", async () => {
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/iosApps`)
                .query({ pageSize: apps_1.APP_LIST_PAGE_SIZE })
                .reply(404);
            let err;
            try {
                await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.IOS);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal("Failed to list Firebase IOS apps. See firebase-debug.log for more info.");
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the list Android apps fails", async () => {
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/androidApps`)
                .query({ pageSize: apps_1.APP_LIST_PAGE_SIZE })
                .reply(404);
            let err;
            try {
                await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.ANDROID);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal("Failed to list Firebase ANDROID apps. See firebase-debug.log for more info.");
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if the list Web apps fails", async () => {
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/webApps`)
                .query({ pageSize: apps_1.APP_LIST_PAGE_SIZE })
                .reply(404);
            let err;
            try {
                await (0, apps_1.listFirebaseApps)(PROJECT_ID, apps_1.AppPlatform.WEB);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal("Failed to list Firebase WEB apps. See firebase-debug.log for more info.");
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getAppConfigFile", () => {
        it("should resolve with iOS app configuration if it succeeds", async () => {
            const expectedConfigFileContent = "test iOS configuration";
            const mockBase64Content = Buffer.from(expectedConfigFileContent).toString("base64");
            nock(api_1.firebaseApiOrigin).get(`/v1beta1/projects/-/iosApps/${APP_ID}/config`).reply(200, {
                configFilename: "GoogleService-Info.plist",
                configFileContents: mockBase64Content,
            });
            const configData = await (0, apps_1.getAppConfig)(APP_ID, apps_1.AppPlatform.IOS);
            const fileData = (0, apps_1.getAppConfigFile)(configData, apps_1.AppPlatform.IOS);
            (0, chai_1.expect)(fileData).to.deep.equal({
                fileName: "GoogleService-Info.plist",
                fileContents: expectedConfigFileContent,
            });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with Web app configuration if it succeeds", async () => {
            const mockWebConfig = {
                projectId: PROJECT_ID,
                appId: APP_ID,
                apiKey: "api-key",
            };
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/-/webApps/${APP_ID}/config`)
                .reply(200, mockWebConfig);
            readFileSyncStub.onFirstCall().returns("{/*--CONFIG--*/}");
            const configData = await (0, apps_1.getAppConfig)(APP_ID, apps_1.AppPlatform.WEB);
            const fileData = (0, apps_1.getAppConfigFile)(configData, apps_1.AppPlatform.WEB);
            (0, chai_1.expect)(fileData).to.deep.equal({
                fileName: "google-config.js",
                fileContents: JSON.stringify(mockWebConfig, null, 2),
            });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
            (0, chai_1.expect)(readFileSyncStub).to.be.calledOnce;
        });
    });
    describe("getAppConfig", () => {
        it("should resolve with iOS app configuration if it succeeds", async () => {
            const mockBase64Content = Buffer.from("test iOS configuration").toString("base64");
            nock(api_1.firebaseApiOrigin).get(`/v1beta1/projects/-/iosApps/${APP_ID}/config`).reply(200, {
                configFilename: "GoogleService-Info.plist",
                configFileContents: mockBase64Content,
            });
            const configData = await (0, apps_1.getAppConfig)(APP_ID, apps_1.AppPlatform.IOS);
            (0, chai_1.expect)(configData).to.deep.equal({
                configFilename: "GoogleService-Info.plist",
                configFileContents: mockBase64Content,
            });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with Android app configuration if it succeeds", async () => {
            const mockBase64Content = Buffer.from("test Android configuration").toString("base64");
            nock(api_1.firebaseApiOrigin).get(`/v1beta1/projects/-/androidApps/${APP_ID}/config`).reply(200, {
                configFilename: "google-services.json",
                configFileContents: mockBase64Content,
            });
            const configData = await (0, apps_1.getAppConfig)(APP_ID, apps_1.AppPlatform.ANDROID);
            (0, chai_1.expect)(configData).to.deep.equal({
                configFilename: "google-services.json",
                configFileContents: mockBase64Content,
            });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should resolve with Web app configuration if it succeeds", async () => {
            const mockWebConfig = {
                projectId: PROJECT_ID,
                appId: APP_ID,
                apiKey: "api-key",
            };
            nock(api_1.firebaseApiOrigin)
                .get(`/v1beta1/projects/-/webApps/${APP_ID}/config`)
                .reply(200, mockWebConfig);
            const configData = await (0, apps_1.getAppConfig)(APP_ID, apps_1.AppPlatform.WEB);
            (0, chai_1.expect)(configData).to.deep.equal(mockWebConfig);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should reject if api request fails", async () => {
            nock(api_1.firebaseApiOrigin).get(`/v1beta1/projects/-/androidApps/${APP_ID}/config`).reply(404);
            let err;
            try {
                await (0, apps_1.getAppConfig)(APP_ID, apps_1.AppPlatform.ANDROID);
            }
            catch (e) {
                err = e;
            }
            (0, chai_1.expect)(err.message).to.equal("Failed to get ANDROID app configuration. See firebase-debug.log for more info.");
            (0, chai_1.expect)(err.original).to.be.an.instanceOf(error_1.FirebaseError, "Not Found");
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
//# sourceMappingURL=apps.spec.js.map