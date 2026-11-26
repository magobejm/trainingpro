import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../../files/domain/private-file-storage.port';
import { PrivateMediaUrlSigner } from '../../../files/domain/private-media-url-signer';
import type { Client } from '../../domain/client';
import { GetClientMeUseCase } from '../use-cases/get-client-me.usecase';
import { buildAvatarPath, validateAvatarFile } from '../use-cases/upload-client-avatar.usecase';

export type OwnProfilePatch = {
  allergies?: string | null;
  considerations?: string | null;
  firstName?: string;
  injuries?: string | null;
  lastName?: string;
  phone?: string | null;
};

type AvatarFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

@Injectable()
export class ClientSelfProfileService {
  constructor(
    private readonly getClientMeUseCase: GetClientMeUseCase,
    private readonly prisma: PrismaService,
    @Inject(PRIVATE_FILE_STORAGE)
    private readonly storage: PrivateFileStoragePort,
    private readonly mediaUrls: PrivateMediaUrlSigner,
  ) {}

  async update(context: AuthContext, input: OwnProfilePatch): Promise<Client> {
    const client = await this.getClientMeUseCase.execute(context);
    await this.prisma.client.update({
      data: {
        ...(input.allergies !== undefined ? { allergies: input.allergies } : {}),
        ...(input.considerations !== undefined ? { considerations: input.considerations } : {}),
        ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
        ...(input.injuries !== undefined ? { injuries: input.injuries } : {}),
        ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        updatedBy: context.subject,
      },
      where: { id: client.id },
    });
    return this.getClientMeUseCase.execute(context);
  }

  async uploadAvatar(context: AuthContext, file: AvatarFile | undefined): Promise<{ avatarUrl: string }> {
    if (!file) throw new BadRequestException('Missing avatar file');
    validateAvatarFile(file);
    const client = await this.getClientMeUseCase.execute(context);
    const path = buildAvatarPath(client.id, file);
    await this.storage.upload({ contentType: file.mimetype, data: file.buffer, path, upsert: true });
    await this.prisma.client.update({ data: { avatarUrl: path, updatedBy: context.subject }, where: { id: client.id } });
    return { avatarUrl: this.mediaUrls.sign(path) };
  }
}
