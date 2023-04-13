"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeListRemote = void 0;
const chai = require("chai");
const expect = chai.expect;
class FakeListRemote {
    constructor(data) {
        this.data = data;
        this.delay = 0;
    }
    listPath(path, numChildren, startAfter, timeout) {
        if (timeout === 0) {
            return Promise.reject(new Error("timeout"));
        }
        const d = this.dataAtPath(path);
        if (d) {
            let keys = Object.keys(d);
            if (startAfter) {
                keys = keys.filter((key) => key > startAfter);
            }
            keys = keys.slice(0, numChildren);
            return Promise.resolve(keys);
        }
        return Promise.resolve([]);
    }
    size(data) {
        if (typeof data === "number") {
            return data;
        }
        let size = 0;
        for (const key of Object.keys(data)) {
            size += this.size(data[key]);
        }
        return size;
    }
    dataAtPath(path) {
        const splitedPath = path.slice(1).split("/");
        let d = this.data;
        for (const p of splitedPath) {
            if (d && p !== "") {
                if (typeof d === "number") {
                    d = null;
                }
                else {
                    d = d[p];
                }
            }
        }
        return d;
    }
}
exports.FakeListRemote = FakeListRemote;
describe("FakeListRemote", () => {
    it("should return limit the number of subpaths returned", async () => {
        const fakeDb = new FakeListRemote({ 1: 1, 2: 2, 3: 3, 4: 4 });
        await expect(fakeDb.listPath("/", 4)).to.eventually.eql(["1", "2", "3", "4"]);
        await expect(fakeDb.listPath("/", 3)).to.eventually.eql(["1", "2", "3"]);
        await expect(fakeDb.listPath("/", 2)).to.eventually.eql(["1", "2"]);
        await expect(fakeDb.listPath("/", 1)).to.eventually.eql(["1"]);
        await expect(fakeDb.listPath("/", 4, "1")).to.eventually.eql(["2", "3", "4"]);
        await expect(fakeDb.listPath("/", 4, "2")).to.eventually.eql(["3", "4"]);
        await expect(fakeDb.listPath("/", 4, "3")).to.eventually.eql(["4"]);
        await expect(fakeDb.listPath("/", 4, "4")).to.eventually.eql([]);
        await expect(fakeDb.listPath("/", 3, "1")).to.eventually.eql(["2", "3", "4"]);
        await expect(fakeDb.listPath("/", 3, "2")).to.eventually.eql(["3", "4"]);
        await expect(fakeDb.listPath("/", 3, "3")).to.eventually.eql(["4"]);
        await expect(fakeDb.listPath("/", 3, "3")).to.eventually.eql(["4"]);
        await expect(fakeDb.listPath("/", 3, "4")).to.eventually.eql([]);
        await expect(fakeDb.listPath("/", 1, "1")).to.eventually.eql(["2"]);
        await expect(fakeDb.listPath("/", 1, "2")).to.eventually.eql(["3"]);
        await expect(fakeDb.listPath("/", 1, "3")).to.eventually.eql(["4"]);
        await expect(fakeDb.listPath("/", 1, "4")).to.eventually.eql([]);
        await expect(fakeDb.listPath("/", 1, "1", 0)).to.be.rejected;
    });
});
//# sourceMappingURL=fakeListRemote.spec.js.map