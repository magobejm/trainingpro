import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateUploadPolicyUseCase } from './application/use-cases/create-upload-policy.usecase';
import { FILE_STORAGE } from './domain/file-storage.port';
import { LocalDiskStorageAdapter } from './infra/local';
import { FileUploadPolicy } from './domain/policies/file-upload.policy';
import {
  SupabaseStorageAdapter,
} from './infra/supabase';
import { FilesController } from './presentation/controllers/files.controller';

@Module({
  imports: [AuthModule],
  controllers: [FilesController],
  providers: [
    FileUploadPolicy,
    CreateUploadPolicyUseCase,
    {
      provide: FILE_STORAGE,
      useFactory: () => createFileStorage(),
    },
  ],
  exports: [FILE_STORAGE],
})
export class FilesModule {}

function createFileStorage() {
  if (hasSupabaseStorageEnv()) {
    return SupabaseStorageAdapter.fromEnv();
  }
  return LocalDiskStorageAdapter.fromEnv();
}

function hasSupabaseStorageEnv(): boolean {
  return Boolean(
    process.env.SUPABASE_STORAGE_BUCKET &&
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
