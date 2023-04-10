"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = require("sinon");
const fs = require("fs");
const path = require("path");
const os = require("os");
const api = require("../api");
const configstore_1 = require("../configstore");
const defaultCredentials = require("../defaultCredentials");
const auth_1 = require("../auth");
describe("defaultCredentials", () => {
    const sandbox = sinon.createSandbox();
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "firebase-tools"));
    const FAKE_TOKEN = {
        refresh_token: "abc123",
    };
    const FAKE_USER = {
        email: "user@domain.com",
    };
    let configStub;
    let oldHome;
    let account;
    beforeEach(() => {
        oldHome = process.env.HOME;
        process.env.HOME = tmpDir;
        configStub = sandbox.stub(configstore_1.configstore, "get");
        configStub.callsFake((key) => {
            if (key === "tokens") {
                return FAKE_TOKEN;
            }
            if (key === "user") {
                return FAKE_USER;
            }
        });
        account = (0, auth_1.getGlobalDefaultAccount)();
    });
    afterEach(() => {
        process.env.HOME = oldHome;
        sandbox.restore();
    });
    it("creates a credential file when there are tokens in the config", async () => {
        const credPath = await defaultCredentials.getCredentialPathAsync(account);
        (0, chai_1.expect)(credPath)
            .to.be.a("string")
            .that.satisfies((x) => {
            return x.startsWith(tmpDir);
        });
        const fileContents = JSON.parse(fs.readFileSync(credPath).toString());
        (0, chai_1.expect)(fileContents).to.eql({
            client_id: api.clientId,
            client_secret: api.clientSecret,
            refresh_token: FAKE_TOKEN.refresh_token,
            type: "authorized_user",
        });
    });
    it("can clear credentials", async () => {
        const credPath = await defaultCredentials.getCredentialPathAsync(account);
        (0, chai_1.expect)(fs.existsSync(credPath)).to.be.true;
        defaultCredentials.clearCredentials(account);
        (0, chai_1.expect)(fs.existsSync(credPath)).to.be.false;
    });
    it("includes the users email in the path", async () => {
        const credPath = await defaultCredentials.getCredentialPathAsync(account);
        const baseName = path.basename(credPath);
        (0, chai_1.expect)(baseName).to.eq("user_domain_com_application_default_credentials.json");
    });
});
//# sourceMappingURL=defaultCredentials.spec.js.map