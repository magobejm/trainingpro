import { CoachBrandingService } from '../../src/modules/coaches/application/coach-branding.service';
import { PrivateMediaUrlSigner } from '../../src/modules/files/domain/private-media-url-signer';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import sharp from 'sharp';

const context = { activeRole: 'coach' as const, roles: ['coach' as const], subject: 'uid-1' };
const member = { id: 'coach-1', brandAccent: null, brandLogoPath: 'coaches/coach-1/branding/old.png' };
function setup() {
  const members = {
    findFirst: jest.fn().mockResolvedValue(member),
    update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ ...member, ...data })),
  };
  const storage = {
    upload: jest.fn().mockImplementation(({ path }: { path: string }) => Promise.resolve({ path })),
    delete: jest.fn().mockResolvedValue(undefined), download: jest.fn(),
  };
  const prisma = { organizationMember: members } as unknown as PrismaService;
  return { members, storage, service: new CoachBrandingService(prisma, storage, PrivateMediaUrlSigner.fromEnv()) };
}
const png = () => sharp({ create: { width: 2, height: 3, channels: 4, background: '#ff000080' } }).png().toBuffer();

describe('coach branding', () => {
  it('rejects a non-coach context before reading storage', async () => {
    const service = new CoachBrandingService(null as never, null as never, null as never);
    await expect(service.get({ activeRole: 'client', roles: ['client'], subject: 'uid' })).rejects.toThrow();
  });
  it('resolves only the active authenticated membership and signs its logo', async () => {
    const { service, members } = setup();
    const result = await service.get(context);
    expect(members.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ archivedAt: null, isActive: true, user: { supabaseUid: 'uid-1' } }),
    }));
    expect(result.brandLogoUrl).toContain('/files/private/coaches/coach-1/branding/old.png?');
  });
  it('rejects fake bytes, missing files and oversized images without uploading', async () => {
    const { service, storage } = setup();
    for (const buffer of [Buffer.from('fake png'), Buffer.alloc(2 * 1024 * 1024 + 1)]) {
      await expect(service.uploadLogo(context, { buffer })).rejects.toThrow();
    }
    await expect(service.uploadLogo(context, undefined)).rejects.toThrow();
    expect(storage.upload).not.toHaveBeenCalled();
  });
  it('normalizes valid logos and removes the old object after updating', async () => {
    const { service, storage, members } = setup();
    const result = await service.uploadLogo(context, { buffer: await png() });
    const input = storage.upload.mock.calls[0]?.[0];
    expect(input.path).toMatch(/^coaches\/coach-1\/branding\/.+\.png$/);
    expect((await sharp(input.data).metadata()).format).toBe('png');
    expect(result.brandLogoUrl).toContain(input.path);
    expect(storage.delete).toHaveBeenCalledWith(member.brandLogoPath);
    expect(members.update.mock.invocationCallOrder[0]).toBeLessThan(storage.delete.mock.invocationCallOrder[0]!);
  });
  it('preserves the old logo when storage fails', async () => {
    const { service, storage, members } = setup();
    storage.upload.mockRejectedValue(new Error('offline'));
    await expect(service.uploadLogo(context, { buffer: await png() })).rejects.toThrow('offline');
    expect(members.update).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });
  it('cleans up a new object if saving the logo fails', async () => {
    const { service, storage, members } = setup();
    members.update.mockRejectedValue(new Error('db offline'));
    await expect(service.uploadLogo(context, { buffer: await png() })).rejects.toThrow('db offline');
    expect(storage.delete).toHaveBeenCalledWith(storage.upload.mock.calls[0]?.[0].path);
    expect(storage.delete).not.toHaveBeenCalledWith(member.brandLogoPath);
  });
  it('validates accents and removes branding', async () => {
    const { service, members } = setup();
    await expect(service.patch(context, { brandAccent: 'invalid' as 'blue' })).rejects.toThrow();
    expect((await service.patch(context, { brandAccent: 'teal' })).brandAccent).toBe('teal');
    expect((await service.removeLogo(context)).brandLogoUrl).toBeNull();
    expect(members.update).toHaveBeenLastCalledWith({ where: { id: 'coach-1' }, data: { brandLogoPath: null } });
  });
  it('keeps two trainers branding isolated', async () => {
    const { service, members } = setup();
    members.findFirst.mockImplementation(({ where }) => Promise.resolve({
      ...member, id: where.user.supabaseUid, brandLogoPath: null,
    }));
    await service.patch(context, { brandAccent: 'blue' });
    await service.patch({ ...context, subject: 'uid-2' }, { brandAccent: 'pink' });
    expect(members.update.mock.calls.map(([input]) => input.where.id)).toEqual(['uid-1', 'uid-2']);
  });
  it('embeds private logo bytes as RGB JPEG for a light PDF', async () => {
    const { service, storage } = setup();
    storage.download.mockResolvedValue({ data: await png(), contentType: 'image/png' });
    const branding = await service.pdfBranding(context);
    const metadata = await sharp(branding.logo!.data).metadata();
    expect(metadata.format).toBe('jpeg');
    expect(metadata.channels).toBe(3);
    expect(branding.logo).toMatchObject({ width: 2, height: 3 });
    expect(storage.download).toHaveBeenCalledWith(member.brandLogoPath);
  });
});
