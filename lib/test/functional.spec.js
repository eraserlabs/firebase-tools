"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const lodash_1 = require("lodash");
const f = require("../functional");
describe("functional", () => {
    describe("flatten", () => {
        it("can iterate an empty object", () => {
            (0, chai_1.expect)([...f.flatten({})]).to.deep.equal([]);
        });
        it("can iterate an object that's already flat", () => {
            (0, chai_1.expect)([...f.flatten({ a: "b" })]).to.deep.equal([["a", "b"]]);
        });
        it("Gets the right type for flattening arrays", () => {
            const arr = [[["a"], "b"], ["c"]];
            const flattened = [...f.flattenArray(arr)];
            const test = true;
            (0, chai_1.expect)(test).to.be.true;
        });
        it("can handle nested objects", () => {
            const init = {
                outer: {
                    inner: {
                        value: 42,
                    },
                },
                other: {
                    value: null,
                },
            };
            const expected = [
                ["outer.inner.value", 42],
                ["other.value", null],
            ];
            (0, chai_1.expect)([...f.flatten(init)]).to.deep.equal(expected);
        });
        it("can handle objects with array values", () => {
            const init = { values: ["a", "b"] };
            const expected = [
                ["values.0", "a"],
                ["values.1", "b"],
            ];
            (0, chai_1.expect)([...f.flatten(init)]).to.deep.equal(expected);
        });
        it("can iterate an empty array", () => {
            (0, chai_1.expect)([...(0, lodash_1.flatten)([])]).to.deep.equal([]);
        });
        it("can noop arrays", () => {
            const init = ["a", "b", "c"];
            (0, chai_1.expect)([...f.flatten(init)]).to.deep.equal(init);
        });
        it("can flatten", () => {
            const init = [[[1]], [2], 3];
            (0, chai_1.expect)([...f.flatten(init)]).to.deep.equal([1, 2, 3]);
        });
    });
    describe("reduceFlat", () => {
        it("can noop", () => {
            const init = ["a", "b", "c"];
            (0, chai_1.expect)(init.reduce(f.reduceFlat, [])).to.deep.equal(["a", "b", "c"]);
        });
        it("can flatten", () => {
            const init = [[[1]], [2], 3];
            (0, chai_1.expect)(init.reduce(f.reduceFlat, [])).to.deep.equal([1, 2, 3]);
        });
    });
    describe("zip", () => {
        it("can handle an empty array", () => {
            (0, chai_1.expect)([...f.zip([], [])]).to.deep.equal([]);
        });
        it("can zip", () => {
            (0, chai_1.expect)([...f.zip([1], ["a"])]).to.deep.equal([[1, "a"]]);
        });
        it("throws on length mismatch", () => {
            (0, chai_1.expect)(() => [...f.zip([1], [])]).to.throw();
        });
    });
    it("zipIn", () => {
        (0, chai_1.expect)([1, 2].map(f.zipIn(["a", "b"]))).to.deep.equal([
            [1, "a"],
            [2, "b"],
        ]);
    });
    it("assertExhaustive", () => {
        function passtime(animal) {
            if (animal.type === "bird") {
                return "fly";
            }
            else if (animal.type === "fish") {
                return "swim";
            }
            f.assertExhaustive(animal);
        }
        function speak(animal) {
            if (animal.type === "bird") {
                console.log("chirp");
                return;
            }
        }
    });
    describe("partition", () => {
        it("should split an array into true and false", () => {
            const arr = ["T1", "F1", "T2", "F2"];
            (0, chai_1.expect)(f.partition(arr, (s) => s.startsWith("T"))).to.deep.equal([
                ["T1", "T2"],
                ["F1", "F2"],
            ]);
        });
        it("can handle an empty array", () => {
            (0, chai_1.expect)(f.partition([], (s) => s.startsWith("T"))).to.deep.equal([[], []]);
        });
    });
    describe("partitionRecord", () => {
        it("should split a record into true and false", () => {
            const rec = { T1: 1, F1: 2, T2: 3, F2: 4 };
            (0, chai_1.expect)(f.partitionRecord(rec, (s) => s.startsWith("T"))).to.deep.equal([
                { T1: 1, T2: 3 },
                { F1: 2, F2: 4 },
            ]);
        });
        it("can handle an empty record", () => {
            (0, chai_1.expect)(f.partitionRecord({}, (s) => s.startsWith("T"))).to.deep.equal([
                {},
                {},
            ]);
        });
    });
});
//# sourceMappingURL=functional.spec.js.map