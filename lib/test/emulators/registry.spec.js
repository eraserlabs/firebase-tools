"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../emulator/types");
const registry_1 = require("../../emulator/registry");
const chai_1 = require("chai");
const fakeEmulator_1 = require("./fakeEmulator");
const os = require("os");
describe("EmulatorRegistry", () => {
    afterEach(async () => {
        await registry_1.EmulatorRegistry.stopAll();
    });
    it("should not report any running emulators when empty", () => {
        for (const name of types_1.ALL_EMULATORS) {
            (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.false;
        }
        (0, chai_1.expect)(registry_1.EmulatorRegistry.listRunning()).to.be.empty;
    });
    it("should correctly return information about a running emulator", async () => {
        const name = types_1.Emulators.FUNCTIONS;
        const emu = await fakeEmulator_1.FakeEmulator.create(name);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.false;
        await registry_1.EmulatorRegistry.start(emu);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.true;
        (0, chai_1.expect)(registry_1.EmulatorRegistry.listRunning()).to.eql([name]);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.get(name)).to.eql(emu);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.getInfo(name).port).to.eql(emu.getInfo().port);
    });
    it("once stopped, an emulator is no longer running", async () => {
        const name = types_1.Emulators.FUNCTIONS;
        const emu = await fakeEmulator_1.FakeEmulator.create(name);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.false;
        await registry_1.EmulatorRegistry.start(emu);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.true;
        await registry_1.EmulatorRegistry.stop(name);
        (0, chai_1.expect)(registry_1.EmulatorRegistry.isRunning(name)).to.be.false;
    });
    describe("#url", () => {
        let ipv4Supported = false;
        let ipv6Supported = false;
        before(() => {
            for (const ifaces of Object.values(os.networkInterfaces())) {
                if (!ifaces) {
                    continue;
                }
                for (const iface of ifaces) {
                    switch (iface.family) {
                        case "IPv4":
                            ipv4Supported = true;
                            break;
                        case "IPv6":
                            ipv6Supported = true;
                            break;
                    }
                }
            }
        });
        const name = types_1.Emulators.FUNCTIONS;
        afterEach(() => {
            return registry_1.EmulatorRegistry.stopAll();
        });
        it("should craft URL from host and port in registry", async () => {
            const emu = await fakeEmulator_1.FakeEmulator.create(name);
            await registry_1.EmulatorRegistry.start(emu);
            (0, chai_1.expect)(registry_1.EmulatorRegistry.url(name).host).to.eql(`${emu.getInfo().host}:${emu.getInfo().port}`);
        });
        it("should quote IPv6 addresses", async function () {
            if (!ipv6Supported) {
                return this.skip();
            }
            const emu = await fakeEmulator_1.FakeEmulator.create(name, "::1");
            await registry_1.EmulatorRegistry.start(emu);
            (0, chai_1.expect)(registry_1.EmulatorRegistry.url(name).host).to.eql(`[::1]:${emu.getInfo().port}`);
        });
        it("should use 127.0.0.1 instead of 0.0.0.0", async function () {
            if (!ipv4Supported) {
                return this.skip();
            }
            const emu = await fakeEmulator_1.FakeEmulator.create(name, "0.0.0.0");
            await registry_1.EmulatorRegistry.start(emu);
            (0, chai_1.expect)(registry_1.EmulatorRegistry.url(name).host).to.eql(`127.0.0.1:${emu.getInfo().port}`);
        });
        it("should use ::1 instead of ::", async function () {
            if (!ipv6Supported) {
                return this.skip();
            }
            const emu = await fakeEmulator_1.FakeEmulator.create(name, "::");
            await registry_1.EmulatorRegistry.start(emu);
            (0, chai_1.expect)(registry_1.EmulatorRegistry.url(name).host).to.eql(`[::1]:${emu.getInfo().port}`);
        });
        it("should use protocol from request if available", async () => {
            const emu = await fakeEmulator_1.FakeEmulator.create(name);
            await registry_1.EmulatorRegistry.start(emu);
            const req = { protocol: "https", headers: {} };
            (0, chai_1.expect)(registry_1.EmulatorRegistry.url(name, req).protocol).to.eql(`https:`);
            (0, chai_1.expect)(registry_1.EmulatorRegistry.url(name, req).host).to.eql(`${emu.getInfo().host}:${emu.getInfo().port}`);
        });
        it("should use host from request if available", async () => {
            const emu = await fakeEmulator_1.FakeEmulator.create(name);
            await registry_1.EmulatorRegistry.start(emu);
            const hostFromHeader = "mydomain.example.test:9999";
            const req = {
                protocol: "http",
                headers: { host: hostFromHeader },
            };
            (0, chai_1.expect)(registry_1.EmulatorRegistry.url(name, req).host).to.eql(hostFromHeader);
        });
    });
});
//# sourceMappingURL=registry.spec.js.map