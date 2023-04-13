"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const triggerHelper = require("../../../extensions/emulator/triggerHelper");
describe("triggerHelper", () => {
    describe("functionResourceToEmulatedTriggerDefintion", () => {
        it("should assign valid properties from the resource to the ETD and ignore others", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.function",
                properties: {
                    timeout: "3s",
                    location: "us-east1",
                    availableMemoryMb: 1024,
                },
            };
            testResource.properties.somethingInvalid = "a value";
            const expected = {
                platform: "gcfv1",
                availableMemoryMb: 1024,
                entryPoint: "test-resource",
                name: "test-resource",
                regions: ["us-east1"],
                timeoutSeconds: 3,
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource);
            (0, chai_1.expect)(result).to.eql(expected);
        });
        it("should handle HTTPS triggers", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.function",
                properties: {
                    httpsTrigger: {},
                },
            };
            const expected = {
                platform: "gcfv1",
                entryPoint: "test-resource",
                name: "test-resource",
                httpsTrigger: {},
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource);
            (0, chai_1.expect)(result).to.eql(expected);
        });
        it("should handle firestore triggers", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.function",
                properties: {
                    eventTrigger: {
                        eventType: "providers/cloud.firestore/eventTypes/document.write",
                        resource: "myResource",
                    },
                },
            };
            const expected = {
                platform: "gcfv1",
                entryPoint: "test-resource",
                name: "test-resource",
                eventTrigger: {
                    service: "firestore.googleapis.com",
                    resource: "myResource",
                    eventType: "providers/cloud.firestore/eventTypes/document.write",
                },
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource);
            (0, chai_1.expect)(result).to.eql(expected);
        });
        it("should handle database triggers", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.function",
                properties: {
                    eventTrigger: {
                        eventType: "providers/google.firebase.database/eventTypes/ref.create",
                        resource: "myResource",
                    },
                },
            };
            const expected = {
                platform: "gcfv1",
                entryPoint: "test-resource",
                name: "test-resource",
                eventTrigger: {
                    eventType: "providers/google.firebase.database/eventTypes/ref.create",
                    service: "firebaseio.com",
                    resource: "myResource",
                },
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource);
            (0, chai_1.expect)(result).to.eql(expected);
        });
        it("should handle pubsub triggers", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.function",
                properties: {
                    eventTrigger: {
                        eventType: "google.pubsub.topic.publish",
                        resource: "myResource",
                    },
                },
            };
            const expected = {
                platform: "gcfv1",
                entryPoint: "test-resource",
                name: "test-resource",
                eventTrigger: {
                    service: "pubsub.googleapis.com",
                    resource: "myResource",
                    eventType: "google.pubsub.topic.publish",
                },
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource);
            (0, chai_1.expect)(result).to.eql(expected);
        });
        it("should handle scheduled triggers", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.function",
                properties: {
                    scheduleTrigger: {
                        schedule: "every 5 minutes",
                    },
                },
            };
            const expected = {
                platform: "gcfv1",
                entryPoint: "test-resource",
                name: "test-resource",
                eventTrigger: {
                    eventType: "google.pubsub.topic.publish",
                    resource: "",
                },
                schedule: {
                    schedule: "every 5 minutes",
                },
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource);
            (0, chai_1.expect)(result).to.eql(expected);
        });
        it("should handle v2 custom event triggers", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.v2function",
                properties: {
                    eventTrigger: {
                        eventType: "test.custom.event",
                        channel: "projects/foo/locations/bar/channels/baz",
                    },
                },
            };
            const expected = {
                platform: "gcfv2",
                entryPoint: "test-resource",
                name: "test-resource",
                eventTrigger: {
                    service: "",
                    channel: "projects/foo/locations/bar/channels/baz",
                    eventType: "test.custom.event",
                },
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource);
            (0, chai_1.expect)(result).to.eql(expected);
        });
        it("should handle fully packed v2 triggers", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.v2function",
                properties: {
                    buildConfig: {
                        runtime: "node16",
                    },
                    location: "us-cental1",
                    serviceConfig: {
                        availableMemory: "100MB",
                        minInstanceCount: 1,
                        maxInstanceCount: 10,
                        timeoutSeconds: 66,
                    },
                    eventTrigger: {
                        eventType: "test.custom.event",
                        channel: "projects/foo/locations/bar/channels/baz",
                        pubsubTopic: "pubsub.topic",
                        eventFilters: [
                            {
                                attribute: "basic",
                                value: "attr",
                            },
                            {
                                attribute: "mattern",
                                value: "patch",
                                operator: "match-path-pattern",
                            },
                        ],
                        retryPolicy: "RETRY",
                        triggerRegion: "us-cental1",
                    },
                },
            };
            const expected = {
                platform: "gcfv2",
                entryPoint: "test-resource",
                name: "test-resource",
                availableMemoryMb: 100,
                timeoutSeconds: 66,
                eventTrigger: {
                    service: "",
                    channel: "projects/foo/locations/bar/channels/baz",
                    eventType: "test.custom.event",
                    eventFilters: {
                        basic: "attr",
                    },
                    eventFilterPathPatterns: {
                        mattern: "patch",
                    },
                },
                regions: ["us-cental1"],
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource);
            (0, chai_1.expect)(result).to.eql(expected);
        });
        it("should correctly inject system params", () => {
            const testResource = {
                name: "test-resource",
                entryPoint: "functionName",
                type: "firebaseextensions.v1beta.function",
                properties: {
                    httpsTrigger: {},
                },
            };
            const systemParams = {
                "firebaseextensions.v1beta.function/location": "us-west1",
                "firebaseextensions.v1beta.function/memory": "1024",
                "firebaseextensions.v1beta.function/timeoutSeconds": "70",
                "firebaseextensions.v1beta.function/labels": "key:val,otherkey:otherval",
            };
            const expected = {
                platform: "gcfv1",
                entryPoint: "test-resource",
                name: "test-resource",
                availableMemoryMb: 1024,
                timeoutSeconds: 70,
                labels: { key: "val", otherkey: "otherval" },
                regions: ["us-west1"],
                httpsTrigger: {},
            };
            const result = triggerHelper.functionResourceToEmulatedTriggerDefintion(testResource, systemParams);
            (0, chai_1.expect)(result).to.eql(expected);
        });
    });
});
//# sourceMappingURL=triggerHelper.spec.js.map