import { BadRequestException, HttpException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Type } from '@google/genai';
import type { AuthContext } from '../../../common/auth-context/auth-context';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { GeminiService } from '../../ai/gemini.service';
import { ChatThreadAccessService } from '../../chat/infra/prisma/chat-thread-access.service';
import { PRIVATE_FILE_STORAGE, type PrivateFileStoragePort } from '../../files/domain/private-file-storage.port';
import { prepareTechniqueMedia } from '../domain/technique-media';
import {
  assertTechniqueFile,
  EVALUATOR_PROVIDER_TIMEOUT_MS,
  toEvaluatorProviderFailure,
} from '../domain/technique-input.policy';

type TechniqueUpload = { buffer: Buffer; mimetype: string; size: number };

@Injectable()
export class AnalyzeTechniqueUseCase {
  constructor(
    private readonly gemini: GeminiService,
    private readonly prisma: PrismaService,
    private readonly threadAccess: ChatThreadAccessService,
    @Inject(PRIVATE_FILE_STORAGE) private readonly storage: PrivateFileStoragePort,
  ) {}

  async execute(file: Express.Multer.File | undefined, exerciseName?: string) {
    assertTechniqueFile(file);
    if (!file) throw toEvaluatorProviderFailure();
    return this.analyzeBuffer(file, exerciseName);
  }

  /** Analyzes a video/image the client already sent in a chat thread the coach can access. */
  async executeForAttachment(context: AuthContext, attachmentId: string, exerciseName?: string) {
    const attachment = await this.prisma.chatAttachment.findUnique({
      select: { kind: true, message: { select: { threadId: true } }, mimeType: true, storagePath: true },
      where: { id: attachmentId },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    await this.threadAccess.assertAccess(context, attachment.message.threadId);
    if (attachment.kind !== 'VIDEO' && attachment.kind !== 'IMAGE') {
      throw new BadRequestException('Solo se pueden analizar vídeos o imágenes.');
    }
    const stored = await this.storage.download(attachment.storagePath);
    if (!stored) throw new NotFoundException('Attachment file not found');
    return this.analyzeBuffer(
      { buffer: stored.data, mimetype: attachment.mimeType, size: stored.data.length },
      exerciseName,
    );
  }

  async analyzeBuffer(file: TechniqueUpload, exerciseName?: string) {
    assertTechniqueFile(file);
    if (!this.gemini.isConfigured()) throw toEvaluatorProviderFailure();
    try {
      const media = await prepareTechniqueMedia(file);
      return await this.gemini.generateJson({
        parts: [
          { text: buildPrompt(exerciseName) },
          { inlineData: { data: media.contentBase64, mimeType: media.mimeType } },
        ],
        schema: responseSchema(),
        timeoutMs: EVALUATOR_PROVIDER_TIMEOUT_MS,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof HttpException && error.getStatus() < 500) throw error;
      throw toEvaluatorProviderFailure();
    }
  }
}

function buildPrompt(exerciseName?: string): string {
  const base =
    'Actúa como un preparador físico experto. ' +
    'Analiza este contenido multimedia del usuario realizando un ejercicio y devuelve ' +
    'exclusivamente un objeto JSON que evalúe la postura basándote en estándares de seguridad biomecánica.';
  if (!exerciseName) return base;
  return `${base} El ejercicio que se está intentando ejecutar es: "${exerciseName}".`;
}

function responseSchema() {
  return {
    properties: {
      analisis_puntos_clave: {
        properties: {
          alineacion_articulaciones: { type: Type.STRING },
          espalda: { type: Type.STRING },
          rango_movimiento: { type: Type.STRING },
        },
        type: Type.OBJECT,
      },
      correccion_inmediata: { type: Type.STRING },
      ejercicio: { type: Type.STRING },
      errores_detectados: { items: { type: Type.STRING }, type: Type.ARRAY },
      fase_movimiento: { type: Type.STRING },
      score_seguridad: { type: Type.INTEGER },
    },
    required: [
      'ejercicio',
      'fase_movimiento',
      'analisis_puntos_clave',
      'errores_detectados',
      'correccion_inmediata',
      'score_seguridad',
    ],
    type: Type.OBJECT,
  };
}
