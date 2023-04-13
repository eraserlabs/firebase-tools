"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const error_1 = require("../../error");
const config = require("../../hosting/config");
const utils_1 = require("../../utils");
const experiments_1 = require("../../experiments");
function options(hostingConfig, base, targetsToSites) {
    return Object.assign({ project: "project", config: {
            src: {
                hosting: hostingConfig,
            },
        }, rc: {
            requireTarget: (project, type, name) => {
                return (targetsToSites === null || targetsToSites === void 0 ? void 0 : targetsToSites[name]) || [];
            },
        }, cwd: __dirname + "/../fixtures/simplehosting", configPath: __dirname + "/../fixtures/simplehosting/firebase.json" }, base);
}
describe("config", () => {
    describe("extract", () => {
        it("should handle no hosting config", () => {
            const opts = options({});
            delete opts.config.src.hosting;
            (0, chai_1.expect)(config.extract(opts)).to.deep.equal([]);
        });
        it("should fail if both site and target are specified", () => {
            const singleSiteOpts = options({ site: "site", target: "target" });
            (0, chai_1.expect)(() => config.extract(singleSiteOpts)).throws(error_1.FirebaseError, /configs should only include either/);
            const manySiteOpts = options([{ site: "site", target: "target" }]);
            (0, chai_1.expect)(() => config.extract(manySiteOpts)).throws(error_1.FirebaseError, /configs should only include either/);
        });
        it("should always return an array", () => {
            const single = { site: "site" };
            let extracted = config.extract(options(single));
            (0, chai_1.expect)(extracted).to.deep.equal([single]);
            extracted = config.extract(options([single]));
            (0, chai_1.expect)(extracted).to.deep.equal([single]);
        });
        it("should support legacy method of specifying site", () => {
            const opts = options({}, { site: "legacy-site" });
            const extracted = config.extract(opts);
            (0, chai_1.expect)(extracted).to.deep.equal([{ site: "legacy-site" }]);
        });
    });
    describe("resolveTargets", () => {
        it("should not modify the config", () => {
            const cfg = [{ target: "target" }];
            const opts = options(cfg, {}, { target: ["site"] });
            config.resolveTargets(cfg, opts);
            (0, chai_1.expect)(cfg).to.deep.equal([{ target: "target" }]);
        });
        it("should add sites when found", () => {
            const cfg = [{ target: "target" }];
            const opts = options(cfg, {}, { target: ["site"] });
            const resolved = config.resolveTargets(cfg, opts);
            (0, chai_1.expect)(resolved).to.deep.equal([{ target: "target", site: "site" }]);
        });
        it("should prohibit multiple sites", () => {
            const cfg = [{ target: "target" }];
            const opts = options(cfg, {}, { target: ["site", "other-site"] });
            (0, chai_1.expect)(() => config.resolveTargets(cfg, opts)).to.throw(error_1.FirebaseError, /is linked to multiple sites, but only one is permitted/);
        });
    });
    describe("filterOnly", () => {
        const tests = [
            {
                desc: "a normal hosting config, specifying the default site",
                cfg: [{ site: "site" }],
                only: "hosting:site",
                want: [{ site: "site" }],
            },
            {
                desc: "a hosting config with multiple sites, no targets, specifying the second site",
                cfg: [{ site: "site" }, { site: "different-site" }],
                only: `hosting:different-site`,
                want: [{ site: "different-site" }],
            },
            {
                desc: "a normal hosting config with a target",
                cfg: [{ target: "main" }, { site: "site" }],
                only: "hosting:main",
                want: [{ target: "main" }],
            },
            {
                desc: "a hosting config with multiple targets, specifying one",
                cfg: [{ target: "t-one" }, { target: "t-two" }],
                only: "hosting:t-two",
                want: [{ target: "t-two" }],
            },
            {
                desc: "a hosting config with multiple targets, specifying all hosting",
                cfg: [{ target: "t-one" }, { target: "t-two" }],
                only: "hosting",
                want: [{ target: "t-one" }, { target: "t-two" }],
            },
            {
                desc: "a hosting config with multiple targets, specifying an invalid target",
                cfg: [{ target: "t-one" }, { target: "t-two" }],
                only: "hosting:t-three",
                wantErr: /Hosting site or target.+t-three.+not detected/,
            },
            {
                desc: "a hosting config with multiple sites but no targets, only an invalid target",
                cfg: [{ site: "s-one" }],
                only: "hosting:t-one",
                wantErr: /Hosting site or target.+t-one.+not detected/,
            },
            {
                desc: "a hosting config without an only string",
                cfg: [{ site: "site" }],
                want: [{ site: "site" }],
            },
            {
                desc: "a hosting config with a non-hosting only flag",
                cfg: [{ site: "site" }],
                only: "functions",
                want: [],
            },
        ];
        for (const t of tests) {
            it(`should be able to parse ${t.desc}`, () => {
                if (t.wantErr) {
                    (0, chai_1.expect)(() => config.filterOnly(t.cfg, t.only)).to.throw(error_1.FirebaseError, t.wantErr);
                }
                else {
                    const got = config.filterOnly(t.cfg, t.only);
                    (0, chai_1.expect)(got).to.deep.equal(t.want);
                }
            });
        }
    });
    describe("with an except parameter, resolving targets", () => {
        const tests = [
            {
                desc: "a hosting config with multiple sites, no targets, omitting the second site",
                cfg: [{ site: "default-site" }, { site: "different-site" }],
                except: `hosting:different-site`,
                want: [{ site: "default-site" }],
            },
            {
                desc: "a normal hosting config with a target, omitting the target",
                cfg: [{ target: "main" }],
                except: "hosting:main",
                want: [],
            },
            {
                desc: "a hosting config with multiple targets, omitting one",
                cfg: [{ target: "t-one" }, { target: "t-two" }],
                except: "hosting:t-two",
                want: [{ target: "t-one" }],
            },
            {
                desc: "a hosting config with multiple targets, omitting all hosting",
                cfg: [{ target: "t-one" }, { target: "t-two" }],
                except: "hosting",
                want: [],
            },
            {
                desc: "a hosting config with multiple targets, omitting an invalid target",
                cfg: [{ target: "t-one" }, { target: "t-two" }],
                except: "hosting:t-three",
                want: [{ target: "t-one" }, { target: "t-two" }],
            },
            {
                desc: "a hosting config with no excpet string",
                cfg: [{ target: "target" }],
                want: [{ target: "target" }],
            },
            {
                desc: "a hosting config with a non-hosting except string",
                cfg: [{ target: "target" }],
                except: "functions",
                want: [{ target: "target" }],
            },
        ];
        for (const t of tests) {
            it(`should be able to parse ${t.desc}`, () => {
                if (t.wantErr) {
                    (0, chai_1.expect)(() => config.filterExcept(t.cfg, t.except)).to.throw(error_1.FirebaseError, t.wantErr);
                }
                else {
                    const got = config.filterExcept(t.cfg, t.except);
                    (0, chai_1.expect)(got).to.deep.equal(t.want);
                }
            });
        }
    });
    it("normalize", () => {
        it("upgrades function configs", () => {
            const configs = [
                {
                    site: "site",
                    public: "public",
                    rewrites: [
                        {
                            glob: "**",
                            function: "functionId",
                        },
                        {
                            glob: "**",
                            function: "function2",
                            region: "region",
                        },
                    ],
                },
            ];
            config.normalize(configs);
            (0, chai_1.expect)(configs).to.deep.equal([
                {
                    site: "site",
                    public: "public",
                    rewrites: [
                        {
                            glob: "**",
                            function: {
                                functionid: "functionId",
                            },
                        },
                        {
                            glob: "**",
                            function: {
                                functionId: "function2",
                                region: "region",
                            },
                        },
                    ],
                },
            ]);
        });
        it("leaves other rewrites alone", () => {
            const configs = [
                {
                    site: "site",
                    public: "public",
                    rewrites: [
                        {
                            glob: "**",
                            destination: "index.html",
                        },
                        {
                            glob: "**",
                            function: {
                                functionId: "functionId",
                            },
                        },
                        {
                            glob: "**",
                            run: {
                                serviceId: "service",
                            },
                        },
                        {
                            glob: "**",
                            dynamicLinks: true,
                        },
                    ],
                },
            ];
            const expected = (0, utils_1.cloneDeep)(configs);
            config.normalize(configs);
            (0, chai_1.expect)(configs).to.deep.equal(expected);
        });
    });
    const PUBLIC_DIR_ERROR_PREFIX = /Must supply a "public" directory/;
    describe("validate", () => {
        const tests = [
            {
                desc: "should error out if there is no public directory but a 'destination' rewrite",
                site: {
                    rewrites: [
                        { source: "/foo", destination: "/bar.html" },
                        { source: "/baz", function: "app" },
                    ],
                },
                wantErr: PUBLIC_DIR_ERROR_PREFIX,
            },
            {
                desc: "should error out if there is no public directory and an i18n with root",
                site: {
                    i18n: { root: "/foo" },
                    rewrites: [{ source: "/foo", function: "pass" }],
                },
                wantErr: PUBLIC_DIR_ERROR_PREFIX,
            },
            {
                desc: "should error out if there is a public direcotry and an i18n with no root",
                site: {
                    public: "public",
                    i18n: {},
                    rewrites: [{ source: "/foo", function: "pass" }],
                },
                wantErr: /Must supply a "root"/,
            },
            {
                desc: "should error out if region is set and function is unset",
                site: {
                    rewrites: [{ source: "/", region: "us-central1" }],
                },
                wantErr: /Rewrites only support 'region' as a top-level field when 'function' is set as a string/,
            },
            {
                desc: "should error out if region is set and functions is the new form",
                site: {
                    rewrites: [
                        {
                            source: "/",
                            region: "us-central1",
                            function: {
                                functionId: "id",
                            },
                        },
                    ],
                },
                wantErr: /Rewrites only support 'region' as a top-level field when 'function' is set as a string/,
            },
            {
                desc: "should pass with public and nothing else",
                site: { public: "public" },
            },
            {
                desc: "should pass with no public but a function rewrite",
                site: {
                    rewrites: [{ source: "/", function: "app" }],
                },
            },
            {
                desc: "should pass with no public but a run rewrite",
                site: {
                    rewrites: [{ source: "/", run: { serviceId: "app" } }],
                },
            },
            {
                desc: "should pass with no public but a redirect",
                site: {
                    redirects: [{ source: "/", destination: "https://google.com", type: 302 }],
                },
            },
        ];
        for (const t of tests) {
            it(t.desc, () => {
                (0, experiments_1.setEnabled)("webframeworks", false);
                const configs = [Object.assign({ site: "site" }, t.site)];
                if (t.wantErr) {
                    (0, chai_1.expect)(() => config.validate(configs, options(t.site))).to.throw(error_1.FirebaseError, t.wantErr);
                }
                else {
                    (0, chai_1.expect)(() => config.validate(configs, options(t.site))).to.not.throw();
                }
            });
        }
    });
});
//# sourceMappingURL=config.spec.js.map