"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../emulator/types");
const registry_1 = require("../../emulator/registry");
const chai_1 = require("chai");
const fakeEmulator_1 = require("./fakeEmulator");
describe("EmulatorController", () => {
    afterEach(async () => {
        await registry_1.EmulatorRegistry.stopAll();
    });
    it("should start and stop an emulator", async () => {
        const name = types_1.Emulators.FUNCTIONS;
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.false;
        const fake = await fakeEmulator_1.FakeEmulator.create(name);
        await registry_1.EmulatorRegistry.start(fake);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.true;
        (0, chai_1.expect)(registry_1.EmulatorRegistry.getInfo(name).port).to.eql(fake.getInfo().port);
    });
});
//# sourceMappingURL=controller.spec.js.map