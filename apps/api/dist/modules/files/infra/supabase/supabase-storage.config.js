"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSupabaseStorageConfig = readSupabaseStorageConfig;
function readRequired(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}
function readSupabaseStorageConfig() {
    return {
        bucket: readRequired('SUPABASE_STORAGE_BUCKET'),
        serviceRoleKey: readRequired('SUPABASE_SERVICE_ROLE_KEY'),
        url: readRequired('SUPABASE_URL'),
    };
}
