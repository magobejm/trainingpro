import { existsSync, realpathSync } from 'node:fs';
import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { resolveStorageDirectory } from '../src/modules/files/infra/local/local-disk-storage.adapter';
import { contentTypeForPath } from '../src/modules/files/domain/storage-content-type';

const PREFIXES = ['clients', 'chat'];

function loadEnvFiles(): void {
  const runtime = process as unknown as { loadEnvFile?: (path?: string) => void };
  if (!runtime.loadEnvFile) {
    return;
  }
  for (const filePath of [
    resolve(process.cwd(), '.env.local'),
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env.local'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(process.cwd(), 'prisma/.env'),
    resolve(process.cwd(), '../prisma/.env'),
    resolve(process.cwd(), '../../prisma/.env'),
  ]) {
    if (existsSync(filePath)) {
      runtime.loadEnvFile(filePath);
    }
  }
}

async function main(): Promise<void> {
  loadEnvFiles();
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'apply' : 'dry-run (pass --apply to copy and delete originals)');
  await moveSupabase(apply);
  await moveLocal(apply);
}

async function moveSupabase(apply: boolean): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sourceBucket = process.env.SUPABASE_STORAGE_BUCKET;
  const targetBucket = process.env.SUPABASE_PRIVATE_STORAGE_BUCKET?.trim();
  if (!url || !key || !sourceBucket) {
    console.log('supabase skipped: storage env is not set');
    return;
  }
  if (!targetBucket) {
    throw new Error('Missing required env var: SUPABASE_PRIVATE_STORAGE_BUCKET');
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  await assertTargetIsPrivate(client, targetBucket, apply);
  const paths = [];
  for (const prefix of PREFIXES) {
    paths.push(...(await listObjects(client, sourceBucket, prefix)));
  }
  console.log(`supabase ${sourceBucket} -> ${targetBucket}: ${paths.length} objects`);
  if (!apply) {
    return;
  }
  for (const path of paths) {
    await copySupabaseObject(client, sourceBucket, targetBucket, path);
  }
}

async function assertTargetIsPrivate(client: SupabaseClient, bucket: string, apply: boolean): Promise<void> {
  const existing = await client.storage.getBucket(bucket);
  if (!existing.error && existing.data?.public) {
    throw new Error(`Refusing to move private media into public bucket "${bucket}"`);
  }
  if (existing.error && !apply) {
    console.log(`supabase private bucket "${bucket}" does not exist yet; --apply will create it`);
    return;
  }
  if (existing.error) {
    const created = await client.storage.createBucket(bucket, { public: false });
    if (created.error && !created.error.message.toLowerCase().includes('already exists')) {
      throw new Error(`Could not create private bucket: ${created.error.message}`);
    }
  }
}

async function copySupabaseObject(
  client: SupabaseClient,
  sourceBucket: string,
  targetBucket: string,
  path: string,
): Promise<void> {
  const downloaded = await client.storage.from(sourceBucket).download(path);
  if (downloaded.error || !downloaded.data) {
    throw new Error(`download ${path}: ${downloaded.error?.message ?? 'empty'}`);
  }
  const bytes = Buffer.from(await downloaded.data.arrayBuffer());
  const uploaded = await client.storage.from(targetBucket).upload(path, bytes, {
    contentType: contentTypeForPath(path),
    upsert: true,
  });
  if (uploaded.error) {
    throw new Error(`upload ${path}: ${uploaded.error.message}`);
  }
  const copied = await client.storage.from(targetBucket).download(path);
  if (copied.error || !copied.data) {
    throw new Error(`verify ${path}: ${copied.error?.message ?? 'empty'}`);
  }
  const copiedBytes = Buffer.from(await copied.data.arrayBuffer());
  if (copiedBytes.length !== bytes.length) {
    throw new Error(`size mismatch for ${path}: ${bytes.length} -> ${copiedBytes.length}`);
  }
  const removed = await client.storage.from(sourceBucket).remove([path]);
  if (removed.error) {
    throw new Error(`delete source ${path}: ${removed.error.message}`);
  }
  console.log(`  moved ${path} (${bytes.length} bytes)`);
}

async function listObjects(client: SupabaseClient, bucket: string, folder: string): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await client.storage.from(bucket).list(folder, { limit: 100, offset });
    if (error) {
      throw new Error(`list ${folder}: ${error.message}`);
    }
    if (!data || data.length === 0) {
      return paths;
    }
    for (const item of data) {
      const child = `${folder}/${item.name}`;
      if (!item.id) {
        paths.push(...(await listObjects(client, bucket, child)));
      } else {
        paths.push(child);
      }
    }
    if (data.length < 100) {
      return paths;
    }
    offset += data.length;
  }
}

async function moveLocal(apply: boolean): Promise<void> {
  const targetRoot = resolveStorageDirectory('private');
  const sources = uploadRoots().filter((dir) => existsSync(dir));
  if (sources.length === 0) {
    console.log('local uploads: none');
    return;
  }
  let count = 0;
  for (const sourceRoot of sources) {
    for (const prefix of PREFIXES) {
      const prefixDir = resolve(sourceRoot, prefix);
      if (!existsSync(prefixDir)) {
        continue;
      }
      const files = await listFiles(prefixDir);
      count += files.length;
      if (!apply) {
        continue;
      }
      for (const file of files) {
        const relativePath = relative(sourceRoot, file).replace(/\\/g, '/');
        const target = resolve(targetRoot, relativePath);
        await mkdir(dirname(target), { recursive: true });
        await copyFile(file, target);
        const [sourceStat, targetStat] = await Promise.all([stat(file), stat(target)]);
        if (sourceStat.size !== targetStat.size) {
          throw new Error(`size mismatch for ${relativePath}`);
        }
        await rm(file);
        console.log(`  moved local ${relativePath} (${sourceStat.size} bytes)`);
      }
    }
  }
  console.log(`local uploads -> ${targetRoot}: ${count} files`);
}

function uploadRoots(): string[] {
  const seen = new Set<string>();
  const roots: string[] = [];
  for (const dir of [
    resolve(process.cwd(), 'apps/storage/uploads'),
    resolve(process.cwd(), '../storage/uploads'),
    resolve(process.cwd(), '../../apps/storage/uploads'),
  ]) {
    if (!existsSync(dir)) {
      continue;
    }
    const real = realpathSync(dir);
    if (seen.has(real)) {
      continue;
    }
    seen.add(real);
    roots.push(dir);
  }
  return roots;
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
