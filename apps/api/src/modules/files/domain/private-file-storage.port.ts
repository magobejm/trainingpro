import type { StorageUploadInput, StorageUploadResult } from './file-storage.port';

export const PRIVATE_FILE_STORAGE = Symbol('PRIVATE_FILE_STORAGE');

export type PrivateFileDownload = {
  contentType: string;
  data: Buffer;
};

export type PrivateFileStoragePort = {
  delete(path: string): Promise<void>;
  download(path: string): Promise<PrivateFileDownload | null>;
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
};
