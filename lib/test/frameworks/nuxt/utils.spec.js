"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fsExtra = require("fs-extra");
const sinon = require("sinon");
const frameworksFunctions = require("../../../frameworks");
const nuxt2_1 = require("../../../frameworks/nuxt2");
const nuxt_1 = require("../../../frameworks/nuxt");
describe("Nuxt 2 utils", () => {
    describe("nuxtAppDiscovery", () => {
        let sandbox;
        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });
        afterEach(() => {
            sandbox.restore();
        });
        it("should find a Nuxt 2 app", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            sandbox.stub(frameworksFunctions, "findDependency").returns({
                version: "2.15.8",
                resolved: "https://registry.npmjs.org/nuxt/-/nuxt-2.15.8.tgz",
                overridden: false,
            });
            (0, chai_1.expect)(await (0, nuxt2_1.discover)(".")).to.deep.equal({ mayWantBackend: true });
        });
        it("should find a Nuxt 3 app", async () => {
            sandbox.stub(fsExtra, "pathExists").resolves(true);
            sandbox.stub(frameworksFunctions, "findDependency").returns({
                version: "3.0.0",
                resolved: "https://registry.npmjs.org/nuxt/-/nuxt-3.0.0.tgz",
                overridden: false,
            });
            (0, chai_1.expect)(await (0, nuxt_1.discover)(".")).to.deep.equal({ mayWantBackend: true });
        });
    });
});
//# sourceMappingURL=utils.spec.js.map