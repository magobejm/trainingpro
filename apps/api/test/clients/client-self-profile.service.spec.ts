import { BadRequestException } from '@nestjs/common';
import { ClientSelfProfileService } from '../../src/modules/clients/application/services/client-self-profile.service';
import { UpdateOwnProfileDto } from '../../src/modules/clients/presentation/dto/update-own-profile.dto';

const context = { activeRole: 'client' as const, roles: ['client' as const], subject: 'user-1' };
const getMe = { execute: jest.fn() };
const prisma = { client: { update: jest.fn() } };
const storage = { upload: jest.fn() };
const mediaUrls = { sign: jest.fn((path: string) => `signed:${path}`) };

function service(): ClientSelfProfileService {
  return new ClientSelfProfileService(getMe as never, prisma as never, storage as never, mediaUrls as never);
}

beforeEach(() => {
  getMe.execute.mockReset();
  prisma.client.update.mockReset();
  storage.upload.mockReset();
  getMe.execute.mockResolvedValue({ id: 'c1', firstName: 'Ana' });
  prisma.client.update.mockResolvedValue({ id: 'c1' });
  storage.upload.mockResolvedValue(undefined);
});

it('rejects a profile patch without fields or with coach-only data', () => {
  expect(UpdateOwnProfileDto.schema.safeParse({}).success).toBe(false);
  expect(UpdateOwnProfileDto.schema.safeParse({ email: 'a@b.c', firstName: 'Ana' }).success).toBe(false);
  expect(UpdateOwnProfileDto.schema.safeParse({ notes: 'solo el coach' }).success).toBe(false);
  expect(UpdateOwnProfileDto.schema.parse({ allergies: '  polen ', considerations: '   ', injuries: null })).toEqual({
    allergies: 'polen',
    considerations: null,
    injuries: null,
  });
  expect(UpdateOwnProfileDto.schema.parse({ firstName: ' Ana ', phone: '' })).toEqual({
    firstName: 'Ana',
    phone: null,
  });
});

it('updates only the name, phone and health notes of the signed-in client', async () => {
  await service().update(context, { allergies: null, firstName: 'Ana', injuries: 'rodilla', phone: null });

  expect(prisma.client.update).toHaveBeenCalledWith({
    data: { allergies: null, firstName: 'Ana', injuries: 'rodilla', phone: null, updatedBy: 'user-1' },
    where: { id: 'c1' },
  });
  expect(getMe.execute).toHaveBeenCalledTimes(2);
});

it('stores the avatar on the signed-in client and returns a signed url', async () => {
  const result = await service().uploadAvatar(context, {
    buffer: Buffer.from('img'),
    mimetype: 'image/png',
    originalname: 'Cara.png',
    size: 3,
  });

  expect(storage.upload).toHaveBeenCalledWith(
    expect.objectContaining({
      contentType: 'image/png',
      path: expect.stringMatching(/^clients\/avatars\/c1\/.+-cara\.png$/),
    }),
  );
  expect(prisma.client.update).toHaveBeenCalledWith({
    data: { avatarUrl: expect.stringMatching(/^clients\/avatars\/c1\//), updatedBy: 'user-1' },
    where: { id: 'c1' },
  });
  expect(result.avatarUrl).toMatch(/^signed:clients\/avatars\/c1\//);
});

it('rejects an avatar that is not an image', async () => {
  await expect(
    service().uploadAvatar(context, { buffer: Buffer.from('x'), mimetype: 'text/plain', originalname: 'a.txt', size: 1 }),
  ).rejects.toBeInstanceOf(BadRequestException);
  expect(prisma.client.update).not.toHaveBeenCalled();
});
