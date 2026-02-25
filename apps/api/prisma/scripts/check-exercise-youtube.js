import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(
    "SELECT column_name FROM information_schema.columns WHERE table_name='exercise' AND column_name='youtube_url'",
  );
  const rows = await prisma.$queryRawUnsafe(
    'SELECT id,name,scope,media_url,media_type,youtube_url,updated_at FROM exercise ORDER BY updated_at DESC LIMIT 10',
  );
  console.log('columns:', cols);
  console.log('rows:', rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
