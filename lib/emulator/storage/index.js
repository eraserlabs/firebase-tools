"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageEmulator = void 0;
const os_1 = require("os");
const utils = require("../../utils");
const constants_1 = require("../constants");
const types_1 = require("../types");
const server_1 = require("./server");
const files_1 = require("./files");
const emulatorLogger_1 = require("../emulatorLogger");
const manager_1 = require("./rules/manager");
const runtime_1 = require("./rules/runtime");
const utils_1 = require("./rules/utils");
const persistence_1 = require("./persistence");
const upload_1 = require("./upload");
const cloudFunctions_1 = require("./cloudFunctions");
class StorageEmulator {
    constructor(args) {
        this.args = args;
        this._logger = emulatorLogger_1.EmulatorLogger.forEmulator(types_1.Emulators.STORAGE);
        this._files = new Map();
        this._buckets = new Map();
        this._rulesRuntime = new runtime_1.StorageRulesRuntime();
        this._rulesManager = this.createRulesManager(this.args.rules);
        this._cloudFunctions = new cloudFunctions_1.StorageCloudFunctions(args.projectId);
        this._persistence = new persistence_1.Persistence(this.getPersistenceTmpDir());
        this._uploadService = new upload_1.UploadService(this._persistence);
        const createStorageLayer = (rulesValidator) => {
            return new files_1.StorageLayer(args.projectId, this._files, this._buckets, rulesValidator, (0, utils_1.getAdminCredentialValidator)(), this._persistence, this._cloudFunctions);
        };
        this._storageLayer = createStorageLayer((0, utils_1.getFirebaseRulesValidator)((resource) => this._rulesManager.getRuleset(resource)));
        this._adminStorageLayer = createStorageLayer((0, utils_1.getAdminOnlyFirebaseRulesValidator)());
    }
    get storageLayer() {
        return this._storageLayer;
    }
    get adminStorageLayer() {
        return this._adminStorageLayer;
    }
    get uploadService() {
        return this._uploadService;
    }
    get rulesManager() {
        return this._rulesManager;
    }
    get logger() {
        return this._logger;
    }
    reset() {
        this._files.clear();
        this._buckets.clear();
        this._persistence.reset(this.getPersistenceTmpDir());
        this._uploadService.reset();
    }
    async start() {
        const { host, port } = this.getInfo();
        await this._rulesRuntime.start(this.args.auto_download);
        await this._rulesManager.start();
        this._app = await (0, server_1.createApp)(this.args.projectId, this);
        const server = this._app.listen(port, host);
        this.destroyServer = utils.createDestroyer(server);
    }
    async connect() {
    }
    async stop() {
        await this._persistence.deleteAll();
        await this._rulesManager.stop();
        return this.destroyServer ? this.destroyServer() : Promise.resolve();
    }
    getInfo() {
        const host = this.args.host || constants_1.Constants.getDefaultHost();
        const port = this.args.port || constants_1.Constants.getDefaultPort(types_1.Emulators.STORAGE);
        return {
            name: this.getName(),
            host,
            port,
        };
    }
    getName() {
        return types_1.Emulators.STORAGE;
    }
    getApp() {
        return this._app;
    }
    async replaceRules(rules) {
        await this._rulesManager.stop();
        this._rulesManager = this.createRulesManager(rules);
        return this._rulesManager.start();
    }
    createRulesManager(rules) {
        return (0, manager_1.createStorageRulesManager)(rules, this._rulesRuntime);
    }
    getPersistenceTmpDir() {
        return `${(0, os_1.tmpdir)()}/firebase/storage/blobs`;
    }
}
exports.StorageEmulator = StorageEmulator;
