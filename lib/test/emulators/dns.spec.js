"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const dns_1 = require("../../emulator/dns");
const IPV4_ADDR1 = { address: "169.254.20.1", family: 4 };
const IPV4_ADDR2 = { address: "169.254.20.2", family: 4 };
const IPV6_ADDR1 = { address: "fe80::1", family: 6 };
const IPV6_ADDR2 = { address: "fe80::2", family: 6 };
describe("Resolver", () => {
    describe("#lookupFirst", () => {
        it("should return the first value of result", async () => {
            const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV4_ADDR2]);
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupFirst("example.test")).to.eventually.eql(IPV4_ADDR1);
        });
        it("should prefer IPv4 addresss using the underlying lookup", async () => {
            const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV4_ADDR2]);
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupFirst("example.test")).to.eventually.eql(IPV4_ADDR1);
            (0, chai_1.expect)(lookup).to.be.calledOnceWithExactly("example.test", sinon.match({ verbatim: false }));
        });
        it("should return cached result if available", async () => {
            const lookup = sinon.fake((hostname) => {
                return hostname === "example1.test" ? [IPV4_ADDR1, IPV6_ADDR1] : [IPV4_ADDR2, IPV6_ADDR2];
            });
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupFirst("example1.test")).to.eventually.eql(IPV4_ADDR1);
            await (0, chai_1.expect)(resolver.lookupFirst("example1.test")).to.eventually.eql(IPV4_ADDR1);
            (0, chai_1.expect)(lookup).to.be.calledOnce;
            lookup.resetHistory();
            await (0, chai_1.expect)(resolver.lookupFirst("example2.test")).to.eventually.eql(IPV4_ADDR2);
            (0, chai_1.expect)(lookup).to.be.calledOnce;
        });
        it("should pre-populate localhost in cache to resolve to IPv4 loopback address", async () => {
            const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV6_ADDR1]);
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupFirst("localhost")).to.eventually.eql(dns_1.IPV4_LOOPBACK);
            (0, chai_1.expect)(lookup).not.to.be.called;
        });
        it("should parse and return IPv4 addresses without lookup", async () => {
            const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV6_ADDR1]);
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupFirst("127.0.0.1")).to.eventually.eql(dns_1.IPV4_LOOPBACK);
            (0, chai_1.expect)(lookup).not.to.be.called;
        });
        it("should parse and return IPv6 addresses without lookup", async () => {
            const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV6_ADDR1]);
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupFirst("::1")).to.eventually.eql(dns_1.IPV6_LOOPBACK);
            (0, chai_1.expect)(lookup).not.to.be.called;
        });
    });
    describe("#lookupAll", () => {
        it("should return all addresses returned", async () => {
            const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV4_ADDR2]);
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupAll("example.test")).to.eventually.eql([IPV4_ADDR1, IPV4_ADDR2]);
        });
        it("should request IPv4 addresses to be listed first using the underlying lookup", async () => {
            const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV4_ADDR2]);
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupAll("example.test")).to.eventually.eql([IPV4_ADDR1, IPV4_ADDR2]);
            (0, chai_1.expect)(lookup).to.be.calledOnceWithExactly("example.test", sinon.match({ verbatim: false }));
        });
        it("should return cached results if available", async () => {
            const lookup = sinon.fake((hostname) => {
                return hostname === "example1.test" ? [IPV4_ADDR1, IPV6_ADDR1] : [IPV4_ADDR2, IPV6_ADDR2];
            });
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupAll("example1.test")).to.eventually.eql([IPV4_ADDR1, IPV6_ADDR1]);
            await (0, chai_1.expect)(resolver.lookupAll("example1.test")).to.eventually.eql([IPV4_ADDR1, IPV6_ADDR1]);
            (0, chai_1.expect)(lookup).to.be.calledOnce;
            lookup.resetHistory();
            await (0, chai_1.expect)(resolver.lookupAll("example2.test")).to.eventually.eql([IPV4_ADDR2, IPV6_ADDR2]);
            (0, chai_1.expect)(lookup).to.be.calledOnce;
        });
        it("should pre-populate localhost in cache to resolve to IPv4 + IPv6 loopback addresses (in that order)", async () => {
            const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV6_ADDR1]);
            const resolver = new dns_1.Resolver(lookup);
            await (0, chai_1.expect)(resolver.lookupAll("localhost")).to.eventually.eql([
                dns_1.IPV4_LOOPBACK,
                dns_1.IPV6_LOOPBACK,
            ]);
            (0, chai_1.expect)(lookup).not.to.be.called;
        });
    });
    it("should parse and return IPv4 addresses without lookup", async () => {
        const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV6_ADDR1]);
        const resolver = new dns_1.Resolver(lookup);
        await (0, chai_1.expect)(resolver.lookupAll("127.0.0.1")).to.eventually.eql([dns_1.IPV4_LOOPBACK]);
        (0, chai_1.expect)(lookup).not.to.be.called;
    });
    it("should parse and return IPv6 addresses without lookup", async () => {
        const lookup = sinon.fake.resolves([IPV4_ADDR1, IPV6_ADDR1]);
        const resolver = new dns_1.Resolver(lookup);
        await (0, chai_1.expect)(resolver.lookupAll("::1")).to.eventually.eql([dns_1.IPV6_LOOPBACK]);
        (0, chai_1.expect)(lookup).not.to.be.called;
    });
});
//# sourceMappingURL=dns.spec.js.map