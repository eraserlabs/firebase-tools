"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const path = require("path");
const downloadableEmulators = require("../../emulator/downloadableEmulators");
const types_1 = require("../../emulator/types");
function checkDownloadPath(name) {
    const emulator = downloadableEmulators.getDownloadDetails(name);
    (0, chai_1.expect)(path.basename(emulator.opts.remoteUrl)).to.eq(path.basename(emulator.downloadPath));
}
describe("downloadDetails", () => {
    it("should match the basename of remoteUrl", () => {
        checkDownloadPath(types_1.Emulators.FIRESTORE);
        checkDownloadPath(types_1.Emulators.DATABASE);
        checkDownloadPath(types_1.Emulators.PUBSUB);
    });
});
//# sourceMappingURL=downloadableEmulators.spec.js.map