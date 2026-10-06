import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateUploadPolicyUseCase } from './application/use-cases/create-upload-policy.usecase';
import { FILE_STORAGE } from './domain/file-storage.port';
import { PRIVATE_FILE_STORAGE } from './domain/private-file-storage.port';
import { PrivateMediaUrlSigner } from './domain/private-media-url-signer';
import { LocalDiskStorageAdapter } from './infra/local';
import { FileUploadPolicy } from './domain/policies/file-upload.policy';
import { SupabaseStorageAdapter } from './infra/supabase';
import { FilesController } from './presentation/controllers/files.controller';
import { PrivateMediaController } from './presentation/controllers/private-media.controller';

@Module({
  imports: [AuthModule],
  controllers: [FilesController, PrivateMediaController],
  providers: [
    FileUploadPolicy,
    CreateUploadPolicyUseCase,
    {
      provide: PrivateMediaUrlSigner,
      useFactory: () => PrivateMediaUrlSigner.fromEnv(),
    },
    {
      provide: FILE_STORAGE,
      useFactory: () => createFileStorage(),
    },
    {
      provide: PRIVATE_FILE_STORAGE,
      useFactory: () => createPrivateFileStorage(),
    },
  ],
  exports: [FILE_STORAGE, PRIVATE_FILE_STORAGE, PrivateMediaUrlSigner],
})
export class FilesModule {}

function createFileStorage() {
  if (hasSupabaseStorageEnv()) {
    return SupabaseStorageAdapter.fromEnv();
  }
  return LocalDiskStorageAdapter.fromEnv();
}

function createPrivateFileStorage() {
  if (hasSupabaseStorageEnv()) {
    return SupabaseStorageAdapter.privateFromEnv();
  }
  return LocalDiskStorageAdapter.privateFromEnv();
}

function hasSupabaseStorageEnv(): boolean {
  return Boolean(process.env.SUPABASE_STORAGE_BUCKET && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
