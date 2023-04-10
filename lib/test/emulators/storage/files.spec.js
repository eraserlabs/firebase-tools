"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const os_1 = require("os");
const metadata_1 = require("../../../emulator/storage/metadata");
const cloudFunctions_1 = require("../../../emulator/storage/cloudFunctions");
const files_1 = require("../../../emulator/storage/files");
const errors_1 = require("../../../emulator/storage/errors");
const persistence_1 = require("../../../emulator/storage/persistence");
const upload_1 = require("../../../emulator/storage/upload");
const ALWAYS_TRUE_RULES_VALIDATOR = {
    validate: () => Promise.resolve(true),
};
const ALWAYS_FALSE_RULES_VALIDATOR = {
    validate: async () => Promise.resolve(false),
};
const ALWAYS_TRUE_ADMIN_CREDENTIAL_VALIDATOR = {
    validate: () => true,
};
describe("files", () => {
    it("can serialize and deserialize metadata", () => {
        const cf = new cloudFunctions_1.StorageCloudFunctions("demo-project");
        const metadata = new metadata_1.StoredFileMetadata({
            name: "name",
            bucket: "bucket",
            contentType: "mime/type",
            downloadTokens: ["token123"],
            customMetadata: {
                foo: "bar",
            },
        }, cf, Buffer.from("Hello, World!"));
        const json = metadata_1.StoredFileMetadata.toJSON(metadata);
        const deserialized = metadata_1.StoredFileMetadata.fromJSON(json, cf);
        (0, chai_1.expect)(deserialized).to.deep.equal(metadata);
    });
    it("converts non-string custom metadata to string", () => {
        const cf = new cloudFunctions_1.StorageCloudFunctions("demo-project");
        const customMetadata = {
            foo: true,
        };
        const metadata = new metadata_1.StoredFileMetadata({
            customMetadata,
            name: "name",
            bucket: "bucket",
            contentType: "mime/type",
            downloadTokens: ["token123"],
        }, cf, Buffer.from("Hello, World!"));
        const json = metadata_1.StoredFileMetadata.toJSON(metadata);
        const deserialized = metadata_1.StoredFileMetadata.fromJSON(json, cf);
        (0, chai_1.expect)(deserialized.customMetadata).to.deep.equal({ foo: "true" });
    });
    describe("StorageLayer", () => {
        let _persistence;
        let _uploadService;
        async function uploadFile(storageLayer, bucketId, objectId, opts) {
            var _a, _b;
            const upload = _uploadService.multipartUpload({
                bucketId,
                objectId: encodeURIComponent(objectId),
                dataRaw: Buffer.from((_a = opts === null || opts === void 0 ? void 0 : opts.data) !== null && _a !== void 0 ? _a : "hello world"),
                metadata: (_b = opts === null || opts === void 0 ? void 0 : opts.metadata) !== null && _b !== void 0 ? _b : {},
            });
            await storageLayer.uploadObject(upload);
        }
        beforeEach(() => {
            _persistence = new persistence_1.Persistence(getPersistenceTmpDir());
            _uploadService = new upload_1.UploadService(_persistence);
        });
        describe("#uploadObject()", () => {
            it("should throw if upload is not finished", () => {
                const storageLayer = getStorageLayer(ALWAYS_TRUE_RULES_VALIDATOR);
                const upload = _uploadService.startResumableUpload({
                    bucketId: "bucket",
                    objectId: "dir%2Fobject",
                    metadata: {},
                });
                (0, chai_1.expect)(storageLayer.uploadObject(upload)).to.be.rejectedWith("Unexpected upload status");
            });
            it("should throw if upload is not authorized", () => {
                const storageLayer = getStorageLayer(ALWAYS_FALSE_RULES_VALIDATOR);
                const uploadId = _uploadService.startResumableUpload({
                    bucketId: "bucket",
                    objectId: "dir%2Fobject",
                    metadata: {},
                }).id;
                _uploadService.continueResumableUpload(uploadId, Buffer.from("hello world"));
                const upload = _uploadService.finalizeResumableUpload(uploadId);
                (0, chai_1.expect)(storageLayer.uploadObject(upload)).to.be.rejectedWith(errors_1.ForbiddenError);
            });
        });
        describe("#getObject()", () => {
            it("should return data and metadata", async () => {
                const storageLayer = getStorageLayer(ALWAYS_TRUE_RULES_VALIDATOR);
                await uploadFile(storageLayer, "bucket", "dir/object", {
                    data: "Hello, World!",
                    metadata: { contentType: "mime/type" },
                });
                const { metadata, data } = await storageLayer.getObject({
                    bucketId: "bucket",
                    decodedObjectId: "dir%2Fobject",
                });
                (0, chai_1.expect)(metadata.contentType).to.equal("mime/type");
                (0, chai_1.expect)(data.toString()).to.equal("Hello, World!");
            });
            it("should throw an error if request is not authorized", () => {
                const storageLayer = getStorageLayer(ALWAYS_FALSE_RULES_VALIDATOR);
                (0, chai_1.expect)(storageLayer.getObject({
                    bucketId: "bucket",
                    decodedObjectId: "dir%2Fobject",
                })).to.be.rejectedWith(errors_1.ForbiddenError);
            });
            it("should throw an error if the object does not exist", () => {
                const storageLayer = getStorageLayer(ALWAYS_TRUE_RULES_VALIDATOR);
                (0, chai_1.expect)(storageLayer.getObject({
                    bucketId: "bucket",
                    decodedObjectId: "dir%2Fobject",
                })).to.be.rejectedWith(errors_1.NotFoundError);
            });
        });
        const getStorageLayer = (rulesValidator) => new files_1.StorageLayer("project", new Map(), new Map(), rulesValidator, ALWAYS_TRUE_ADMIN_CREDENTIAL_VALIDATOR, _persistence, new cloudFunctions_1.StorageCloudFunctions("project"));
        const getPersistenceTmpDir = () => `${(0, os_1.tmpdir)()}/firebase/storage/blobs`;
    });
});
//# sourceMappingURL=files.spec.js.map