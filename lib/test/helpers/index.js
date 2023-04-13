"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockAuth = void 0;
const auth = require("../../auth");
function mockAuth(sandbox) {
    const authMock = sandbox.mock(auth);
    authMock.expects("getAccessToken").atLeast(1).resolves({ access_token: "an_access_token" });
}
exports.mockAuth = mockAuth;
//# sourceMappingURL=index.js.map