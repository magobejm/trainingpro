import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type ClientRow = Prisma.ClientGetPayload<{
  include: {
    objectiveRef: true;
    trainingPlan: { select: { id: true; name: true } };
  };
}>;

async function processClients(clients: ClientRow[]) {
  for (const row of clients) {
    try {
      const mapped = {
        id: row.id,
        firstName: row.firstName,
        objective: row.objectiveRef.label,
        trainingPlan: row.trainingPlan
          ? {
              id: row.trainingPlan.id,
              name: row.trainingPlan.name,
            }
          : undefined,
      };
      console.log('Client processed:', mapped.id);
    } catch (e) {
      console.error('Error mapping client ID:', row.id, e);
    }
  }
}

async function main() {
  try {
    console.log('Fetching clients...');
    const clients = await prisma.client.findMany({
      include: {
        objectiveRef: true,
        trainingPlan: { select: { id: true, name: true } },
      },
      where: { archivedAt: null },
    });
    console.log(`Found ${clients.length} clients.`);
    await processClients(clients);
    console.log('Diagnosis finished successfully.');
  } catch (e) {
    console.error('Core error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
