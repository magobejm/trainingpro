import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../src/modules/files/domain/private-file-storage.port';
import { PrivateMediaUrlSigner } from '../../src/modules/files/domain/private-media-url-signer';
import { PrivateMediaController } from '../../src/modules/files/presentation/controllers/private-media.controller';

const PATH = 'clients/avatars/client-1/photo.jpg';

describe('PrivateMediaController', () => {
  const signer = new PrivateMediaUrlSigner({
    baseUrl: 'http://localhost:8080',
    now: () => Date.now(),
    secret: 'test-secret',
    ttlSeconds: 3600,
  });

  async function createApp(storage: PrivateFileStoragePort) {
    const moduleRef = await Test.createTestingModule({
      controllers: [PrivateMediaController],
      providers: [
        { provide: PRIVATE_FILE_STORAGE, useValue: storage },
        { provide: PrivateMediaUrlSigner, useValue: signer },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it('serves a signed file and rejects a bad signature, another path, and a missing file', async () => {
    const storage = createStorage();
    const app = await createApp(storage);
    const signed = new URL(signer.sign(PATH));

    const ok = await request(app.getHttpServer()).get(`${signed.pathname}${signed.search}`).expect(200);
    expect(ok.headers['content-type']).toMatch(/image\/jpeg/);
    expect(ok.headers['x-content-type-options']).toBe('nosniff');
    const cacheControl = ok.headers['cache-control'] ?? '';
    expect(cacheControl).toMatch(/^private, max-age=\d+$/);
    const maxAge = Number(cacheControl.replace('private, max-age=', ''));
    expect(maxAge).toBeGreaterThan(0);
    expect(maxAge).toBeLessThanOrEqual(3600);
    expect(ok.body).toEqual(Buffer.from('photo'));

    const tampered = new URL(signed.toString());
    tampered.searchParams.set('sig', 'ab');
    await request(app.getHttpServer()).get(`${tampered.pathname}${tampered.search}`).expect(403);

    const other = new URL(signer.sign('clients/progress/client-1/other.jpg'));
    other.pathname = signed.pathname;
    await request(app.getHttpServer()).get(`${other.pathname}${other.search}`).expect(403);

    const missing = new URL(signer.sign('clients/avatars/client-1/missing.jpg'));
    await request(app.getHttpServer()).get(`${missing.pathname}${missing.search}`).expect(404);
    await app.close();
  });
});

function createStorage(): PrivateFileStoragePort {
  return {
    delete: async () => undefined,
    download: async (path) => {
      if (path.endsWith('missing.jpg')) {
        return null;
      }
      return { contentType: 'image/jpeg', data: Buffer.from('photo') };
    },
    upload: async (input) => ({ path: input.path }),
  };
}
