import { randomUUID } from 'node:crypto';
import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import sharp from 'sharp';
import { z } from 'zod';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../files/domain/private-file-storage.port';
import { PrivateMediaUrlSigner } from '../../files/domain/private-media-url-signer';

export const brandingPatchSchema = z.object({
  brandAccent: z.enum(['blue', 'indigo', 'violet', 'teal', 'green', 'orange', 'pink', 'slate']).nullable(),
}).strict();
type BrandingMember = { id: string; brandAccent: string | null; brandLogoPath: string | null };

@Injectable()
export class CoachBrandingService {
  private readonly logger = new Logger(CoachBrandingService.name);
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PRIVATE_FILE_STORAGE) private readonly storage: PrivateFileStoragePort,
    private readonly signer: PrivateMediaUrlSigner,
  ) {}

  async get(context: AuthContext) {
    return this.present(await this.resolve(context));
  }

  async patch(context: AuthContext, input: unknown) {
    const parsed = brandingPatchSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid brand accent');
    const coach = await this.resolve(context);
    const updated = await this.prisma.organizationMember.update({ where: { id: coach.id }, data: parsed.data });
    return this.present(updated);
  }

  async uploadLogo(context: AuthContext, file: { buffer: Buffer } | undefined) {
    const coach = await this.resolve(context);
    const data = await normalizeLogo(file?.buffer);
    const path = `coaches/${coach.id}/branding/${randomUUID()}.png`;
    await this.storage.upload({ path, data, contentType: 'image/png', upsert: false });
    let updated: BrandingMember;
    try {
      updated = await this.prisma.organizationMember.update({ where: { id: coach.id }, data: { brandLogoPath: path } });
    } catch (error) {
      await this.cleanup(path);
      throw error;
    }
    if (coach.brandLogoPath) await this.cleanup(coach.brandLogoPath);
    return this.present(updated);
  }

  async removeLogo(context: AuthContext) {
    const coach = await this.resolve(context);
    const updated = await this.prisma.organizationMember.update({ where: { id: coach.id }, data: { brandLogoPath: null } });
    if (coach.brandLogoPath) await this.cleanup(coach.brandLogoPath);
    return this.present(updated);
  }

  async pdfBranding(context: AuthContext) {
    const coach = await this.resolve(context);
    const file = coach.brandLogoPath ? await this.storage.download(coach.brandLogoPath) : null;
    const image = file ? await sharp(file.data).flatten({ background: '#ffffff' })
      .toColourspace('srgb').jpeg().toBuffer({ resolveWithObject: true }) : null;
    const logo = image ? { data: image.data, width: image.info.width, height: image.info.height } : undefined;
    return { accent: coach.brandAccent, logo };
  }

  private async resolve(context: AuthContext): Promise<BrandingMember> {
    if (context.activeRole !== 'coach') throw new ForbiddenException('Only coaches can manage branding');
    const coach = await this.prisma.organizationMember.findFirst({
      where: { archivedAt: null, isActive: true, role: Role.COACH, user: { supabaseUid: context.subject } },
      select: { id: true, brandAccent: true, brandLogoPath: true },
    });
    if (!coach) throw new NotFoundException('Coach membership not found');
    return coach;
  }

  private present(coach: BrandingMember) {
    return {
      brandAccent: coach.brandAccent,
      brandLogoUrl: coach.brandLogoPath ? this.signer.sign(coach.brandLogoPath) : null,
    };
  }

  private async cleanup(path: string) {
    try { await this.storage.delete(path); }
    catch { this.logger.warn('Could not remove obsolete branding logo'); }
  }
}

async function normalizeLogo(buffer: Buffer | undefined): Promise<Buffer> {
  if (!buffer?.length || buffer.length > 2 * 1024 * 1024) {
    throw new BadRequestException('Logo must be PNG or JPEG up to 2 MB');
  }
  try {
    const image = sharp(buffer, { limitInputPixels: 16_000_000, animated: false });
    const metadata = await image.metadata();
    if (!['png', 'jpeg'].includes(metadata.format ?? '') || (metadata.pages ?? 1) > 1) throw new Error('Invalid format');
    return await image.rotate().resize(512, 512, { fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  } catch {
    throw new BadRequestException('Logo must contain a valid PNG or JPEG image');
  }
}
