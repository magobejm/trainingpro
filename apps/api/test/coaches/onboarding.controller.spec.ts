import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { AuthTokenService } from '../../src/modules/auth/application/auth-token.service';
import { AuthGuard } from '../../src/modules/auth/presentation/guards/auth.guard';
import { RolesGuard } from '../../src/modules/auth/presentation/guards/roles.guard';
import { CoachOnboardingService } from '../../src/modules/coaches/application/coach-onboarding.service';
import { CoachOnboardingController } from '../../src/modules/coaches/presentation/controllers/coach-onboarding.controller';

describe('coach onboarding HTTP authorization', () => {
  let app: INestApplication;
  const update = jest.fn().mockResolvedValue({});
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CoachOnboardingController],
      providers: [
        AuthGuard,
        RolesGuard,
        CoachOnboardingService,
        {
          provide: AuthTokenService,
          useValue: { authenticate: async (subject: string) => ({ subject, roles: ['coach', 'client'] }) },
        },
        {
          provide: PrismaService,
          useValue: {
            organizationMember: {
              findFirst: async ({ where }: { where: { user: { supabaseUid: string } } }) => ({
                id: where.user.supabaseUid,
                organizationId: 'org-1',
                onboardingHidden: where.user.supabaseUid === 'coach-2',
              }),
              update,
            },
            client: { findFirst: async () => null },
            planTemplate: { findFirst: async () => null },
            chatMessage: { findFirst: async () => null },
          },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('rejects missing authentication and a client active role on GET and PATCH', async () => {
    await request(app.getHttpServer()).get('/coaches/me/onboarding').expect(401);
    for (const method of ['get', 'patch'] as const) {
      await request(app.getHttpServer())
        [method]('/coaches/me/onboarding')
        .set('Authorization', 'Bearer coach-1')
        .set('x-active-role', 'client')
        .send({ hidden: true })
        .expect(403);
    }
    expect(update).not.toHaveBeenCalled();
  });
  it('returns independent preferences and rejects completed-step injection', async () => {
    for (const [subject, hidden] of [
      ['coach-1', false],
      ['coach-2', true],
    ] as const) {
      const response = await request(app.getHttpServer())
        .get('/coaches/me/onboarding')
        .set('Authorization', `Bearer ${subject}`)
        .set('x-active-role', 'coach')
        .expect(200);
      expect(response.body.hidden).toBe(hidden);
    }
    await request(app.getHttpServer())
      .patch('/coaches/me/onboarding')
      .set('Authorization', 'Bearer coach-1')
      .set('x-active-role', 'coach')
      .send({ hidden: true, steps: { client: true } })
      .expect(400);
    expect(update).not.toHaveBeenCalled();
    await request(app.getHttpServer())
      .patch('/coaches/me/onboarding')
      .set('Authorization', 'Bearer coach-2')
      .set('x-active-role', 'coach')
      .send({ hidden: true })
      .expect(200);
    expect(update).toHaveBeenCalledWith({ where: { id: 'coach-2' }, data: { onboardingHidden: true } });
  });
});
