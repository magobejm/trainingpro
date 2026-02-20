import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';

describe('Cron security', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret';
  });

  async function bootstrap() {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue({
        verify: async () => ({ email: 'x@x.com', roles: ['coach'], subject: 'user-1' }),
      })
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it('rejects dispatch endpoint without cron header', async () => {
    const app = await bootstrap();

    await request(app.getHttpServer()).post('/maintenance/dispatch').expect(401);

    await app.close();
  });

  it('rejects dispatch endpoint with wrong cron header', async () => {
    const app = await bootstrap();

    await request(app.getHttpServer())
      .post('/maintenance/dispatch')
      .set('x-cron-secret', 'wrong')
      .expect(403);

    await app.close();
  });
});
