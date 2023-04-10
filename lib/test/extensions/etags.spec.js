"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const etags = require("../../extensions/etags");
const rc = require("../../rc");
const TEST_PROJECT = "test-project";
function dummyRc(etagMap) {
    return new rc.RC(undefined, {
        etags: {
            "test-project": {
                extensionInstances: etagMap,
            },
        },
    });
}
function extensionInstanceHelper(instanceId, etag) {
    const ret = {
        instanceId,
        etag,
    };
    return ret;
}
describe("detectEtagChanges", () => {
    const testCases = [
        {
            desc: "should not detect changes if there is no previously saved etags",
            rc: dummyRc({}),
            instances: [extensionInstanceHelper("test", "abc123")],
            expected: [],
        },
        {
            desc: "should detect changes if a new instance was installed out of band",
            rc: dummyRc({ test: "abc123" }),
            instances: [
                extensionInstanceHelper("test", "abc123"),
                extensionInstanceHelper("test2", "def456"),
            ],
            expected: ["test2"],
        },
        {
            desc: "should detect changes if an instance was changed out of band",
            rc: dummyRc({ test: "abc123" }),
            instances: [extensionInstanceHelper("test", "def546")],
            expected: ["test"],
        },
        {
            desc: "should detect changes if an instance was deleted out of band",
            rc: dummyRc({ test: "abc123" }),
            instances: [],
            expected: ["test"],
        },
    ];
    for (const tc of testCases) {
        it(tc.desc, () => {
            const result = etags.detectEtagChanges(tc.rc, TEST_PROJECT, tc.instances);
            (0, chai_1.expect)(result).to.have.same.members(tc.expected);
        });
    }
});
//# sourceMappingURL=etags.spec.js.map