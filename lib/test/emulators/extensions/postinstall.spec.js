"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const postinstall = require("../../../emulator/extensions/postinstall");
const registry_1 = require("../../../emulator/registry");
const types_1 = require("../../../emulator/types");
const fakeEmulator_1 = require("../fakeEmulator");
describe("replaceConsoleLinks", () => {
    let host;
    let port;
    before(async () => {
        const emu = await fakeEmulator_1.FakeEmulator.create(types_1.Emulators.UI);
        host = emu.getInfo().host;
        port = emu.getInfo().port;
        return registry_1.EmulatorRegistry.start(emu);
    });
    after(async () => {
        await registry_1.EmulatorRegistry.stopAll();
    });
    const tests = [
        {
            desc: "should replace Firestore links",
            input: " Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/test-project/firestore/data) in the Firebase console.",
            expected: () => ` Go to your [Cloud Firestore dashboard](http://${host}:${port}/firestore) in the Firebase console.`,
        },
        {
            desc: "should replace Functions links",
            input: " Go to your [Cloud Functions dashboard](https://console.firebase.google.com/project/test-project/functions/logs) in the Firebase console.",
            expected: () => ` Go to your [Cloud Functions dashboard](http://${host}:${port}/logs) in the Firebase console.`,
        },
        {
            desc: "should replace Extensions links",
            input: " Go to your [Extensions dashboard](https://console.firebase.google.com/project/test-project/extensions) in the Firebase console.",
            expected: () => ` Go to your [Extensions dashboard](http://${host}:${port}/extensions) in the Firebase console.`,
        },
        {
            desc: "should replace RTDB links",
            input: " Go to your [Realtime database dashboard](https://console.firebase.google.com/project/test-project/database/test-walkthrough/data) in the Firebase console.",
            expected: () => ` Go to your [Realtime database dashboard](http://${host}:${port}/database) in the Firebase console.`,
        },
        {
            desc: "should replace Auth links",
            input: " Go to your [Auth dashboard](https://console.firebase.google.com/project/test-project/authentication/users) in the Firebase console.",
            expected: () => ` Go to your [Auth dashboard](http://${host}:${port}/auth) in the Firebase console.`,
        },
        {
            desc: "should replace multiple GAIA user links ",
            input: " Go to your [Auth dashboard](https://console.firebase.google.com/u/0/project/test-project/authentication/users) in the Firebase console.",
            expected: () => ` Go to your [Auth dashboard](http://${host}:${port}/auth) in the Firebase console.`,
        },
        {
            desc: "should replace multiple links",
            input: " Go to your [Cloud Firestore dashboard](https://console.firebase.google.com/project/jh-walkthrough/firestore/data) or [Realtime database dashboard](https://console.firebase.google.com/project/test-project/database/test-walkthrough/data)in the Firebase console.",
            expected: () => ` Go to your [Cloud Firestore dashboard](http://${host}:${port}/firestore) or [Realtime database dashboard](http://${host}:${port}/database)in the Firebase console.`,
        },
        {
            desc: "should not replace other links",
            input: " Go to your [Stripe dashboard](https://stripe.com/payments) to see more information.",
            expected: () => " Go to your [Stripe dashboard](https://stripe.com/payments) to see more information.",
        },
    ];
    for (const t of tests) {
        it(t.desc, () => {
            (0, chai_1.expect)(postinstall.replaceConsoleLinks(t.input)).to.equal(t.expected());
        });
    }
});
//# sourceMappingURL=postinstall.spec.js.map