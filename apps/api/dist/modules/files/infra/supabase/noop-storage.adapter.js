"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopStorageAdapter = void 0;
class NoopStorageAdapter {
    async upload(input) {
        return { path: input.path };
    }
    async delete(path) {
        void path;
        return;
    }
    getPublicUrl(path) {
        return path;
    }
}
exports.NoopStorageAdapter = NoopStorageAdapter;
