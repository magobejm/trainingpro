import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import { PLANS_REPOSITORY } from '../../src/modules/plans/domain/plans-repository.port';

type MemoryTemplate = {
    archived: boolean;
    coachMembershipId: string;
    id: string;
};

describe('Plan templates soft delete', () => {
    async function bootstrap() {
        const repository = createSoftDeleteRepository();
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(TOKEN_VERIFIER)
            .useValue({
                verify: async () => ({
                    email: 'coach-a@fitcoach.local',
                    roles: ['coach'],
                    subject: 'coach-a',
                }),
            })
            .overrideProvider(PLANS_REPOSITORY)
            .useValue(repository)
            .compile();

        const app = moduleRef.createNestApplication();
        await app.init();
        return app;
    }

    it('hides archived template from list and blocks deletion if not found', async () => {
        const app = await bootstrap();

        // First deletion should succeed (204)
        await request(app.getHttpServer())
            .delete('/plans/templates/strength/template-a')
            .set('Authorization', 'Bearer coach-a')
            .set('x-active-role', 'coach')
            .expect(204);

        // Get list should hide it
        await request(app.getHttpServer())
            .get('/plans/templates/strength')
            .set('Authorization', 'Bearer coach-a')
            .set('x-active-role', 'coach')
            .expect(200)
            .expect(({ body }) => {
                expect(body.items).toHaveLength(0);
            });

        await app.close();
    });
});

function createSoftDeleteRepository() {
    const templates: MemoryTemplate[] = [{ archived: false, coachMembershipId: 'coach-a', id: 'template-a' }];
    return {
        deleteTemplate: async (_context: { subject: string }, templateId: string) => {
            const template = templates.find((item) => item.id === templateId && !item.archived);
            if (template) {
                template.archived = true;
            }
        },
        canCoachAccessTemplate: async (coachSubject: string, templateId: string) =>
            templates.some((item) => item.id === templateId && item.coachMembershipId === coachSubject && !item.archived),
        listTemplates: async (context: { subject: string }) => {
            const visible = templates.filter((item) => item.coachMembershipId === context.subject && !item.archived);
            return visible.map(mapTemplate);
        },
        createCardioTemplate: async () => { throw new Error('not used'); },
        createTemplate: async () => { throw new Error('not used'); },
        listCardioTemplates: async () => [],
        deleteCardioTemplate: async () => { },
        updateCardioTemplate: async () => { throw new Error('not used'); },
        updateTemplate: async () => { throw new Error('not used'); },
    };
}

function mapTemplate(row: MemoryTemplate) {
    return {
        createdAt: new Date(),
        days: [],
        id: row.id,
        name: 'Fake Template',
        templateVersion: 1,
        updatedAt: new Date(),
    };
}
