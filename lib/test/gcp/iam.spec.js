"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("../../api");
const iam = require("../../gcp/iam");
describe("iam", () => {
    describe("testIamPermissions", () => {
        const tests = [
            {
                desc: "should pass if we have all permissions",
                permissionsToCheck: ["foo", "bar"],
                permissionsToReturn: ["foo", "bar"],
                wantAllowedPermissions: ["foo", "bar"].sort(),
                wantedPassed: true,
            },
            {
                desc: "should fail if we don't have all permissions",
                permissionsToCheck: ["foo", "bar"],
                permissionsToReturn: ["foo"],
                wantAllowedPermissions: ["foo"].sort(),
                wantMissingPermissions: ["bar"].sort(),
                wantedPassed: false,
            },
        ];
        const TEST_RESOURCE = `projects/foo`;
        for (const t of tests) {
            it(t.desc, async () => {
                nock(api_1.resourceManagerOrigin)
                    .post(`/v1/${TEST_RESOURCE}:testIamPermissions`)
                    .matchHeader("x-goog-quota-user", TEST_RESOURCE)
                    .reply(200, { permissions: t.permissionsToReturn });
                const res = await iam.testIamPermissions("foo", t.permissionsToCheck);
                (0, chai_1.expect)(res.allowed).to.deep.equal(t.wantAllowedPermissions);
                (0, chai_1.expect)(res.missing).to.deep.equal(t.wantMissingPermissions || []);
                (0, chai_1.expect)(res.passed).to.equal(t.wantedPassed);
                (0, chai_1.expect)(nock.isDone()).to.be.true;
            });
        }
    });
});
//# sourceMappingURL=iam.spec.js.map