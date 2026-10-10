import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from './common/zod-validation.pipe';
import { PublicAssetUrlInterceptor } from './common/assets/public-asset-url.interceptor';
import { corsOriginCallback } from './common/cors/allowed-origins';
import { blockPrivateUploadPaths } from './modules/files/presentation/block-private-uploads';

loadEnvFiles();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Active-Role', 'X-Request-Id', 'X-Timezone-Offset'],
    exposedHeaders: ['X-Request-Id'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: corsOriginCallback,
  });
  app.use('/assets/avatars', express.static(resolveAvatarAssetsPath()));
  app.use('/assets/placeholders', express.static(resolvePlaceholderAssetsPath()));
  app.use('/assets/exercises', express.static(resolveStorageSubdir('exercises'), { maxAge: '30d' }));
  app.use('/uploads', blockPrivateUploadPaths);
  app.use('/uploads', express.static(resolveUploadsPath()));
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new PublicAssetUrlInterceptor());
  await app.listen(readPort());
}

function resolveAvatarAssetsPath(): string {
  const candidates = [
    resolve(process.cwd(), 'apps/storage/avatar'),
    resolve(process.cwd(), '../storage/avatar'),
    resolve(process.cwd(), '../../apps/storage/avatar'),
  ];
  const match = candidates.find((item) => existsSync(item));
  return match ?? resolve(process.cwd(), 'apps/storage/avatar');
}

function resolvePlaceholderAssetsPath(): string {
  const candidates = [
    resolve(process.cwd(), 'apps/storage/placeholders'),
    resolve(process.cwd(), '../storage/placeholders'),
    resolve(process.cwd(), '../../apps/storage/placeholders'),
  ];
  const match = candidates.find((item) => existsSync(item));
  return match ?? resolve(process.cwd(), 'apps/storage/placeholders');
}

function resolveStorageSubdir(name: string): string {
  const candidates = [
    resolve(process.cwd(), `apps/storage/${name}`),
    resolve(process.cwd(), `../storage/${name}`),
    resolve(process.cwd(), `../../apps/storage/${name}`),
  ];
  const match = candidates.find((item) => existsSync(item));
  return match ?? resolve(process.cwd(), `apps/storage/${name}`);
}

function resolveUploadsPath(): string {
  const candidates = [
    resolve(process.cwd(), 'apps/storage/uploads'),
    resolve(process.cwd(), '../storage/uploads'),
    resolve(process.cwd(), '../../apps/storage/uploads'),
  ];
  const match = candidates.find((item) => existsSync(item));
  return match ?? resolve(process.cwd(), 'apps/storage/uploads');
}

void bootstrap().catch((error: unknown) => {
  console.error('Failed to start API', error);
  process.exit(1);
});

function loadEnvFiles(): void {
  const runtime = process as unknown as { loadEnvFile?: (path?: string) => void };
  if (!runtime.loadEnvFile) {
    return;
  }
  for (const filePath of envCandidates()) {
    if (existsSync(filePath)) {
      runtime.loadEnvFile(filePath);
    }
  }
}

function envCandidates(): string[] {
  return [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env.local'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(process.cwd(), 'prisma/.env'),
    resolve(process.cwd(), '../prisma/.env'),
    resolve(process.cwd(), '../../prisma/.env'),
  ];
}

function readPort(): number {
  const fallback = 8080;
  const raw = process.env.PORT;
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
