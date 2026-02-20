import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  type FileStoragePort,
  type StorageUploadInput,
  type StorageUploadResult,
} from '../../domain/file-storage.port';
import { readSupabaseStorageConfig } from './supabase-storage.config';

export class SupabaseStorageAdapter implements FileStoragePort {
  private bucketReady = false;

  constructor(
    private readonly bucket: string,
    private readonly client: SupabaseClient,
  ) {}

  static fromEnv(): SupabaseStorageAdapter {
    const config = readSupabaseStorageConfig();
    const client = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false },
    });
    return new SupabaseStorageAdapter(config.bucket, client);
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
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

  async delete(path: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  private async ensureBucketReady(): Promise<void> {
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

function isBucketAlreadyExists(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized.includes('already exists');
}
