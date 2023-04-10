"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FakeEmulator = void 0;
const ExpressBasedEmulator_1 = require("../../emulator/ExpressBasedEmulator");
const portUtils_1 = require("../../emulator/portUtils");
class FakeEmulator extends ExpressBasedEmulator_1.ExpressBasedEmulator {
    constructor(name, listen) {
        super({ listen, noBodyParser: true, noCors: true });
        this.name = name;
    }
    getName() {
        return this.name;
    }
    static async create(name, host = "127.0.0.1") {
        const listen = await (0, portUtils_1.resolveHostAndAssignPorts)({
            [name]: {
                host,
                port: 4000,
            },
        });
        return new FakeEmulator(name, listen[name]);
    }
}
exports.FakeEmulator = FakeEmulator;
//# sourceMappingURL=fakeEmulator.js.map