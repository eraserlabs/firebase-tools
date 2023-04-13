"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const pricing = require("../../../deploy/functions/pricing");
const ENDPOINT_FRAGMENT = {
    id: "function",
    project: "project",
    entryPoint: "foobar",
    runtime: "nodejs16",
    httpsTrigger: {},
};
const INVALID_REGION = { region: "fillory" };
describe("Functions Pricing", () => {
    describe("canCalculateMinInstanceCost", () => {
        it("Can calculate the $0 cost of a function without min instances", () => {
            (0, chai_1.expect)(pricing.canCalculateMinInstanceCost(Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1" }))).to.be.true;
            (0, chai_1.expect)(pricing.canCalculateMinInstanceCost(Object.assign(Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv2" }), INVALID_REGION))).to.be.true;
        });
        it("Can calculate the cost of a well formed v1 function", () => {
            (0, chai_1.expect)(pricing.canCalculateMinInstanceCost(Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 10 }))).to.be.true;
        });
        it("Can calculate the cost of a well formed v2 function", () => {
            (0, chai_1.expect)(pricing.canCalculateMinInstanceCost(Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv2", region: "us-central1", minInstances: 10 }))).to.be.true;
        });
        it("Cannot calculate the cost of an unknown instance size", () => {
            (0, chai_1.expect)(pricing.canCalculateMinInstanceCost(Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 10, availableMemoryMb: 0xdeadbeef }))).to.be.false;
        });
        it("Cannot calculate the cost for an unknown region", () => {
            (0, chai_1.expect)(pricing.canCalculateMinInstanceCost(Object.assign(Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), INVALID_REGION), { platform: "gcfv1", minInstances: 10 }))).to.be.false;
        });
    });
    describe("monthlyMinInstanceCost", () => {
        const SECONDS_PER_MONTH = 60 * 60 * 24 * 30;
        const v1CostAfterDiscounts = (ramCost, cpuCost) => {
            ramCost = Math.max(ramCost - pricing.V1_FREE_TIER.memoryGb * pricing.V1_RATES.memoryGb[1], 0);
            cpuCost = Math.max(cpuCost - pricing.V1_FREE_TIER.cpuGhz * pricing.V1_RATES.cpuGhz[1], 0);
            return ramCost + cpuCost;
        };
        const v2CostAfterDiscounts = (ramCost, cpuCost) => {
            ramCost = Math.max(ramCost - pricing.V2_FREE_TIER.memoryGb * pricing.V2_RATES.memoryGb[1], 0);
            cpuCost = Math.max(cpuCost - pricing.V2_FREE_TIER.vCpu * pricing.V2_RATES.vCpu[1], 0);
            return ramCost + cpuCost;
        };
        it("can calculate a v1 tier1 bill", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 1, availableMemoryMb: 256 }),
            ]);
            const ramCost = pricing.V1_RATES.memoryGb[1] * 0.25 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V1_RATES.idleCpuGhz[1] * 0.4 * SECONDS_PER_MONTH;
            const expected = v1CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("doesn't estimate bills for unreserved instances", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 1, availableMemoryMb: 256 }),
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 0 }),
            ]);
            const ramCost = pricing.V1_RATES.memoryGb[1] * 0.25 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V1_RATES.idleCpuGhz[1] * 0.4 * SECONDS_PER_MONTH;
            const expected = v1CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("can calculate a bill for a two reserved instances", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 2, availableMemoryMb: 256 }),
            ]);
            const ramCost = pricing.V1_RATES.memoryGb[1] * 0.25 * 2 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V1_RATES.idleCpuGhz[1] * 0.4 * 2 * SECONDS_PER_MONTH;
            const expected = v1CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("Can calculate a v1 tier1 bill for a two reserved instance between two functions", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 1, availableMemoryMb: 256 }),
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 1 }),
            ]);
            const ramCost = pricing.V1_RATES.memoryGb[1] * 0.25 * 2 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V1_RATES.idleCpuGhz[1] * 0.4 * 2 * SECONDS_PER_MONTH;
            const expected = v1CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("can calculate a v1 tier2 bill", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "europe-west3", minInstances: 1, availableMemoryMb: 256 }),
            ]);
            const ramCost = pricing.V1_RATES.memoryGb[2] * 0.25 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V1_RATES.idleCpuGhz[2] * 0.4 * SECONDS_PER_MONTH;
            const expected = v1CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("can calculate a v1 bill for large instances", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "europe-west3", minInstances: 1, availableMemoryMb: 8192 }),
            ]);
            const ramCost = pricing.V1_RATES.memoryGb[2] * 8 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V1_RATES.idleCpuGhz[2] * 4.8 * SECONDS_PER_MONTH;
            const expected = v1CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("can calculate a v2 tier1 bill", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv2", region: "us-central1", minInstances: 1, availableMemoryMb: 256, cpu: 1 }),
            ]);
            const ramCost = pricing.V2_RATES.memoryGb[1] * 0.25 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V2_RATES.idleVCpu[1] * SECONDS_PER_MONTH;
            const expected = v2CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("can calculate a v2 tier2 bill", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv2", region: "europe-west3", minInstances: 1, availableMemoryMb: 256, cpu: 1 }),
            ]);
            const ramCost = pricing.V2_RATES.memoryGb[2] * 0.25 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V2_RATES.idleVCpu[2] * SECONDS_PER_MONTH;
            const expected = v2CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("can calculate a v2 bill for large instances", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv2", region: "europe-west3", minInstances: 1, availableMemoryMb: 4096, cpu: 2 }),
            ]);
            const ramCost = pricing.V2_RATES.memoryGb[2] * 4 * SECONDS_PER_MONTH;
            const cpuCost = pricing.V2_RATES.idleVCpu[2] * 2 * SECONDS_PER_MONTH;
            const expected = v2CostAfterDiscounts(ramCost, cpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
        it("calculates v1 and v2 discounts separately", () => {
            const cost = pricing.monthlyMinInstanceCost([
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv1", region: "us-central1", minInstances: 1 }),
                Object.assign(Object.assign({}, ENDPOINT_FRAGMENT), { platform: "gcfv2", region: "us-central1", minInstances: 1, cpu: 1 }),
            ]);
            const v1RamCost = pricing.V1_RATES.memoryGb[1] * 0.25 * SECONDS_PER_MONTH;
            const v1CpuCost = pricing.V1_RATES.idleCpuGhz[1] * 0.4 * SECONDS_PER_MONTH;
            const v2RamCost = pricing.V2_RATES.memoryGb[1] * 0.25 * SECONDS_PER_MONTH;
            const v2CpuCost = pricing.V2_RATES.idleVCpu[1] * SECONDS_PER_MONTH;
            const expected = v1CostAfterDiscounts(v1RamCost, v1CpuCost) + v2CostAfterDiscounts(v2RamCost, v2CpuCost);
            (0, chai_1.expect)(cost).to.equal(expected);
        });
    });
});
//# sourceMappingURL=pricing.spec.js.map