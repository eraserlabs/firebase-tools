"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const error_1 = require("../../../../../error");
const parsing = require("../../../../../deploy/functions/runtimes/discovery/parsing");
describe("requireKeys", () => {
    it("accepts found keys", () => {
        const obj = {
            foo: "foo",
            bar: "bar",
        };
        parsing.requireKeys("", obj, "foo", "bar");
    });
    it("throws for missing keys", () => {
        const obj = {
            foo: "foo",
        };
        (0, chai_1.expect)(() => parsing.requireKeys("", obj, "foo", "bar")).to.throw(error_1.FirebaseError, "Expected key bar");
    });
    it("uses prefixes in error messages", () => {
        const obj = {
            foo: {
                bar: 1,
            },
        };
        (0, chai_1.expect)(() => parsing.requireKeys("foo", obj.foo, "baz")).to.throw(error_1.FirebaseError, "Expected key foo.baz");
    });
});
describe("assertKeyTypes", () => {
    const tests = [
        "string",
        "number",
        "boolean",
        "array",
        "object",
        "string?",
        "number?",
        "boolean?",
        "array?",
        "object?",
    ];
    const values = {
        null: null,
        undefined: undefined,
        number: 0,
        boolean: false,
        string: "",
        array: [],
        object: {},
    };
    for (const type of tests) {
        for (const [testType, val] of Object.entries(values)) {
            const schema = { [type]: type };
            it(`handles a ${testType} when expecting a ${type}`, () => {
                const obj = { [type]: val };
                const isNullable = type.endsWith("?");
                const baseType = type.split("?")[0];
                if (testType === "null") {
                    if (isNullable) {
                        (0, chai_1.expect)(() => parsing.assertKeyTypes("", obj, schema)).not.to.throw();
                    }
                    else {
                        (0, chai_1.expect)(() => parsing.assertKeyTypes("", obj, schema)).to.throw(error_1.FirebaseError);
                    }
                }
                else if (testType === baseType) {
                    (0, chai_1.expect)(() => parsing.assertKeyTypes("", obj, schema)).not.to.throw();
                }
                else {
                    (0, chai_1.expect)(() => parsing.assertKeyTypes("", obj, schema)).to.throw(error_1.FirebaseError);
                }
            });
        }
    }
    it("handles validator functions", () => {
        const literalCPU = {
            cpu: 1,
        };
        const symbolicCPU = {
            cpu: "gcf_gen1",
        };
        const badCPU = {
            cpu: "bad",
        };
        const schema = {
            cpu: (val) => typeof val === "number" || val === "gcf_gen1",
        };
        (0, chai_1.expect)(() => parsing.assertKeyTypes("", literalCPU, schema)).to.not.throw();
        (0, chai_1.expect)(() => parsing.assertKeyTypes("", symbolicCPU, schema)).to.not.throw();
        (0, chai_1.expect)(() => parsing.assertKeyTypes("", badCPU, schema)).to.throw();
    });
    it("Throws on superfluous keys", () => {
        const obj = { foo: "bar", number: 1 };
        (0, chai_1.expect)(() => parsing.assertKeyTypes("", obj, {
            foo: "string",
        })).to.throw(error_1.FirebaseError, /Unexpected key number/);
    });
    it("Ignores 'omit' keys", () => {
        const obj = { foo: "bar", number: 1 };
        (0, chai_1.expect)(() => parsing.assertKeyTypes("", obj, {
            foo: "string",
            number: "omit",
        })).to.throw(/Unexpected key/);
    });
    it("Handles prefixes", () => {
        const obj = {
            foo: {},
        };
        (0, chai_1.expect)(() => parsing.assertKeyTypes("outer", obj, {
            foo: "array",
        })).to.throw(error_1.FirebaseError, "Expected outer.foo to be type array");
    });
});
//# sourceMappingURL=parsing.spec.js.map