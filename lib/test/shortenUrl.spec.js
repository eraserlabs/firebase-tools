"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const api_1 = require("../api");
const shortenUrl_1 = require("../shortenUrl");
describe("shortenUrl", () => {
    const TEST_LINK = "https://abc.def/";
    const MOCKED_LINK = "https://firebase.tools/l/TEST";
    function mockDynamicLinks(url, suffix = "UNGUESSABLE", code = 200) {
        nock(api_1.dynamicLinksOrigin)
            .post(`/v1/shortLinks`, (body) => { var _a, _b; return ((_a = body.dynamicLinkInfo) === null || _a === void 0 ? void 0 : _a.link) === url && ((_b = body.suffix) === null || _b === void 0 ? void 0 : _b.option) === suffix; })
            .query({ key: api_1.dynamicLinksKey })
            .reply(code, {
            shortLink: MOCKED_LINK,
            previewLink: `${MOCKED_LINK}?d=1`,
        });
    }
    it("should return a shortened url with an unguessable suffix by default", async () => {
        mockDynamicLinks(TEST_LINK);
        (0, chai_1.expect)(await (0, shortenUrl_1.shortenUrl)(TEST_LINK)).to.eq(MOCKED_LINK);
    });
    it("should request a short suffix URL if guessable is true", async () => {
        mockDynamicLinks(TEST_LINK, "SHORT");
        (0, chai_1.expect)(await (0, shortenUrl_1.shortenUrl)(TEST_LINK, true)).to.eq(MOCKED_LINK);
    });
    it("should return the original URL in case of an error", async () => {
        mockDynamicLinks(TEST_LINK, "UNGUESSABLE", 400);
        (0, chai_1.expect)(await (0, shortenUrl_1.shortenUrl)(TEST_LINK)).to.eq(TEST_LINK);
    });
});
//# sourceMappingURL=shortenUrl.spec.js.map