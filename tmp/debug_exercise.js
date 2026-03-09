import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const e = await prisma.exercise.findFirst({
    where: { name: '11111' },
  });
  console.log('--- EXERCISE DATA START ---');
  console.log(JSON.stringify(e, null, 2));
  console.log('--- EXERCISE DATA END ---');

  const c = await prisma.cardioMethod.findFirst({
    where: { name: '11111' },
  });
  if (c) {
    console.log('--- CARDIO DATA START ---');
    console.log(JSON.stringify(c, null, 2));
    console.log('--- CARDIO DATA END ---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
