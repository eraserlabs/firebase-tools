"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const rc_1 = require("../rc");
const checkValidTargetFilters_1 = require("../checkValidTargetFilters");
const SAMPLE_OPTIONS = {
    cwd: "/",
    configPath: "/",
    config: {},
    only: "",
    except: "",
    nonInteractive: false,
    json: false,
    interactive: false,
    debug: false,
    force: false,
    filteredTargets: [],
    rc: new rc_1.RC(),
};
const UNFILTERABLE_TARGETS = ["remoteconfig", "extensions"];
describe("checkValidTargetFilters", () => {
    it("should resolve", async () => {
        const options = Object.assign(SAMPLE_OPTIONS, {
            only: "functions",
        });
        await (0, chai_1.expect)((0, checkValidTargetFilters_1.checkValidTargetFilters)(options)).to.be.fulfilled;
    });
    it("should resolve if there are no 'only' targets specified", async () => {
        const options = Object.assign(SAMPLE_OPTIONS, {
            only: null,
        });
        await (0, chai_1.expect)((0, checkValidTargetFilters_1.checkValidTargetFilters)(options)).to.be.fulfilled;
    });
    it("should error if an only option and except option have been provided", async () => {
        const options = Object.assign(SAMPLE_OPTIONS, {
            only: "functions",
            except: "hosting",
        });
        await (0, chai_1.expect)((0, checkValidTargetFilters_1.checkValidTargetFilters)(options)).to.be.rejectedWith("Cannot specify both --only and --except");
    });
    UNFILTERABLE_TARGETS.forEach((target) => {
        it(`should error if non-filter-type target (${target}) has filters`, async () => {
            const options = Object.assign(SAMPLE_OPTIONS, {
                only: `${target}:filter`,
                except: null,
            });
            await (0, chai_1.expect)((0, checkValidTargetFilters_1.checkValidTargetFilters)(options)).to.be.rejectedWith(/Filters specified with colons \(e.g. --only functions:func1,functions:func2\) are only supported for .*/);
        });
    });
    it("should error if the same target is specified with and without a filter", async () => {
        const options = Object.assign(SAMPLE_OPTIONS, {
            only: "functions,functions:filter",
        });
        await (0, chai_1.expect)((0, checkValidTargetFilters_1.checkValidTargetFilters)(options)).to.be.rejectedWith('Cannot specify "--only functions" and "--only functions:<filter>" at the same time');
    });
});
//# sourceMappingURL=checkValidTargetFilters.spec.js.map