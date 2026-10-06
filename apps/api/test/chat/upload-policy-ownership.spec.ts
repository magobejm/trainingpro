import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import type { AuthContext } from '../../src/common/auth-context/auth-context';
import { TOKEN_VERIFIER } from '../../src/modules/auth/domain/token-verifier.token';
import type { TokenVerifierPort } from '../../src/modules/auth/domain/token-verifier.port';
import { ChatThreadAccessService } from '../../src/modules/chat/infra/prisma/chat-thread-access.service';

const THREAD = '22222222-2222-4222-8222-222222222222';

describe('Upload policy ownership', () => {
  it('rejects a coach outside the thread and grants a path only to the owner', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TOKEN_VERIFIER)
      .useValue(createVerifier())
      .overrideProvider(ChatThreadAccessService)
      .useValue(createAccess())
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .post('/files/upload-policy')
      .set('Authorization', 'Bearer coach-a')
      .set('x-active-role', 'coach')
      .send(body())
      .expect(403);

    const response = await request(app.getHttpServer())
      .post('/files/upload-policy')
      .set('Authorization', 'Bearer coach-b')
      .set('x-active-role', 'coach')
      .send(body())
      .expect(201);

    expect(response.body.path.startsWith(`chat/${THREAD}/`)).toBe(true);
    await app.close();
  });
});

function body() {
  return {
    fileName: 'note.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    threadId: THREAD,
  };
}

function createAccess() {
  return {
    assertAccess: async (context: AuthContext, threadId: string) => {
      if (context.subject === 'coach-b' && threadId === THREAD) {
        return { senderRole: 'COACH' as const, threadId };
      }
      throw new ForbiddenException('Chat thread access denied');
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
