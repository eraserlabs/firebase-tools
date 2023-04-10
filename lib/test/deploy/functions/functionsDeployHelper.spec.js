"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const backend = require("../../../deploy/functions/backend");
const helper = require("../../../deploy/functions/functionsDeployHelper");
const projectConfig_1 = require("../../../functions/projectConfig");
const functionsDeployHelper_1 = require("../../../deploy/functions/functionsDeployHelper");
describe("functionsDeployHelper", () => {
    const ENDPOINT = {
        id: "foo",
        platform: "gcfv1",
        project: "project",
        region: "us-central1",
        runtime: "nodejs16",
        entryPoint: "function",
        httpsTrigger: {},
        codebase: projectConfig_1.DEFAULT_CODEBASE,
    };
    const BASE_FILTER = {
        codebase: projectConfig_1.DEFAULT_CODEBASE,
    };
    describe("endpointMatchesFilter", () => {
        it("should match empty filter", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "id" });
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { idChunks: [] }))).to.be.true;
        });
        it("should match full names", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "id" });
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["id"] }))).to.be.true;
        });
        it("should match group prefixes", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "group-subgroup-func" });
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["group", "subgroup", "func"] }))).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["group", "subgroup"] }))).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["group"] }))).to.be
                .true;
        });
        it("should not match function that id that don't match", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "id" });
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["group"] }))).to.be
                .false;
        });
        it("should not match function in different codebase", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "group-subgroup-func" });
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { codebase: "another-codebase", idChunks: ["group", "subgroup", "func"] }))).to.be.false;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { codebase: "another-codebase", idChunks: ["group", "subgroup"] }))).to.be.false;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { codebase: "another-codebase", idChunks: ["group"] }))).to.be.false;
        });
        it("should match function if backend's codebase is undefined", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "group-subgroup-func" });
            delete func.codebase;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { codebase: "my-codebase", idChunks: ["group", "subgroup", "func"] }))).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { codebase: "my-codebase", idChunks: ["group", "subgroup"] }))).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["group"] }))).to.be
                .true;
        });
        it("should match function matching ids given no codebase", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "group-subgroup-func" });
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { codebase: undefined, idChunks: ["group", "subgroup", "func"] }))).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { codebase: undefined, idChunks: ["group", "subgroup"] }))).to.be.true;
            (0, chai_1.expect)(helper.endpointMatchesFilter(func, Object.assign(Object.assign({}, BASE_FILTER), { codebase: undefined, idChunks: ["group"] }))).to.be.true;
        });
    });
    describe("endpointMatchesAnyFilters", () => {
        it("should match given no filters", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "id" });
            (0, chai_1.expect)(helper.endpointMatchesAnyFilter(func)).to.be.true;
        });
        it("should match against one filter", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "id" });
            (0, chai_1.expect)(helper.endpointMatchesAnyFilter(func, [
                Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["id"] }),
                Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["group"] }),
            ])).to.be.true;
        });
        it("should exclude functions that don't match", () => {
            const func = Object.assign(Object.assign({}, ENDPOINT), { id: "id" });
            (0, chai_1.expect)(helper.endpointMatchesAnyFilter(func, [
                Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["group"] }),
                Object.assign(Object.assign({}, BASE_FILTER), { idChunks: ["other-group"] }),
            ])).to.be.false;
        });
    });
    describe("parseFunctionSelector", () => {
        const testcases = [
            {
                desc: "parses selector without codebase",
                selector: "func",
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["func"],
                    },
                    {
                        codebase: "func",
                    },
                ],
            },
            {
                desc: "parses group selector (with '.') without codebase",
                selector: "g1.func",
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["g1", "func"],
                    },
                    {
                        codebase: "g1.func",
                    },
                ],
            },
            {
                desc: "parses group selector (with '-') without codebase",
                selector: "g1-func",
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["g1", "func"],
                    },
                    {
                        codebase: "g1-func",
                    },
                ],
            },
            {
                desc: "parses group selector (with '-') with codebase",
                selector: "node:g1-func",
                expected: [
                    {
                        codebase: "node",
                        idChunks: ["g1", "func"],
                    },
                ],
            },
        ];
        for (const tc of testcases) {
            it(tc.desc, () => {
                const actual = (0, functionsDeployHelper_1.parseFunctionSelector)(tc.selector);
                (0, chai_1.expect)(actual.length).to.equal(tc.expected.length);
                (0, chai_1.expect)(actual).to.deep.include.members(tc.expected);
            });
        }
    });
    describe("getEndpointFilters", () => {
        const testcases = [
            {
                desc: "should parse multiple selectors",
                only: "functions:myFunc,functions:myOtherFunc",
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["myFunc"],
                    },
                    {
                        codebase: "myFunc",
                    },
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["myOtherFunc"],
                    },
                    {
                        codebase: "myOtherFunc",
                    },
                ],
            },
            {
                desc: "should parse nested selector",
                only: "functions:groupA.myFunc",
                expected: [
                    {
                        codebase: projectConfig_1.DEFAULT_CODEBASE,
                        idChunks: ["groupA", "myFunc"],
                    },
                    {
                        codebase: "groupA.myFunc",
                    },
                ],
            },
            {
                desc: "should parse selector with codebase",
                only: "functions:my-codebase:myFunc,functions:another-codebase:anotherFunc",
                expected: [
                    {
                        codebase: "my-codebase",
                        idChunks: ["myFunc"],
                    },
                    {
                        codebase: "another-codebase",
                        idChunks: ["anotherFunc"],
                    },
                ],
            },
            {
                desc: "should parse nested selector with codebase",
                only: "functions:my-codebase:groupA.myFunc",
                expected: [
                    {
                        codebase: "my-codebase",
                        idChunks: ["groupA", "myFunc"],
                    },
                ],
            },
        ];
        for (const tc of testcases) {
            it(tc.desc, () => {
                const options = {
                    only: tc.only,
                };
                const actual = helper.getEndpointFilters(options);
                (0, chai_1.expect)(actual === null || actual === void 0 ? void 0 : actual.length).to.equal(tc.expected.length);
                (0, chai_1.expect)(actual).to.deep.include.members(tc.expected);
            });
        }
        it("returns undefined given no only option", () => {
            (0, chai_1.expect)(helper.getEndpointFilters({})).to.be.undefined;
        });
        it("returns undefined given no functions selector", () => {
            (0, chai_1.expect)(helper.getEndpointFilters({ only: "hosting:siteA,storage:bucketB" })).to.be.undefined;
        });
    });
    describe("targetCodebases", () => {
        const config = [
            {
                source: "foo",
                codebase: "default",
            },
            {
                source: "bar",
                codebase: "foobar",
            },
        ];
        it("returns all codebases in firebase.json with empty filters", () => {
            (0, chai_1.expect)(helper.targetCodebases(config)).to.have.members(["default", "foobar"]);
        });
        it("returns only codebases included in the filters", () => {
            const filters = [
                {
                    codebase: "default",
                },
            ];
            (0, chai_1.expect)(helper.targetCodebases(config, filters)).to.have.members(["default"]);
        });
        it("correctly deals with duplicate entries", () => {
            const filters = [
                {
                    codebase: "default",
                },
                {
                    codebase: "default",
                },
            ];
            (0, chai_1.expect)(helper.targetCodebases(config, filters)).to.have.members(["default"]);
        });
        it("returns all codebases given filter without codebase specified", () => {
            const filters = [
                {
                    idChunks: ["foo", "bar"],
                },
            ];
            (0, chai_1.expect)(helper.targetCodebases(config, filters)).to.have.members(["default", "foobar"]);
        });
    });
    describe("groupEndpointsByCodebase", () => {
        function endpointsOf(b) {
            return backend.allEndpoints(b).map((e) => backend.functionName(e));
        }
        it("groups codebase using codebase property", () => {
            const wantBackends = {
                default: backend.of(Object.assign(Object.assign({}, ENDPOINT), { id: "default-0", codebase: "default" }), Object.assign(Object.assign({}, ENDPOINT), { id: "default-1", codebase: "default" })),
                cb: backend.of(Object.assign(Object.assign({}, ENDPOINT), { id: "cb-0", codebase: "cb" }), Object.assign(Object.assign({}, ENDPOINT), { id: "cb-1", codebase: "cb" })),
            };
            const haveBackend = backend.of(Object.assign(Object.assign({}, ENDPOINT), { id: "default-0", codebase: "default" }), Object.assign(Object.assign({}, ENDPOINT), { id: "default-1", codebase: "default" }), Object.assign(Object.assign({}, ENDPOINT), { id: "cb-0", codebase: "cb" }), Object.assign(Object.assign({}, ENDPOINT), { id: "cb-1", codebase: "cb" }), Object.assign(Object.assign({}, ENDPOINT), { id: "orphan", codebase: "orphan" }));
            const got = helper.groupEndpointsByCodebase(wantBackends, backend.allEndpoints(haveBackend));
            for (const codebase of Object.keys(got)) {
                (0, chai_1.expect)(endpointsOf(got[codebase])).to.have.members(endpointsOf(wantBackends[codebase]));
            }
        });
        it("claims endpoint with matching name regardless of codebase property", () => {
            const wantBackends = {
                default: backend.of(Object.assign(Object.assign({}, ENDPOINT), { id: "default-0", codebase: "default" }), Object.assign(Object.assign({}, ENDPOINT), { id: "default-1", codebase: "default" })),
                cb: backend.of(Object.assign(Object.assign({}, ENDPOINT), { id: "cb-0", codebase: "cb" }), Object.assign(Object.assign({}, ENDPOINT), { id: "cb-1", codebase: "cb" })),
            };
            let haveBackend = backend.of(Object.assign(Object.assign({}, ENDPOINT), { id: "default-0", codebase: "cb" }), Object.assign(Object.assign({}, ENDPOINT), { id: "default-1", codebase: "cb" }), Object.assign(Object.assign({}, ENDPOINT), { id: "cb-0", codebase: "cb" }), Object.assign(Object.assign({}, ENDPOINT), { id: "cb-1", codebase: "cb" }), Object.assign(Object.assign({}, ENDPOINT), { id: "orphan", codebase: "orphan" }));
            let got = helper.groupEndpointsByCodebase(wantBackends, backend.allEndpoints(haveBackend));
            for (const codebase of Object.keys(got)) {
                (0, chai_1.expect)(endpointsOf(got[codebase])).to.have.members(endpointsOf(wantBackends[codebase]));
            }
            haveBackend = backend.of(Object.assign(Object.assign({}, ENDPOINT), { id: "default-0", codebase: "default" }), Object.assign(Object.assign({}, ENDPOINT), { id: "default-1", codebase: "default" }), Object.assign(Object.assign({}, ENDPOINT), { id: "cb-0", codebase: "default" }), Object.assign(Object.assign({}, ENDPOINT), { id: "cb-1", codebase: "default" }), Object.assign(Object.assign({}, ENDPOINT), { id: "orphan", codebase: "orphan" }));
            got = helper.groupEndpointsByCodebase(wantBackends, backend.allEndpoints(haveBackend));
            for (const codebase of Object.keys(got)) {
                (0, chai_1.expect)(endpointsOf(got[codebase])).to.have.members(endpointsOf(wantBackends[codebase]));
            }
        });
    });
});
//# sourceMappingURL=functionsDeployHelper.spec.js.map