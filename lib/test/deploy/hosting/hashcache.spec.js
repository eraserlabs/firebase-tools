"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const tmp = require("tmp");
const hashcache_1 = require("../../../deploy/hosting/hashcache");
tmp.setGracefulCleanup();
describe("hashcache", () => {
    it("should return an empty object if a file doesn't exist", () => {
        (0, chai_1.expect)((0, hashcache_1.load)("cwd-doesnt-exist", "somename")).to.deep.equal(new Map());
    });
    it("should be able to dump configuration to a file", () => {
        const dir = tmp.dirSync();
        const name = "testcache";
        const data = new Map([["foo", { mtime: 0, hash: "deadbeef" }]]);
        (0, chai_1.expect)(() => (0, hashcache_1.dump)(dir.name, name, data)).to.not.throw();
        (0, chai_1.expect)((0, fs_extra_1.existsSync)((0, path_1.join)(dir.name, ".firebase", `hosting.${name}.cache`))).to.be.true;
        (0, chai_1.expect)((0, fs_extra_1.readFileSync)((0, path_1.join)(dir.name, ".firebase", `hosting.${name}.cache`), "utf8")).to.equal("foo,0,deadbeef\n");
    });
    it("should be able to load configuration from a file", () => {
        const dir = tmp.dirSync();
        const name = "testcache";
        (0, fs_extra_1.mkdirpSync)((0, path_1.join)(dir.name, ".firebase"));
        (0, fs_extra_1.writeFileSync)((0, path_1.join)(dir.name, ".firebase", `hosting.${name}.cache`), "bar,4,alivebeef\n");
        (0, chai_1.expect)((0, hashcache_1.load)(dir.name, name)).to.deep.equal(new Map([["bar", { mtime: 4, hash: "alivebeef" }]]));
    });
});
//# sourceMappingURL=hashcache.spec.js.map