import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import type { TokenVerifierPort } from '../../src/modules/auth/domain/token-verifier.port';
import { PLANS_REPOSITORY } from '../../src/modules/plans/domain/plans-repository.port';

type MemoryTemplate = {
    coachMembershipId: string;
    id: string;
};

describe('Plan templates endpoints', () => {
    async function bootstrap() {
        const repository = createRepository();
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(TOKEN_VERIFIER)
            .useValue(createVerifier())
            .overrideProvider(PLANS_REPOSITORY)
            .useValue(repository)
            .compile();

        const app = moduleRef.createNestApplication();
        await app.init();
        return app;
    }

    it('blocks coach A from deleting coach B template', async () => {
        const app = await bootstrap();
        await request(app.getHttpServer())
            .delete('/plans/templates/strength/template-b')
            .set('Authorization', 'Bearer coach-a')
            .set('x-active-role', 'coach')
            .expect(403);
        await app.close();
    });

    it('allows coach B to delete own template', async () => {
        const app = await bootstrap();
        await request(app.getHttpServer())
            .delete('/plans/templates/strength/template-b')
            .set('Authorization', 'Bearer coach-b')
            .set('x-active-role', 'coach')
            .expect(204);
        await app.close();
    });

    it('blocks coach A from updating coach B template', async () => {
        const app = await bootstrap();
        await request(app.getHttpServer())
            .patch('/plans/templates/strength/template-b')
            .set('Authorization', 'Bearer coach-a')
            .set('x-active-role', 'coach')
            .send({ name: 'Hacked Name', days: [] })
            .expect(403);
        await app.close();
    });

    it('allows coach B to update own template', async () => {
        const app = await bootstrap();
        await request(app.getHttpServer())
            .patch('/plans/templates/strength/template-b')
            .set('Authorization', 'Bearer coach-b')
            .set('x-active-role', 'coach')
            .send({ name: 'Updated Name', days: [] })
            .expect(200);
        await app.close();
    });
});

function createRepository() {
    const templates: MemoryTemplate[] = [{ coachMembershipId: 'coach-b', id: 'template-b' }];
    return {
        canCoachAccessTemplate: async (coachSubject: string, templateId: string) =>
            templates.some((t) => t.id === templateId && t.coachMembershipId === coachSubject),
        deleteTemplate: async () => { },
        createCardioTemplate: async () => { throw new Error('not used'); },
        createTemplate: async () => { throw new Error('not used'); },
        listCardioTemplates: async () => [],
        listTemplates: async () => [],
        deleteCardioTemplate: async () => { },
        updateCardioTemplate: async () => { throw new Error('not used'); },
        updateTemplate: async () => {
            return {
                id: 'template-b',
                name: 'Updated Name',
                days: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                templateVersion: 1
            };
        },
    };
}

function createVerifier(): TokenVerifierPort {
    return {
        verify: async (token: string) => ({
            email: `${token}@fitcoach.local`,
            roles: ['coach'],
            subject: token,
        }),
    };
}
