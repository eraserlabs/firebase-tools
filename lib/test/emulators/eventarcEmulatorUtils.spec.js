"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const eventarcEmulatorUtils_1 = require("../../emulator/eventarcEmulatorUtils");
describe("eventarcEmulatorUtils", () => {
    describe("cloudEventFromProtoToJson", () => {
        it("converts cloud event from proto format", () => {
            (0, chai_1.expect)((0, eventarcEmulatorUtils_1.cloudEventFromProtoToJson)({
                "@type": "type.googleapis.com/io.cloudevents.v1.CloudEvent",
                attributes: {
                    customattr: {
                        ceString: "custom value",
                    },
                    datacontenttype: {
                        ceString: "application/json",
                    },
                    time: {
                        ceTimestamp: "2022-03-16T20:20:42.212Z",
                    },
                    subject: {
                        ceString: "context",
                    },
                },
                id: "user-provided-id",
                source: "/my/functions",
                specVersion: "1.0",
                textData: '{"hello":"world"}',
                type: "some.custom.event",
            })).to.deep.eq({
                type: "some.custom.event",
                specversion: "1.0",
                subject: "context",
                datacontenttype: "application/json",
                id: "user-provided-id",
                data: {
                    hello: "world",
                },
                source: "/my/functions",
                time: "2022-03-16T20:20:42.212Z",
                customattr: "custom value",
            });
        });
        it("throws invalid argument when source not set", () => {
            (0, chai_1.expect)(() => (0, eventarcEmulatorUtils_1.cloudEventFromProtoToJson)({
                "@type": "type.googleapis.com/io.cloudevents.v1.CloudEvent",
                attributes: {
                    customattr: {
                        ceString: "custom value",
                    },
                    datacontenttype: {
                        ceString: "application/json",
                    },
                    time: {
                        ceTimestamp: "2022-03-16T20:20:42.212Z",
                    },
                    subject: {
                        ceString: "context",
                    },
                },
                id: "user-provided-id",
                specVersion: "1.0",
                textData: '{"hello":"world"}',
                type: "some.custom.event",
            })).throws("CloudEvent 'source' is required.");
        });
        it("populates converts object data to JSON and sets datacontenttype", () => {
            const got = (0, eventarcEmulatorUtils_1.cloudEventFromProtoToJson)({
                "@type": "type.googleapis.com/io.cloudevents.v1.CloudEvent",
                attributes: {
                    customattr: {
                        ceString: "custom value",
                    },
                    datacontenttype: {
                        ceString: "application/json",
                    },
                    time: {
                        ceTimestamp: "2022-03-16T20:20:42.212Z",
                    },
                    subject: {
                        ceString: "context",
                    },
                },
                id: "user-provided-id",
                source: "/my/functions",
                specVersion: "1.0",
                textData: '{"hello":"world"}',
                type: "some.custom.event",
            });
            (0, chai_1.expect)(got.datacontenttype).to.deep.eq("application/json");
            (0, chai_1.expect)(got.data).to.deep.eq({ hello: "world" });
        });
        it("populates string data and sets datacontenttype", () => {
            const got = (0, eventarcEmulatorUtils_1.cloudEventFromProtoToJson)({
                "@type": "type.googleapis.com/io.cloudevents.v1.CloudEvent",
                attributes: {
                    customattr: {
                        ceString: "custom value",
                    },
                    datacontenttype: {
                        ceString: "text/plain",
                    },
                    time: {
                        ceTimestamp: "2022-03-16T20:20:42.212Z",
                    },
                    subject: {
                        ceString: "context",
                    },
                },
                id: "user-provided-id",
                source: "/my/functions",
                specVersion: "1.0",
                textData: "hello world",
                type: "some.custom.event",
            });
            (0, chai_1.expect)(got.datacontenttype).to.deep.eq("text/plain");
            (0, chai_1.expect)(got.data).to.eq("hello world");
        });
    });
});
//# sourceMappingURL=eventarcEmulatorUtils.spec.js.map