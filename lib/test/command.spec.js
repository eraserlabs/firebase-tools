"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const nock = require("nock");
const command_1 = require("../command");
const error_1 = require("../error");
describe("Command", () => {
    let command;
    beforeEach(() => {
        command = new command_1.Command("example");
    });
    it("should allow all basic behavior", () => {
        (0, chai_1.expect)(() => {
            command.description("description!");
            command.option("-x, --foobar", "description", "value");
            command.withForce();
            command.before((arr) => {
                return arr;
            }, ["foo", "bar"]);
            command.help("here's how!");
            command.action(() => {
            });
        }).not.to.throw();
    });
    describe("runner", () => {
        it("should work when no arguments are passed and options", async () => {
            const run = command
                .action((options) => {
                options.foo = "bar";
                return options;
            })
                .runner();
            const result = run({ foo: "baz" });
            await (0, chai_1.expect)(result).to.eventually.have.property("foo", "bar");
        });
        it("should execute befores before the action", async () => {
            const run = command
                .before((options) => {
                options.foo = true;
            })
                .action((options) => {
                if (options.foo) {
                    options.bar = "baz";
                }
                return options;
            })
                .runner();
            const result = run({});
            await (0, chai_1.expect)(result).to.eventually.have.property("bar");
        });
        it("should terminate execution if a before errors", async () => {
            const run = command
                .before(() => {
                throw new Error("foo");
            })
                .action(() => {
                throw new Error("THIS IS NOT FOO");
            })
                .runner();
            const result = run();
            return (0, chai_1.expect)(result).to.be.rejectedWith("foo");
        });
        it("should reject the promise if an error is thrown", async () => {
            const run = command
                .action(() => {
                throw new Error("foo");
            })
                .runner();
            const result = run();
            await (0, chai_1.expect)(result).to.be.rejectedWith("foo");
        });
        it("should resolve a numeric --project flag into a project id", async () => {
            nock("https://firebase.googleapis.com").get("/v1beta1/projects/12345678").reply(200, {
                projectNumber: "12345678",
                projectId: "resolved-project",
            });
            const run = command
                .action((options) => {
                return {
                    project: options.project,
                    projectNumber: options.projectNumber,
                    projectId: options.projectId,
                };
            })
                .runner();
            const result = await run({ project: "12345678", token: "thisisatoken" });
            (0, chai_1.expect)(result).to.deep.eq({
                projectId: "resolved-project",
                projectNumber: "12345678",
                project: "12345678",
            });
        });
        it("should resolve a non-numeric --project flag into a project id", async () => {
            const run = command
                .action((options) => {
                return {
                    project: options.project,
                    projectNumber: options.projectNumber,
                    projectId: options.projectId,
                };
            })
                .runner();
            const result = await run({ project: "resolved-project" });
            (0, chai_1.expect)(result).to.deep.eq({
                projectId: "resolved-project",
                projectNumber: undefined,
                project: "resolved-project",
            });
        });
    });
});
describe("validateProjectId", () => {
    it("should not throw for valid project ids", () => {
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("example")).not.to.throw();
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("my-project")).not.to.throw();
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("myproject4fun")).not.to.throw();
    });
    it("should not throw for legacy project ids", () => {
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("example-")).not.to.throw();
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("0123456")).not.to.throw();
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("google.com:some-project")).not.to.throw();
    });
    it("should block invalid project ids", () => {
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("EXAMPLE")).to.throw(error_1.FirebaseError, /Invalid project id/);
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("!")).to.throw(error_1.FirebaseError, /Invalid project id/);
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("with space")).to.throw(error_1.FirebaseError, /Invalid project id/);
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)(" leadingspace")).to.throw(error_1.FirebaseError, /Invalid project id/);
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("trailingspace ")).to.throw(error_1.FirebaseError, /Invalid project id/);
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("has.dot")).to.throw(error_1.FirebaseError, /Invalid project id/);
    });
    it("should error with additional note for uppercase project ids", () => {
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("EXAMPLE")).to.throw(error_1.FirebaseError, /lowercase/);
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("Example")).to.throw(error_1.FirebaseError, /lowercase/);
        (0, chai_1.expect)(() => (0, command_1.validateProjectId)("Example-Project")).to.throw(error_1.FirebaseError, /lowercase/);
    });
});
//# sourceMappingURL=command.spec.js.map