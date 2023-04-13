"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const utils = require("../utils");
describe("api", () => {
    beforeEach(() => {
        delete require.cache[require.resolve("../api")];
    });
    afterEach(() => {
        delete process.env.FIRESTORE_EMULATOR_HOST;
        delete process.env.FIRESTORE_URL;
        utils.envOverrides.length = 0;
    });
    after(() => {
        delete require.cache[require.resolve("../api")];
    });
    it("should override with FIRESTORE_URL", () => {
        process.env.FIRESTORE_URL = "http://foobar.com";
        const api = require("../api");
        (0, chai_1.expect)(api.firestoreOrigin).to.eq("http://foobar.com");
    });
    it("should prefer FIRESTORE_EMULATOR_HOST to FIRESTORE_URL", () => {
        process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
        process.env.FIRESTORE_URL = "http://foobar.com";
        const api = require("../api");
        (0, chai_1.expect)(api.firestoreOriginOrEmulator).to.eq("http://localhost:8080");
    });
});
//# sourceMappingURL=api.spec.js.map