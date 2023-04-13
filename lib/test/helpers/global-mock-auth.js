"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const _1 = require("./");
const authSandbox = sinon.createSandbox();
before(() => {
    (0, _1.mockAuth)(authSandbox);
});
after(() => {
    authSandbox.restore();
});
//# sourceMappingURL=global-mock-auth.js.map