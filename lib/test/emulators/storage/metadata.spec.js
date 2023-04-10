"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const metadata_1 = require("../../../emulator/storage/metadata");
describe("toSerializedDate", () => {
    it("correctly serializes date", () => {
        const testDate = new Date("2022-01-01T00:00:00.000Z");
        (0, chai_1.expect)((0, metadata_1.toSerializedDate)(testDate)).to.equal("2022-01-01T00:00:00.000Z");
    });
    it("correctly serializes date with different timezone", () => {
        const testDate = new Date("2022-01-01T00:00:00.000+07:00");
        (0, chai_1.expect)((0, metadata_1.toSerializedDate)(testDate)).to.equal("2021-12-31T17:00:00.000Z");
    });
});
//# sourceMappingURL=metadata.spec.js.map