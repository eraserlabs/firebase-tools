"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chai_1 = require("chai");
chai.use(require("chai-as-promised"));
const sinon = require("sinon");
const changelog = require("../../extensions/change-log");
const extensionApi = require("../../extensions/extensionsApi");
function testExtensionVersion(version, releaseNotes) {
    return {
        name: `publishers/test/extensions/test/versions/${version}`,
        ref: `test/test@${version}`,
        state: "PUBLISHED",
        hash: "abc123",
        sourceDownloadUri: "https://google.com",
        releaseNotes,
        spec: {
            name: "test",
            version,
            resources: [],
            params: [],
            systemParams: [],
            sourceUrl: "https://google.com",
        },
    };
}
describe("changelog", () => {
    describe("GetReleaseNotesForUpdate", () => {
        let listExtensionVersionStub;
        beforeEach(() => {
            listExtensionVersionStub = sinon.stub(extensionApi, "listExtensionVersions");
        });
        afterEach(() => {
            listExtensionVersionStub.restore();
        });
        it("should return release notes for each version in the update", async () => {
            const extensionVersions = [
                testExtensionVersion("0.1.1", "foo"),
                testExtensionVersion("0.1.2", "bar"),
            ];
            listExtensionVersionStub
                .withArgs("test/test", `id<="0.1.2" AND id>"0.1.0"`)
                .returns(extensionVersions);
            const want = {
                "0.1.1": "foo",
                "0.1.2": "bar",
            };
            const got = await changelog.getReleaseNotesForUpdate({
                extensionRef: "test/test",
                fromVersion: "0.1.0",
                toVersion: "0.1.2",
            });
            (0, chai_1.expect)(got).to.deep.equal(want);
        });
        it("should exclude versions that don't have releaseNotes", async () => {
            const extensionVersions = [
                testExtensionVersion("0.1.1", "foo"),
                testExtensionVersion("0.1.2"),
            ];
            listExtensionVersionStub
                .withArgs("test/test", `id<="0.1.2" AND id>"0.1.0"`)
                .resolves(extensionVersions);
            const want = {
                "0.1.1": "foo",
            };
            const got = await changelog.getReleaseNotesForUpdate({
                extensionRef: "test/test",
                fromVersion: "0.1.0",
                toVersion: "0.1.2",
            });
            (0, chai_1.expect)(got).to.deep.equal(want);
        });
    });
    describe("breakingChangesInUpdate", () => {
        const testCases = [
            {
                description: "should return no breaking changes",
                in: ["0.1.0", "0.1.1", "0.1.2"],
                want: [],
            },
            {
                description: "should return prerelease breaking change",
                in: ["0.1.0", "0.1.1", "0.2.0"],
                want: ["0.2.0"],
            },
            {
                description: "should return breaking change",
                in: ["1.1.0", "1.1.1", "2.0.0"],
                want: ["2.0.0"],
            },
            {
                description: "should return multiple breaking changes",
                in: ["0.1.0", "0.2.1", "1.0.0"],
                want: ["0.2.1", "1.0.0"],
            },
        ];
        for (const testCase of testCases) {
            it(testCase.description, () => {
                const got = changelog.breakingChangesInUpdate(testCase.in);
                (0, chai_1.expect)(got).to.deep.equal(testCase.want);
            });
        }
    });
    describe("parseChangelog", () => {
        const testCases = [
            {
                description: "should split changelog by version",
                in: "## Version 0.1.0\nNotes\n## Version 0.1.1\nNew notes",
                want: {
                    "0.1.0": "Notes",
                    "0.1.1": "New notes",
                },
            },
            {
                description: "should ignore text not in a version",
                in: "Some random words\n## Version 0.1.0\nNotes\n## Version 0.1.1\nNew notes",
                want: {
                    "0.1.0": "Notes",
                    "0.1.1": "New notes",
                },
            },
            {
                description: "should handle prerelease versions",
                in: "Some random words\n## Version 0.1.0-rc.1\nNotes\n## Version 0.1.1-release-candidate.1.2\nNew notes",
                want: {
                    "0.1.0-rc.1": "Notes",
                    "0.1.1-release-candidate.1.2": "New notes",
                },
            },
        ];
        for (const testCase of testCases) {
            it(testCase.description, () => {
                const got = changelog.parseChangelog(testCase.in);
                (0, chai_1.expect)(got).to.deep.equal(testCase.want);
            });
        }
    });
});
//# sourceMappingURL=change-log.spec.js.map