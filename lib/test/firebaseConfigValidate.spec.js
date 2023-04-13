"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const firebaseConfigValidate_1 = require("../firebaseConfigValidate");
describe("firebaseConfigValidate", () => {
    it("should accept a basic, valid config", () => {
        const config = {
            database: {
                rules: "myrules.json",
            },
            hosting: {
                public: "public",
            },
            emulators: {
                database: {
                    port: 8080,
                },
            },
        };
        const validator = (0, firebaseConfigValidate_1.getValidator)();
        const isValid = validator(config);
        (0, chai_1.expect)(isValid).to.be.true;
    });
    it("should report an extra top-level field", () => {
        const config = {
            database: {
                rules: "myrules.json",
            },
            bananas: {},
        };
        const validator = (0, firebaseConfigValidate_1.getValidator)();
        const isValid = validator(config);
        (0, chai_1.expect)(isValid).to.be.false;
        (0, chai_1.expect)(validator.errors).to.exist;
        (0, chai_1.expect)(validator.errors.length).to.eq(1);
        const firstError = validator.errors[0];
        (0, chai_1.expect)(firstError.keyword).to.eq("additionalProperties");
        (0, chai_1.expect)(firstError.dataPath).to.eq("");
        (0, chai_1.expect)(firstError.params).to.deep.equal({ additionalProperty: "bananas" });
    });
    it("should report a missing required field", () => {
        const config = {
            storage: {},
        };
        const validator = (0, firebaseConfigValidate_1.getValidator)();
        const isValid = validator(config);
        (0, chai_1.expect)(isValid).to.be.false;
        (0, chai_1.expect)(validator.errors).to.exist;
        (0, chai_1.expect)(validator.errors.length).to.eq(3);
        const [firstError, secondError, thirdError] = validator.errors;
        (0, chai_1.expect)(firstError.keyword).to.eq("required");
        (0, chai_1.expect)(firstError.dataPath).to.eq(".storage");
        (0, chai_1.expect)(firstError.params).to.deep.equal({ missingProperty: "rules" });
        (0, chai_1.expect)(secondError.keyword).to.eq("type");
        (0, chai_1.expect)(secondError.dataPath).to.eq(".storage");
        (0, chai_1.expect)(secondError.params).to.deep.equal({ type: "array" });
        (0, chai_1.expect)(thirdError.keyword).to.eq("anyOf");
        (0, chai_1.expect)(thirdError.dataPath).to.eq(".storage");
        (0, chai_1.expect)(thirdError.params).to.deep.equal({});
    });
    it("should report a field with an incorrect type", () => {
        const config = {
            storage: {
                rules: 1234,
            },
        };
        const validator = (0, firebaseConfigValidate_1.getValidator)();
        const isValid = validator(config);
        (0, chai_1.expect)(isValid).to.be.false;
        (0, chai_1.expect)(validator.errors).to.exist;
        (0, chai_1.expect)(validator.errors.length).to.eq(3);
        const [firstError, secondError, thirdError] = validator.errors;
        (0, chai_1.expect)(firstError.keyword).to.eq("type");
        (0, chai_1.expect)(firstError.dataPath).to.eq(".storage.rules");
        (0, chai_1.expect)(firstError.params).to.deep.equal({ type: "string" });
        (0, chai_1.expect)(secondError.keyword).to.eq("type");
        (0, chai_1.expect)(secondError.dataPath).to.eq(".storage");
        (0, chai_1.expect)(secondError.params).to.deep.equal({ type: "array" });
        (0, chai_1.expect)(thirdError.keyword).to.eq("anyOf");
        (0, chai_1.expect)(thirdError.dataPath).to.eq(".storage");
        (0, chai_1.expect)(thirdError.params).to.deep.equal({});
    });
});
//# sourceMappingURL=firebaseConfigValidate.spec.js.map