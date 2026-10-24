import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { AuthContext } from '../../../../common/auth-context/auth-context';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { CHAT_REPOSITORY, type ChatRepositoryPort } from '../../../chat/domain/chat.repository.port';
import {
  MEASUREMENT_HISTORY_LIMIT,
  mapClientMeasurement,
  measurementDraft,
  type ClientMeasurement,
  type MeasurementDraft,
} from '../../domain/client-measurement';
import type { ClientProgressPhoto } from '../../domain/client-progress-photo';
import { saveClientMeasurement } from '../../infra/prisma/client-measurement.prisma';
import { GetClientMeUseCase } from '../use-cases/get-client-me.usecase';
import { UploadClientProgressPhotoUseCase } from '../use-cases/upload-client-progress-photo.usecase';
import { measurementNotice, progressPhotoNotice } from './client-self-progress.messages';
import { parseProgressPose } from './parse-progress-pose';

type PhotoFile = { buffer: Buffer; mimetype: string; originalname: string; size: number };

@Injectable()
export class ClientSelfProgressService {
  private readonly logger = new Logger(ClientSelfProgressService.name);

  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: ChatRepositoryPort,
    private readonly getClientMeUseCase: GetClientMeUseCase,
    private readonly prisma: PrismaService,
    private readonly uploadClientProgressPhotoUseCase: UploadClientProgressPhotoUseCase,
  ) {}

  async listMine(context: AuthContext): Promise<ClientMeasurement[]> {
    const client = await this.getClientMeUseCase.execute(context);
    const rows = await this.prisma.clientMeasurement.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: MEASUREMENT_HISTORY_LIMIT,
      where: { clientId: client.id },
    });
    return rows.map(mapClientMeasurement);
  }

  async recordMeasurement(context: AuthContext, input: MeasurementDraft): Promise<ClientMeasurement> {
    const draft = measurementDraft(input);
    if (!draft || !hasNumber(draft)) throw new BadRequestException('At least one measurement is required');
    const client = await this.getClientMeUseCase.execute(context);
    const row = await this.prisma.$transaction((tx) => saveClientMeasurement(tx, client.id, draft));
    await this.notifyCoach(context, measurementNotice(draft));
    return mapClientMeasurement(row);
  }

  async uploadPhoto(context: AuthContext, file: PhotoFile | undefined, poseRaw: unknown): Promise<ClientProgressPhoto> {
    if (!file) throw new BadRequestException('Missing progress photo file');
    const pose = parseProgressPose(poseRaw, true);
    if (!pose) throw new BadRequestException('Progress photo pose is required');
    const client = await this.getClientMeUseCase.execute(context);
    const photo = await this.uploadClientProgressPhotoUseCase.execute(context, client.id, file, {
      pose,
      uploadedBy: 'client',
    });
    await this.notifyCoach(context, progressPhotoNotice(pose));
    return photo;
  }

  private async notifyCoach(context: AuthContext, text: string): Promise<void> {
    try {
      const thread = await this.chatRepository.resolveThread(context, {});
      await this.chatRepository.sendMessage(context, { text, threadId: thread.id });
    } catch (error) {
      this.logger.error('Could not notify coach', error instanceof Error ? error.stack : undefined);
    }
  }
}

function hasNumber(draft: MeasurementDraft): boolean {
  return Object.values(draft).some((value) => typeof value === 'number');
}
