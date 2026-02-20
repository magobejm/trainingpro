"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalDiskStorageAdapter = void 0;
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
class LocalDiskStorageAdapter {
    baseDir;
    constructor(baseDir) {
        this.baseDir = baseDir;
    }
    static fromEnv() {
        return new LocalDiskStorageAdapter(resolveUploadsBaseDir());
    }
    async upload(input) {
        const relativePath = normalizeRelativePath(input.path);
        const absolutePath = (0, node_path_1.resolve)(this.baseDir, relativePath);
        const targetDir = (0, node_path_1.resolve)(absolutePath, '..');
        await (0, promises_1.mkdir)(targetDir, { recursive: true });
        await (0, promises_1.writeFile)(absolutePath, input.data);
        return { path: relativePath };
    }
    async delete(path) {
        const relativePath = normalizeRelativePath(path);
        const absolutePath = (0, node_path_1.resolve)(this.baseDir, relativePath);
        await (0, promises_1.rm)(absolutePath, { force: true });
    }
    getPublicUrl(path) {
        const relativePath = normalizeRelativePath(path);
        return `${resolvePublicAssetBaseUrl()}/uploads/${relativePath}`;
    }
}
exports.LocalDiskStorageAdapter = LocalDiskStorageAdapter;
function resolveUploadsBaseDir() {
    return (0, node_path_1.resolve)(process.cwd(), 'apps/storage/uploads');
}
function resolvePublicAssetBaseUrl() {
    return process.env.PUBLIC_ASSET_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8080}`;
}
function normalizeRelativePath(path) {
    const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
    if (normalized.includes('..')) {
        throw new Error('Invalid storage path');
    }
    return normalized;
}
