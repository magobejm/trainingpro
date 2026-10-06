import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const PREFIXES = ['clients', 'library', 'chat'];

async function main(): Promise<void> {
  await printDatabaseCounts();
  await printBucketInventory();
}

async function printDatabaseCounts(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const [avatars, photos, attachments] = await Promise.all([
      prisma.client.findMany({
        where: { avatarUrl: { not: null } },
        select: { avatarUrl: true },
      }),
      prisma.clientProgressPhoto.findMany({ select: { imageUrl: true } }),
      prisma.chatAttachment.findMany({ select: { publicUrl: true, storagePath: true } }),
    ]);
    console.log('db client.avatarUrl', classify(avatars.map((row) => row.avatarUrl)));
    console.log('db progress.imageUrl', classify(photos.map((row) => row.imageUrl)));
    console.log('db chat.storagePath', classify(attachments.map((row) => row.storagePath)));
    console.log('db chat.publicUrl', classify(attachments.map((row) => row.publicUrl)));
  } finally {
    await prisma.$disconnect();
  }
}

function classify(values: Array<string | null>): string {
  let path = 0;
  let url = 0;
  let empty = 0;
  for (const value of values) {
    const trimmed = value?.trim() ?? '';
    if (!trimmed) {
      empty += 1;
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      url += 1;
    } else {
      path += 1;
    }
  }
  return `rows=${values.length} path=${path} url=${url} empty=${empty}`;
}

async function printBucketInventory(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!url || !key || !bucket) {
    console.log('bucket skipped: missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_STORAGE_BUCKET');
    return;
  }
  const client = createClient(url, key, { auth: { persistSession: false } });
  const listed = await client.storage.listBuckets();
  if (listed.error) {
    console.log(`bucket list failed: ${listed.error.message}`);
    return;
  }
  const match = listed.data?.find((item) => item.name === bucket);
  console.log(`bucket ${bucket} public=${match ? String(match.public) : 'missing'}`);
  if (!match) {
    return;
  }
  for (const prefix of PREFIXES) {
    const count = await countObjects(client, bucket, prefix);
    console.log(`objects ${prefix}/ ${count}`);
  }
}

async function countObjects(client: ReturnType<typeof createClient>, bucket: string, folder: string): Promise<number> {
  let files = 0;
  let offset = 0;
  for (;;) {
    const { data, error } = await client.storage.from(bucket).list(folder, { limit: 100, offset });
    if (error) {
      throw new Error(`list ${folder}: ${error.message}`);
    }
    if (!data || data.length === 0) {
      return files;
    }
    for (const item of data) {
      const nested = !item.id;
      if (nested) {
        files += await countObjects(client, bucket, `${folder}/${item.name}`);
      } else {
        files += 1;
      }
    }
    if (data.length < 100) {
      return files;
    }
    offset += data.length;
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
