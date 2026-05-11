import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createClient } from '@supabase/supabase-js';

async function main(): Promise<void> {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const bucket = requireEnv('SUPABASE_STORAGE_BUCKET');

  const uploadsRoot = resolve(process.cwd(), 'apps/storage/uploads');
  const files = await listFilesRecursive(uploadsRoot);
  if (files.length === 0) {
    console.log('No files found under apps/storage/uploads');
    return;
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log(`Uploading ${files.length} files to bucket "${bucket}"...`);
  let uploaded = 0;
  let skipped = 0;
  for (const absolutePath of files) {
    const remotePath = relative(uploadsRoot, absolutePath).replace(/\\/g, '/');
    if (remotePath === 'probe.txt') {
      continue;
    }
    const data = await readFile(absolutePath);
    const { error } = await client.storage
      .from(bucket)
      .upload(remotePath, data, { upsert: true, contentType: guessContentType(remotePath) });
    if (error) {
      console.error(`  FAIL ${remotePath}: ${error.message}`);
      skipped += 1;
      continue;
    }
    console.log(`  OK   ${remotePath}`);
    uploaded += 1;
  }
  console.log(`Done. Uploaded ${uploaded}, failed ${skipped}.`);
}

async function listFilesRecursive(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = resolve(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFilesRecursive(full)));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function guessContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    txt: 'text/plain',
  };
  return map[ext] ?? 'application/octet-stream';
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
