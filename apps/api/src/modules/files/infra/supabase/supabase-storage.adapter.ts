import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FileStoragePort, StorageUploadInput, StorageUploadResult } from '../../domain/file-storage.port';
import type { PrivateFileDownload, PrivateFileStoragePort } from '../../domain/private-file-storage.port';
import { assertPrivateStoragePath } from '../../domain/private-storage-path';
import { safeDownloadContentType } from '../../domain/storage-content-type';
import { readSupabaseStorageConfig } from './supabase-storage.config';

export class SupabaseStorageAdapter implements FileStoragePort, PrivateFileStoragePort {
  private bucketReady = false;

  constructor(
    private readonly bucket: string,
    private readonly client: SupabaseClient,
    private readonly isPublic: boolean,
  ) {}

  static fromEnv(): SupabaseStorageAdapter {
    const config = readSupabaseStorageConfig();
    return new SupabaseStorageAdapter(config.bucket, createSupabaseClient(), true);
  }

  static privateFromEnv(): SupabaseStorageAdapter {
    const bucket = process.env.SUPABASE_PRIVATE_STORAGE_BUCKET?.trim();
    if (!bucket) {
      throw new Error('Missing required env var: SUPABASE_PRIVATE_STORAGE_BUCKET');
    }
    return new SupabaseStorageAdapter(bucket, createSupabaseClient(), false);
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const path = this.isPublic ? input.path : assertPrivateStoragePath(input.path);
    await this.ensureBucketReady();
    const { error } = await this.client.storage.from(this.bucket).upload(path, input.data, {
      contentType: input.contentType,
      upsert: input.upsert ?? false,
    });
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    return { path };
  }

  async delete(path: string): Promise<void> {
    const objectPath = this.isPublic ? path : assertPrivateStoragePath(path);
    const { error } = await this.client.storage.from(this.bucket).remove([objectPath]);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async download(path: string): Promise<PrivateFileDownload | null> {
    const objectPath = assertPrivateStoragePath(path);
    const { data, error } = await this.client.storage.from(this.bucket).download(objectPath);
    if (error) {
      if (isNotFound(error.message)) {
        return null;
      }
      throw new Error(`Supabase download failed: ${error.message}`);
    }
    return {
      contentType: safeDownloadContentType(data.type, objectPath),
      data: Buffer.from(await data.arrayBuffer()),
    };
  }

  getPublicUrl(path: string): string {
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  private async ensureBucketReady(): Promise<void> {
    if (this.bucketReady) {
      return;
    }
    const { error } = await this.client.storage.createBucket(this.bucket, { public: this.isPublic });
    if (error && !isBucketAlreadyExists(error.message)) {
      throw new Error(`Supabase bucket setup failed: ${error.message}`);
    }
    if (!this.isPublic) {
      await this.assertBucketIsPrivate();
    }
    this.bucketReady = true;
  }

  private async assertBucketIsPrivate(): Promise<void> {
    const listed = await this.client.storage.getBucket(this.bucket);
    if (listed.error) {
      throw new Error(`Supabase bucket setup failed: ${listed.error.message}`);
    }
    if (listed.data?.public) {
      throw new Error(`Refusing to use public bucket "${this.bucket}" for private media`);
    }
  }
}

function createSupabaseClient(): SupabaseClient {
  const config = readSupabaseStorageConfig();
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function isBucketAlreadyExists(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized.includes('already exists');
}

function isNotFound(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return normalized.includes('not found') || normalized.includes('404');
}
