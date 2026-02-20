import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from './common/zod-validation.pipe';

loadEnvFiles();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Active-Role'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    origin: allowedCorsOrigins(),
  });
  app.use('/assets/avatars', express.static(resolveAvatarAssetsPath()));
  app.use('/uploads', express.static(resolveUploadsPath()));
  app.useGlobalPipes(new ZodValidationPipe());
  await app.listen(process.env.PORT ?? 8080);
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

function resolveUploadsPath(): string {
  const candidates = [
    resolve(process.cwd(), 'apps/storage/uploads'),
    resolve(process.cwd(), '../storage/uploads'),
    resolve(process.cwd(), '../../apps/storage/uploads'),
  ];
  const match = candidates.find((item) => existsSync(item));
  return match ?? resolve(process.cwd(), 'apps/storage/uploads');
}

void bootstrap();

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

function allowedCorsOrigins(): string[] {
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:19006',
    'http://127.0.0.1:19006',
  ];
  const raw = process.env.CORS_ORIGINS;
  if (!raw) {
    return defaults;
  }
  const fromEnv = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return [...new Set([...defaults, ...fromEnv])];
}
