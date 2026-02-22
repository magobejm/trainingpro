import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const templateId = 'df99599c-859f-47af-9fc2-2664171b091c';

async function debug() {
    try {
        const template = await prisma.planTemplate.findUnique({
            where: { id: templateId }
        });
        console.log('Template data:', JSON.stringify(template, null, 2));

        if (template) {
            const memberships = await prisma.organizationMember.findMany({
                where: { organizationId: template.organizationId }
            });
            console.log('Memberships for this org:', JSON.stringify(memberships, null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
