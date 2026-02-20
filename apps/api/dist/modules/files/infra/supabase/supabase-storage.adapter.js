"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseStorageAdapter = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const supabase_storage_config_1 = require("./supabase-storage.config");
class SupabaseStorageAdapter {
    bucket;
    client;
    bucketReady = false;
    constructor(bucket, client) {
        this.bucket = bucket;
        this.client = client;
    }
    static fromEnv() {
        const config = (0, supabase_storage_config_1.readSupabaseStorageConfig)();
        const client = (0, supabase_js_1.createClient)(config.url, config.serviceRoleKey, {
            auth: { persistSession: false },
        });
        return new SupabaseStorageAdapter(config.bucket, client);
    }
    async upload(input) {
        await this.ensureBucketReady();
        const { error } = await this.client.storage.from(this.bucket).upload(input.path, input.data, {
            contentType: input.contentType,
            upsert: input.upsert ?? false,
        });
        if (error) {
            throw new Error(`Supabase upload failed: ${error.message}`);
        }
        return { path: input.path };
    }
    async delete(path) {
        const { error } = await this.client.storage.from(this.bucket).remove([path]);
        if (error) {
            throw new Error(`Supabase delete failed: ${error.message}`);
        }
    }
    getPublicUrl(path) {
        const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
        return data.publicUrl;
    }
    async ensureBucketReady() {
        if (this.bucketReady) {
            return;
        }
        const { error } = await this.client.storage.createBucket(this.bucket, { public: true });
        if (error && !isBucketAlreadyExists(error.message)) {
            throw new Error(`Supabase bucket setup failed: ${error.message}`);
        }
        this.bucketReady = true;
    }
}
exports.SupabaseStorageAdapter = SupabaseStorageAdapter;
function isBucketAlreadyExists(message) {
    const normalized = message.trim().toLowerCase();
    return normalized.includes('already exists');
}
