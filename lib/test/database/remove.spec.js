"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const remove_1 = require("../../database/remove");
const fakeRemoveRemote_spec_1 = require("./fakeRemoveRemote.spec");
const fakeListRemote_spec_1 = require("./fakeListRemote.spec");
const HOST = "https://firebaseio.com";
describe("DatabaseRemove", () => {
    it("should remove tiny tree", async () => {
        const fakeDb = new fakeRemoveRemote_spec_1.FakeRemoveRemote({ c: 1 });
        const removeOps = new remove_1.default("test-tiny-tree", "/", HOST, false);
        removeOps.remote = fakeDb;
        await removeOps.execute();
        (0, chai_1.expect)(fakeDb.data).to.eql(null);
    });
    it("should remove subtree at /a/b/c", async () => {
        const data = {
            a: {
                b: { x: { y: 1 } },
                c: { x: 4, y: 8 },
                d: 10,
            },
            d: {
                e: 3,
            },
        };
        const fakeList = new fakeListRemote_spec_1.FakeListRemote(data);
        const fakeDb = new fakeRemoveRemote_spec_1.FakeRemoveRemote(data);
        const removeOps = new remove_1.default("test-sub-path", "/a", HOST, false);
        removeOps.remote = fakeDb;
        removeOps.listRemote = fakeList;
        await removeOps.execute();
        (0, chai_1.expect)(fakeDb.data).to.eql({
            d: {
                e: 3,
            },
        });
    });
    function buildData(branchFactor, depth) {
        if (depth === 0) {
            return 1;
        }
        const d = {};
        for (let i = 0; i < branchFactor; i++) {
            d[`${i}`] = buildData(branchFactor, depth - 1);
        }
        return d;
    }
    function databaseRemoveTestSuit(threshold) {
        describe(`DatabaseRemove when largeThreshold=${threshold}`, () => {
            it("should remove nested tree", async () => {
                const data = buildData(3, 5);
                const fakeDb = new fakeRemoveRemote_spec_1.FakeRemoveRemote(data, threshold);
                const fakeLister = new fakeListRemote_spec_1.FakeListRemote(data);
                const removeOps = new remove_1.default("test-nested-tree", "/", HOST, false);
                removeOps.remote = fakeDb;
                removeOps.listRemote = fakeLister;
                await removeOps.execute();
                (0, chai_1.expect)(fakeDb.data).to.eql(null);
            });
            it("should remove flat tree when threshold=${threshold}", async () => {
                const data = buildData(1232, 1);
                const fakeDb = new fakeRemoveRemote_spec_1.FakeRemoveRemote(data, threshold);
                const fakeList = new fakeListRemote_spec_1.FakeListRemote(data);
                const removeOps = new remove_1.default("test-remover", "/", HOST, false);
                removeOps.remote = fakeDb;
                removeOps.listRemote = fakeList;
                await removeOps.execute();
                (0, chai_1.expect)(fakeDb.data).to.eql(null);
            });
        });
    }
    databaseRemoveTestSuit(100);
    databaseRemoveTestSuit(10);
    databaseRemoveTestSuit(1);
});
//# sourceMappingURL=remove.spec.js.map