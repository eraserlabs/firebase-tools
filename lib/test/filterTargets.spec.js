"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const filterTargets_1 = require("../filterTargets");
const rc_1 = require("../rc");
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
const VALID_TARGETS = ["hosting", "functions"];
describe("filterTargets", () => {
    it("should leave targets alone if no filtering is specified", () => {
        const o = Object.assign(SAMPLE_OPTIONS, {
            config: {
                has: () => true,
            },
        });
        (0, chai_1.expect)((0, filterTargets_1.filterTargets)(o, VALID_TARGETS)).to.deep.equal(["hosting", "functions"]);
    });
    it("should filter targets from --only", () => {
        const o = Object.assign(SAMPLE_OPTIONS, {
            config: {
                has: () => true,
            },
            only: "hosting",
        });
        (0, chai_1.expect)((0, filterTargets_1.filterTargets)(o, VALID_TARGETS)).to.deep.equal(["hosting"]);
    });
    it("should filter out targets with --except", () => {
        const o = Object.assign(SAMPLE_OPTIONS, {
            config: {
                has: () => true,
            },
            except: "functions",
        });
        (0, chai_1.expect)((0, filterTargets_1.filterTargets)(o, VALID_TARGETS)).to.deep.equal(["hosting"]);
    });
});
//# sourceMappingURL=filterTargets.spec.js.map