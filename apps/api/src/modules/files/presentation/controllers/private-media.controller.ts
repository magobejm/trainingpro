import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../domain/private-file-storage.port';
import { PrivateMediaUrlSigner } from '../../domain/private-media-url-signer';

@Controller('files')
export class PrivateMediaController {
  constructor(
    @Inject(PRIVATE_FILE_STORAGE)
    private readonly storage: PrivateFileStoragePort,
    private readonly signer: PrivateMediaUrlSigner,
  ) {}

  @Get('private/*path')
  async download(
    @Param('path') pathParam: string | string[],
    @Query('exp') exp: string | undefined,
    @Query('sig') sig: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const objectPath = decodeObjectPath(pathParam);
    if (!objectPath || !this.signer.verify(objectPath, exp ?? '', sig ?? '')) {
      throw new ForbiddenException('Private media URL is invalid or expired');
    }
    const file = await this.storage.download(objectPath);
    if (!file) {
      throw new NotFoundException('Private media not found');
    }
    const remaining = Math.max(0, Number(exp) - Math.floor(Date.now() / 1000));
    response.setHeader('Cache-Control', `private, max-age=${remaining}`);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(file.data, { type: file.contentType });
  }
}

function decodeObjectPath(pathParam: string | string[] | undefined): string | null {
  if (!pathParam) {
    return null;
  }
  const joined = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
  try {
    return joined
      .split('/')
      .map((part) => decodeURIComponent(part))
      .join('/');
  } catch {
    return null;
  }
}
