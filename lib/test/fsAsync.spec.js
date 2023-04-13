"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const crypto = require("crypto");
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const rimraf_1 = require("rimraf");
const fsAsync = require("../fsAsync");
describe("fsAsync", () => {
    let baseDir = "";
    const files = [
        ".hidden",
        "visible",
        "subdir/subfile",
        "subdir/nesteddir/nestedfile",
        "subdir/node_modules/nestednodemodules",
        "node_modules/subfile",
    ];
    before(() => {
        baseDir = path.join(os.tmpdir(), crypto.randomBytes(10).toString("hex"));
        fs.mkdirSync(baseDir);
        fs.mkdirSync(path.join(baseDir, "subdir"));
        fs.mkdirSync(path.join(baseDir, "subdir", "nesteddir"));
        fs.mkdirSync(path.join(baseDir, "subdir", "node_modules"));
        fs.mkdirSync(path.join(baseDir, "node_modules"));
        for (const file of files) {
            fs.writeFileSync(path.join(baseDir, file), file);
        }
    });
    after(() => {
        (0, rimraf_1.sync)(baseDir);
        (0, chai_1.expect)(() => {
            fs.statSync(baseDir);
        }).to.throw();
    });
    describe("readdirRecursive", () => {
        it("can recurse directories", async () => {
            const results = await fsAsync.readdirRecursive({ path: baseDir });
            const gotFileNames = results.map((r) => r.name).sort();
            const expectFiles = files.map((file) => path.join(baseDir, file)).sort();
            return (0, chai_1.expect)(gotFileNames).to.deep.equal(expectFiles);
        });
        it("can ignore directories", async () => {
            const results = await fsAsync.readdirRecursive({ path: baseDir, ignore: ["node_modules"] });
            const gotFileNames = results.map((r) => r.name).sort();
            const expectFiles = files
                .filter((file) => !file.includes("node_modules"))
                .map((file) => path.join(baseDir, file))
                .sort();
            return (0, chai_1.expect)(gotFileNames).to.deep.equal(expectFiles);
        });
        it("supports blob rules", async () => {
            const results = await fsAsync.readdirRecursive({
                path: baseDir,
                ignore: ["**/node_modules/**"],
            });
            const gotFileNames = results.map((r) => r.name).sort();
            const expectFiles = files
                .filter((file) => !file.includes("node_modules"))
                .map((file) => path.join(baseDir, file))
                .sort();
            return (0, chai_1.expect)(gotFileNames).to.deep.equal(expectFiles);
        });
        it("should support negation rules", async () => {
            const results = await fsAsync.readdirRecursive({ path: baseDir, ignore: ["!visible"] });
            const gotFileNames = results.map((r) => r.name).sort();
            const expectFiles = files
                .filter((file) => file === "visible")
                .map((file) => path.join(baseDir, file))
                .sort();
            return (0, chai_1.expect)(gotFileNames).to.deep.equal(expectFiles);
        });
    });
});
//# sourceMappingURL=fsAsync.spec.js.map