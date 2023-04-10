"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const proto = require("../../gcp/proto");
describe("proto", () => {
    describe("duration", () => {
        it("should convert from seconds to duration", () => {
            (0, chai_1.expect)(proto.durationFromSeconds(1)).to.equal("1s");
            (0, chai_1.expect)(proto.durationFromSeconds(0.5)).to.equal("0.5s");
        });
        it("should convert from duration to seconds", () => {
            (0, chai_1.expect)(proto.secondsFromDuration("1s")).to.equal(1);
            (0, chai_1.expect)(proto.secondsFromDuration("0.5s")).to.equal(0.5);
        });
    });
    describe("copyIfPresent", () => {
        it("should copy present fields", () => {
            const dest = {};
            const src = { foo: "baz" };
            proto.copyIfPresent(dest, src, "foo");
            (0, chai_1.expect)(dest.foo).to.equal("baz");
        });
        it("should not copy missing fields", () => {
            const dest = {};
            const src = {};
            proto.copyIfPresent(dest, src, "foo");
            (0, chai_1.expect)("foo" in dest).to.be.false;
        });
        it("should support variadic params", () => {
            const dest = {};
            const src = { foo: "baz", baz: "quz" };
            proto.copyIfPresent(dest, src, "foo", "baz");
            (0, chai_1.expect)(dest).to.deep.equal(src);
        });
        const dest = {};
        const src = { bar: "baz" };
    });
    describe("renameIfPresent", () => {
        it("should copy present fields", () => {
            const dest = {};
            const src = { srcFoo: "baz" };
            proto.renameIfPresent(dest, src, "destFoo", "srcFoo");
            (0, chai_1.expect)(dest.destFoo).to.equal("baz");
        });
        it("should not copy missing fields", () => {
            const dest = {};
            const src = {};
            proto.renameIfPresent(dest, src, "destFoo", "srcFoo");
            (0, chai_1.expect)("destFoo" in dest).to.be.false;
        });
        it("should support transformations", () => {
            const dest = {};
            const src = { srcFoo: "baz" };
            proto.convertIfPresent(dest, src, "srcFoo", (str) => str + " transformed");
            (0, chai_1.expect)(dest.srcFoo).to.equal("baz transformed");
        });
        it("should support transformations with renames", () => {
            const dest = {};
            const src = { srcFoo: "baz" };
            proto.convertIfPresent(dest, src, "destFoo", "srcFoo", (str) => str + " transformed");
            (0, chai_1.expect)(dest.destFoo).to.equal("baz transformed");
        });
        const dest = {};
        const src = { bar: "baz" };
    });
    describe("fieldMasks", () => {
        it("should copy simple fields", () => {
            const obj = {
                number: 1,
                string: "foo",
                array: ["hello", "world"],
            };
            (0, chai_1.expect)(proto.fieldMasks(obj).sort()).to.deep.equal(["number", "string", "array"].sort());
        });
        it("should handle empty values", () => {
            const obj = {
                undefined: undefined,
                null: null,
                empty: {},
            };
            (0, chai_1.expect)(proto.fieldMasks(obj).sort()).to.deep.equal(["undefined", "null", "empty"].sort());
        });
        it("should nest into objects", () => {
            const obj = {
                top: "level",
                nested: {
                    key: "value",
                },
            };
            (0, chai_1.expect)(proto.fieldMasks(obj).sort()).to.deep.equal(["top", "nested.key"].sort());
        });
        it("should include empty objects", () => {
            const obj = {
                failurePolicy: {
                    retry: {},
                },
            };
            (0, chai_1.expect)(proto.fieldMasks(obj)).to.deep.equal(["failurePolicy.retry"]);
        });
        it("should support map types", () => {
            const obj = {
                map: {
                    userDefined: "value",
                },
                nested: {
                    anotherMap: {
                        userDefined: "value",
                    },
                },
            };
            const fieldMasks = proto.fieldMasks(obj, "map", "nested.anotherMap", "missing");
            (0, chai_1.expect)(fieldMasks.sort()).to.deep.equal(["map", "nested.anotherMap"].sort());
        });
    });
    describe("getInvokerMembers", () => {
        it("should return empty array with private invoker", () => {
            const invokerMembers = proto.getInvokerMembers(["private"], "project");
            (0, chai_1.expect)(invokerMembers).to.deep.eq([]);
        });
        it("should return allUsers with public invoker", () => {
            const invokerMembers = proto.getInvokerMembers(["public"], "project");
            (0, chai_1.expect)(invokerMembers).to.deep.eq(["allUsers"]);
        });
        it("should return formatted service accounts with invoker array", () => {
            const invokerMembers = proto.getInvokerMembers(["service-account1@", "service-account2@project.iam.gserviceaccount.com"], "project");
            (0, chai_1.expect)(invokerMembers).to.deep.eq([
                "serviceAccount:service-account1@project.iam.gserviceaccount.com",
                "serviceAccount:service-account2@project.iam.gserviceaccount.com",
            ]);
        });
    });
    describe("formatServiceAccount", () => {
        it("should throw error on empty service account string", () => {
            (0, chai_1.expect)(() => proto.formatServiceAccount("", "project")).to.throw();
        });
        it("should throw error on badly formed service account string", () => {
            (0, chai_1.expect)(() => proto.formatServiceAccount("not-a-service-account", "project")).to.throw();
        });
        it("should return formatted service account from invoker ending with @", () => {
            const serviceAccount = "service-account@";
            const project = "project";
            const formatted = proto.formatServiceAccount(serviceAccount, project);
            (0, chai_1.expect)(formatted).to.eq(`serviceAccount:${serviceAccount}${project}.iam.gserviceaccount.com`);
        });
        it("should return formatted service account from invoker with full service account", () => {
            const serviceAccount = "service-account@project.iam.gserviceaccount.com";
            const formatted = proto.formatServiceAccount(serviceAccount, "project");
            (0, chai_1.expect)(formatted).to.eq(`serviceAccount:${serviceAccount}`);
        });
    });
    it("pruneUndefindes", () => {
        const src = {
            foo: undefined,
            bar: "bar",
            baz: {
                alpha: ["alpha", undefined],
                bravo: undefined,
                charlie: "charlie",
            },
            qux: undefined,
        };
        const trimmed = {
            bar: "bar",
            baz: {
                alpha: ["alpha"],
                charlie: "charlie",
            },
        };
        (0, chai_1.expect)(src).to.not.deep.equal(trimmed);
        proto.pruneUndefiends(src);
        (0, chai_1.expect)(src).to.deep.equal(trimmed);
    });
});
//# sourceMappingURL=proto.spec.js.map