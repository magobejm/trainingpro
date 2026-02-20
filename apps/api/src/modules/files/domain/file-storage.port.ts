export const FILE_STORAGE = Symbol('FILE_STORAGE');

export type StorageUploadInput = {
  contentType: string;
  data: Buffer;
  path: string;
  upsert?: boolean;
};

export type StorageUploadResult = {
  path: string;
};

export type FileStoragePort = {
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
};
