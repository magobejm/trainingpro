import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import type { TokenVerifierPort } from '../../src/modules/auth/domain/token-verifier.port';

describe('Auth security', () => {
  async function bootstrap(verifier: TokenVerifierPort) {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue(verifier)
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it('rejects protected endpoint without token', async () => {
    const app = await bootstrap({
      verify: async () => ({ email: 'x@x.com', roles: ['coach'], subject: 'user-1' }),
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('x-active-role', 'coach')
      .expect(401);

    await app.close();
  });

  it('returns 401 when token verifier fails', async () => {
    const app = await bootstrap({
      verify: async () => {
        throw new UnauthorizedException('Invalid');
      },
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer invalid-token')
      .set('x-active-role', 'coach')
      .expect(401);

    await app.close();
  });

  it('returns 403 when active role is not part of user roles', async () => {
    const app = await bootstrap({
      verify: async () => ({ email: 'x@x.com', roles: ['coach'], subject: 'user-1' }),
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer valid-token')
      .set('x-active-role', 'admin')
      .expect(403);

    await app.close();
  });

  it('returns 401 when x-active-role header is missing', async () => {
    const app = await bootstrap({
      verify: async () => ({ email: 'x@x.com', roles: ['coach'], subject: 'user-1' }),
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer valid-token')
      .expect(401);

    await app.close();
  });

  it('allows request when active role belongs to authenticated user', async () => {
    const app = await bootstrap({
      verify: async () => ({ email: 'x@x.com', roles: ['coach', 'client'], subject: 'user-1' }),
    });

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer valid-token')
      .set('x-active-role', 'coach')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          email: 'x@x.com',
          roles: ['coach', 'client'],
        });
      });

    await app.close();
  });
});
