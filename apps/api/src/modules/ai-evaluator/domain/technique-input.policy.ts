import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

export const EVALUATOR_MAX_BYTES = 20 * 1024 * 1024;
export const EVALUATOR_MAX_DURATION_SECONDS = 30;
export const EVALUATOR_CLIP_SECONDS = 10;
export const EVALUATOR_FFMPEG_TIMEOUT_MS = 20_000;
export const EVALUATOR_PROVIDER_TIMEOUT_MS = 30_000;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'video/webm']);

export type TechniqueUpload = {
  mimetype: string;
  size: number;
};

export function assertTechniqueFile(file: TechniqueUpload | undefined): void {
  if (!file || file.size <= 0) {
    throw new BadRequestException('Se requiere una imagen o un vídeo.');
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException('El archivo debe ser JPG, PNG, MP4, MOV o WEBM.');
  }
  if (file.size > EVALUATOR_MAX_BYTES) {
    throw new BadRequestException('El archivo no puede superar 20 MB.');
  }
}

export function assertVideoDuration(seconds: number): void {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new BadRequestException('No se pudo leer la duración del vídeo.');
  }
  if (seconds > EVALUATOR_MAX_DURATION_SECONDS) {
    throw new BadRequestException('El vídeo no puede superar 30 segundos.');
  }
}

export function toEvaluatorProviderFailure(): ServiceUnavailableException {
  return new ServiceUnavailableException('El evaluador no está disponible. Puedes intentarlo de nuevo.');
}
