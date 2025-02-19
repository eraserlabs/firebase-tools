"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineExecutor = exports.QueueExecutor = void 0;
const queue_1 = require("../../../throttler/queue");
async function handler(op) {
    var _a, _b, _c, _d, _e, _f;
    try {
        op.result = await op.func();
    }
    catch (err) {
        const code = err.status ||
            err.code ||
            ((_b = (_a = err.context) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.statusCode) ||
            ((_c = err.original) === null || _c === void 0 ? void 0 : _c.code) ||
            ((_f = (_e = (_d = err.original) === null || _d === void 0 ? void 0 : _d.context) === null || _e === void 0 ? void 0 : _e.response) === null || _f === void 0 ? void 0 : _f.statusCode);
        if (code === 429 || code === 409 || code === 503) {
            throw err;
        }
        op.error = err;
    }
    return;
}
class QueueExecutor {
    constructor(options) {
        this.queue = new queue_1.Queue(Object.assign(Object.assign({}, options), { handler }));
    }
    async run(func) {
        const op = { func };
        await this.queue.run(op);
        if (op.error) {
            throw op.error;
        }
        return op.result;
    }
}
exports.QueueExecutor = QueueExecutor;
class InlineExecutor {
    run(func) {
        return func();
    }
}
exports.InlineExecutor = InlineExecutor;
