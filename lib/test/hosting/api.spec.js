"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("../../api");
const error_1 = require("../../error");
const hostingApi = require("../../hosting/api");
const TEST_CHANNELS_RESPONSE = {
    channels: [
        { url: "https://my-site--ch1-4iyrl1uo.web.app" },
        { url: "https://my-site--ch2-ygd8582v.web.app" },
    ],
};
const TEST_GET_DOMAINS_RESPONSE = {
    authorizedDomains: [
        "my-site.firebaseapp.com",
        "localhost",
        "randomurl.com",
        "my-site--ch1-4iyrl1uo.web.app",
        "my-site--expiredchannel-difhyc76.web.app",
    ],
};
const EXPECTED_DOMAINS_RESPONSE = [
    "my-site.firebaseapp.com",
    "localhost",
    "randomurl.com",
    "my-site--ch1-4iyrl1uo.web.app",
];
const PROJECT_ID = "test-project";
const SITE = "my-site";
describe("hosting", () => {
    describe("getChannel", () => {
        afterEach(nock.cleanAll);
        it("should make the API request for a channel", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(200, CHANNEL);
            const res = await hostingApi.getChannel(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.deep.equal({ name: "my-channel" });
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return null if there's no channel", async () => {
            const CHANNEL_ID = "my-channel";
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(404, {});
            const res = await hostingApi.getChannel(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.deep.equal(null);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.getChannel(PROJECT_ID, SITE, CHANNEL_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listChannels", () => {
        afterEach(nock.cleanAll);
        it("should make a single API requests to list a small number of channels", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, { channels: [{ name: "channel01" }] });
            const res = await hostingApi.listChannels(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal([{ name: "channel01" }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should make multiple API requests to list channels", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, { channels: [{ name: "channel01" }], nextPageToken: "02" });
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "02", pageSize: 10 })
                .reply(200, { channels: [{ name: "channel02" }] });
            const res = await hostingApi.listChannels(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal([{ name: "channel01" }, { name: "channel02" }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return an error if there's no channel", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(404, {});
            await (0, chai_1.expect)(hostingApi.listChannels(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /could not find channels/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.listChannels(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createChannel", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to create a channel", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`, { ttl: "604800s" })
                .query({ channelId: CHANNEL_ID })
                .reply(201, CHANNEL);
            const res = await hostingApi.createChannel(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.deep.equal(CHANNEL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should let us customize the TTL", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            const TTL = "60s";
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`, { ttl: TTL })
                .query({ channelId: CHANNEL_ID })
                .reply(201, CHANNEL);
            const res = await hostingApi.createChannel(PROJECT_ID, SITE, CHANNEL_ID, 60000);
            (0, chai_1.expect)(res).to.deep.equal(CHANNEL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`, { ttl: "604800s" })
                .query({ channelId: CHANNEL_ID })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.createChannel(PROJECT_ID, SITE, CHANNEL_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateChannelTtl", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to update a channel", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            nock(api_1.hostingApiOrigin)
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`, {
                ttl: "604800s",
            })
                .query({ updateMask: "ttl" })
                .reply(201, CHANNEL);
            const res = await hostingApi.updateChannelTtl(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.deep.equal(CHANNEL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should let us customize the TTL", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            const TTL = "60s";
            nock(api_1.hostingApiOrigin)
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`, { ttl: TTL })
                .query({ updateMask: "ttl" })
                .reply(201, CHANNEL);
            const res = await hostingApi.updateChannelTtl(PROJECT_ID, SITE, CHANNEL_ID, 60000);
            (0, chai_1.expect)(res).to.deep.equal(CHANNEL);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            nock(api_1.hostingApiOrigin)
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`, {
                ttl: "604800s",
            })
                .query({ updateMask: "ttl" })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.updateChannelTtl(PROJECT_ID, SITE, CHANNEL_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("deleteChannel", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to delete a channel", async () => {
            const CHANNEL_ID = "my-channel";
            const CHANNEL = { name: "my-channel" };
            nock(api_1.hostingApiOrigin)
                .delete(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(204, CHANNEL);
            const res = await hostingApi.deleteChannel(PROJECT_ID, SITE, CHANNEL_ID);
            (0, chai_1.expect)(res).to.be.undefined;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            nock(api_1.hostingApiOrigin)
                .delete(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels/${CHANNEL_ID}`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.deleteChannel(PROJECT_ID, SITE, CHANNEL_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createVersion", () => {
        afterEach(nock.cleanAll);
        it("should make the API requests to create a version", async () => {
            const VERSION = { status: "CREATED" };
            const FULL_NAME = `projects/-/sites/${SITE}/versions/my-new-version`;
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/-/sites/${SITE}/versions`, VERSION)
                .reply(200, { name: FULL_NAME });
            const res = await hostingApi.createVersion(SITE, VERSION);
            (0, chai_1.expect)(res).to.deep.equal(FULL_NAME);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const VERSION = { status: "CREATED" };
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/-/sites/${SITE}/versions`, VERSION)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.createVersion(SITE, VERSION)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateVersion", () => {
        afterEach(nock.cleanAll);
        it("should make the API requests to update a version", async () => {
            const VERSION = { status: "FINALIZED" };
            nock(api_1.hostingApiOrigin)
                .patch(`/v1beta1/projects/-/sites/${SITE}/versions/my-version`, VERSION)
                .query({ updateMask: "status" })
                .reply(200, VERSION);
            const res = await hostingApi.updateVersion(SITE, "my-version", VERSION);
            (0, chai_1.expect)(res).to.deep.equal(VERSION);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const VERSION = { status: "FINALIZED" };
            nock(api_1.hostingApiOrigin)
                .patch(`/v1beta1/projects/-/sites/${SITE}/versions/my-version`, VERSION)
                .query({ updateMask: "status" })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.updateVersion(SITE, "my-version", VERSION)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listVersions", () => {
        afterEach(nock.cleanAll);
        const VERSION_1 = {
            name: `projects/-/sites/${SITE}/versions/v1`,
            status: "FINALIZED",
            config: {},
            createTime: "now",
            createUser: {
                email: "inlined@google.com",
            },
            fileCount: 0,
            versionBytes: 0,
        };
        const VERSION_2 = Object.assign(Object.assign({}, VERSION_1), { name: `projects/-/sites/${SITE}/versions/v2` });
        it("returns a single page of versions", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/-/sites/${SITE}/versions`)
                .reply(200, { versions: [VERSION_1] });
            nock(api_1.hostingApiOrigin);
            const versions = await hostingApi.listVersions(SITE);
            (0, chai_1.expect)(versions).deep.equals([VERSION_1]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("paginates through many versions", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/-/sites/${SITE}/versions`)
                .reply(200, { versions: [VERSION_1], nextPageToken: "page2" });
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/-/sites/${SITE}/versions?pageToken=page2`)
                .reply(200, { versions: [VERSION_2] });
            const versions = await hostingApi.listVersions(SITE);
            (0, chai_1.expect)(versions).deep.equals([VERSION_1, VERSION_2]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("handles errors", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/-/sites/${SITE}/versions`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.listVersions(SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("cloneVersion", () => {
        afterEach(nock.cleanAll);
        it("should make the API requests to clone a version", async () => {
            const SOURCE_VERSION = "my-version";
            const VERSION = { name: "my-new-version" };
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/-/sites/${SITE}/versions:clone`, {
                sourceVersion: SOURCE_VERSION,
                finalize: false,
            })
                .reply(200, { name: `projects/${PROJECT_ID}/operations/op` });
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/operations/op`)
                .reply(200, {
                name: `projects/${PROJECT_ID}/operations/op`,
                done: true,
                response: VERSION,
            });
            const res = await hostingApi.cloneVersion(SITE, SOURCE_VERSION);
            (0, chai_1.expect)(res).to.deep.equal(VERSION);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const SOURCE_VERSION = "my-version";
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/-/sites/${SITE}/versions:clone`, {
                sourceVersion: SOURCE_VERSION,
                finalize: false,
            })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.cloneVersion(SITE, SOURCE_VERSION)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createRelease", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to create a release", async () => {
            const CHANNEL_ID = "my-channel";
            const RELEASE = { name: "my-new-release" };
            const VERSION = "version";
            const VERSION_NAME = `sites/${SITE}/versions/${VERSION}`;
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/-/sites/${SITE}/channels/${CHANNEL_ID}/releases`)
                .query({ versionName: VERSION_NAME })
                .reply(201, RELEASE);
            const res = await hostingApi.createRelease(SITE, CHANNEL_ID, VERSION_NAME);
            (0, chai_1.expect)(res).to.deep.equal(RELEASE);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should include a message, if provided", async () => {
            const CHANNEL_ID = "my-channel";
            const RELEASE = { name: "my-new-release" };
            const VERSION = "version";
            const VERSION_NAME = `sites/${SITE}/versions/${VERSION}`;
            const MESSAGE = "yo dawg";
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/-/sites/${SITE}/channels/${CHANNEL_ID}/releases`, {
                message: MESSAGE,
            })
                .query({ versionName: VERSION_NAME })
                .reply(201, RELEASE);
            const res = await hostingApi.createRelease(SITE, CHANNEL_ID, VERSION_NAME, {
                message: MESSAGE,
            });
            (0, chai_1.expect)(res).to.deep.equal(RELEASE);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            const CHANNEL_ID = "my-channel";
            const VERSION = "VERSION";
            const VERSION_NAME = `sites/${SITE}/versions/${VERSION}`;
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/-/sites/${SITE}/channels/${CHANNEL_ID}/releases`)
                .query({ versionName: VERSION_NAME })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.createRelease(SITE, CHANNEL_ID, VERSION_NAME)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getSite", () => {
        afterEach(nock.cleanAll);
        it("should make the API request for a channel", async () => {
            const SITE_BODY = { name: "my-site" };
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(200, SITE_BODY);
            const res = await hostingApi.getSite(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal(SITE_BODY);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the site doesn't exist", async () => {
            nock(api_1.hostingApiOrigin).get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`).reply(404, {});
            await (0, chai_1.expect)(hostingApi.getSite(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /could not find site/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.getSite(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("listSites", () => {
        afterEach(nock.cleanAll);
        it("should make a single API requests to list a small number of sites", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, { sites: [{ name: "site01" }] });
            const res = await hostingApi.listSites(PROJECT_ID);
            (0, chai_1.expect)(res).to.deep.equal([{ name: "site01" }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should make multiple API requests to list sites", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(200, { sites: [{ name: "site01" }], nextPageToken: "02" });
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "02", pageSize: 10 })
                .reply(200, { sites: [{ name: "site02" }] });
            const res = await hostingApi.listSites(PROJECT_ID);
            (0, chai_1.expect)(res).to.deep.equal([{ name: "site01" }, { name: "site02" }]);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should return an error if there's no site", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(404, {});
            await (0, chai_1.expect)(hostingApi.listSites(PROJECT_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /could not find sites/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites`)
                .query({ pageToken: "", pageSize: 10 })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.listSites(PROJECT_ID)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("createSite", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to create a channel", async () => {
            const SITE_BODY = { name: "my-new-site" };
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/sites`, { appId: "" })
                .query({ siteId: SITE })
                .reply(201, SITE_BODY);
            const res = await hostingApi.createSite(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal(SITE_BODY);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock(api_1.hostingApiOrigin)
                .post(`/v1beta1/projects/${PROJECT_ID}/sites`, { appId: "" })
                .query({ siteId: SITE })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.createSite(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("updateSite", () => {
        const SITE_OBJ = {
            name: "my-site",
            defaultUrl: "",
            appId: "foo",
            labels: {},
        };
        afterEach(nock.cleanAll);
        it("should make the API request to update a site", async () => {
            nock(api_1.hostingApiOrigin)
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .query({ updateMask: "appId" })
                .reply(201, SITE_OBJ);
            const res = await hostingApi.updateSite(PROJECT_ID, SITE_OBJ, ["appId"]);
            (0, chai_1.expect)(res).to.deep.equal(SITE_OBJ);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock(api_1.hostingApiOrigin)
                .patch(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .query({ updateMask: "appId" })
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.updateSite(PROJECT_ID, SITE_OBJ, ["appId"])).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("deleteSite", () => {
        afterEach(nock.cleanAll);
        it("should make the API request to delete a site", async () => {
            nock(api_1.hostingApiOrigin).delete(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`).reply(201, {});
            const res = await hostingApi.deleteSite(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.be.undefined;
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
        it("should throw an error if the server returns an error", async () => {
            nock(api_1.hostingApiOrigin)
                .delete(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}`)
                .reply(500, { error: "server boo-boo" });
            await (0, chai_1.expect)(hostingApi.deleteSite(PROJECT_ID, SITE)).to.eventually.be.rejectedWith(error_1.FirebaseError, /server boo-boo/);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
    describe("getCleanDomains", () => {
        afterEach(() => {
            nock.cleanAll();
        });
        it("should return the list of expected auth domains after syncing", async () => {
            nock(api_1.hostingApiOrigin)
                .get(`/v1beta1/projects/${PROJECT_ID}/sites/${SITE}/channels`)
                .query(() => true)
                .reply(200, TEST_CHANNELS_RESPONSE);
            nock(api_1.identityOrigin)
                .get(`/admin/v2/projects/${PROJECT_ID}/config`)
                .reply(200, TEST_GET_DOMAINS_RESPONSE);
            const res = await hostingApi.getCleanDomains(PROJECT_ID, SITE);
            (0, chai_1.expect)(res).to.deep.equal(EXPECTED_DOMAINS_RESPONSE);
            (0, chai_1.expect)(nock.isDone()).to.be.true;
        });
    });
});
describe("normalizeName", () => {
    const tests = [
        { in: "happy-path", out: "happy-path" },
        { in: "feature/branch", out: "feature-branch" },
        { in: "featuRe/Branch", out: "featuRe-Branch" },
        { in: "what/are:you_thinking", out: "what-are-you-thinking" },
        { in: "happyBranch", out: "happyBranch" },
        { in: "happy:branch", out: "happy-branch" },
        { in: "happy_branch", out: "happy-branch" },
        { in: "happy#branch", out: "happy-branch" },
    ];
    for (const t of tests) {
        it(`should handle the normalization of ${t.in}`, () => {
            (0, chai_1.expect)(hostingApi.normalizeName(t.in)).to.equal(t.out);
        });
    }
});
//# sourceMappingURL=api.spec.js.map