"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sourceTokenScraper_1 = require("../../../../deploy/functions/release/sourceTokenScraper");
describe("SourceTokenScraper", () => {
    it("immediately provides the first result", async () => {
        const scraper = new sourceTokenScraper_1.SourceTokenScraper();
        await (0, chai_1.expect)(scraper.getToken()).to.eventually.be.undefined;
    });
    it("provides results after the first operation completes", async () => {
        const scraper = new sourceTokenScraper_1.SourceTokenScraper();
        await (0, chai_1.expect)(scraper.getToken()).to.eventually.be.undefined;
        let gotResult = false;
        const timeout = new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error("Timeout")), 10);
        });
        const getResult = (async () => {
            await scraper.getToken();
            gotResult = true;
        })();
        await (0, chai_1.expect)(Promise.race([getResult, timeout])).to.be.rejectedWith("Timeout");
        (0, chai_1.expect)(gotResult).to.be.false;
        scraper.poller({ done: true });
        await (0, chai_1.expect)(getResult).to.eventually.be.undefined;
    });
    it("provides tokens from an operation", async () => {
        const scraper = new sourceTokenScraper_1.SourceTokenScraper();
        await (0, chai_1.expect)(scraper.getToken()).to.eventually.be.undefined;
        scraper.poller({
            metadata: {
                sourceToken: "magic token",
                target: "projects/p/locations/l/functions/f",
            },
        });
        await (0, chai_1.expect)(scraper.getToken()).to.eventually.equal("magic token");
    });
    it("refreshes token after timer expires", async () => {
        const scraper = new sourceTokenScraper_1.SourceTokenScraper(10);
        await (0, chai_1.expect)(scraper.getToken()).to.eventually.be.undefined;
        scraper.poller({
            metadata: {
                sourceToken: "magic token",
                target: "projects/p/locations/l/functions/f",
            },
        });
        await (0, chai_1.expect)(scraper.getToken()).to.eventually.equal("magic token");
        const timeout = (duration) => {
            return new Promise((resolve) => setTimeout(resolve, duration));
        };
        await timeout(50);
        await (0, chai_1.expect)(scraper.getToken()).to.eventually.be.undefined;
        scraper.poller({
            metadata: {
                sourceToken: "magic token #2",
                target: "projects/p/locations/l/functions/f",
            },
        });
        await (0, chai_1.expect)(scraper.getToken()).to.eventually.equal("magic token #2");
    });
    it("concurrent requests for source token", async () => {
        const scraper = new sourceTokenScraper_1.SourceTokenScraper();
        const promises = [];
        for (let i = 0; i < 3; i++) {
            promises.push(scraper.getToken());
        }
        scraper.poller({
            metadata: {
                sourceToken: "magic token",
                target: "projects/p/locations/l/functions/f",
            },
        });
        let successes = 0;
        const tokens = await Promise.all(promises);
        for (const tok of tokens) {
            if (tok === "magic token") {
                successes++;
            }
        }
        (0, chai_1.expect)(tokens.includes(undefined)).to.be.true;
        (0, chai_1.expect)(successes).to.equal(2);
    });
});
//# sourceMappingURL=sourceTokenScraper.spec.js.map