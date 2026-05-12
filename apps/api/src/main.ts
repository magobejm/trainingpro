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
    origin: isAllowedCorsOrigin,
  });
  app.use('/assets/avatars', express.static(resolveAvatarAssetsPath()));
  app.use('/assets/placeholders', express.static(resolvePlaceholderAssetsPath()));
  app.use('/uploads', express.static(resolveUploadsPath()));
  app.useGlobalPipes(new ZodValidationPipe());
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

const STATIC_CORS_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
]);

// Hosting domains allowed by pattern. Covers Firebase Hosting (admin web) and
// EAS Hosting (mobile-as-web), including EAS preview deployments which use a
// `<slug>--<hash>.expo.app` form. Using a matcher instead of a static list keeps
// us off the comma-delimited `CORS_ORIGINS` env var, which the Cloud Run deploy
// action mangles when a value contains commas.
const CORS_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.web\.app$/i,
  /^https:\/\/[a-z0-9-]+\.firebaseapp\.com$/i,
  /^https:\/\/trainer-pro-mobile(--[a-z0-9]+)?\.expo\.app$/i,
];

function envCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isAllowedCorsOrigin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void {
  // No Origin header → same-origin / non-browser request (curl, server-to-server).
  if (!origin) {
    callback(null, true);
    return;
  }
  const allowed =
    STATIC_CORS_ORIGINS.has(origin) ||
    envCorsOrigins().includes(origin) ||
    CORS_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
  callback(allowed ? null : new Error(`Origin not allowed by CORS: ${origin}`), allowed);
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
