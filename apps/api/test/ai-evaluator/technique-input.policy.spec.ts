import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import {
  assertTechniqueFile,
  assertVideoDuration,
  EVALUATOR_MAX_BYTES,
  toEvaluatorProviderFailure,
} from '../../src/modules/ai-evaluator/domain/technique-input.policy';

describe('technique upload policy', () => {
  test('rejects a missing, empty, unknown or oversized file', () => {
    expect(() => assertTechniqueFile(undefined)).toThrow(BadRequestException);
    expect(() => assertTechniqueFile({ mimetype: 'image/jpeg', size: 0 })).toThrow('Se requiere una imagen o un vídeo.');
    expect(() => assertTechniqueFile({ mimetype: 'application/pdf', size: 10 })).toThrow(
      'El archivo debe ser JPG, PNG, MP4, MOV o WEBM.',
    );
    expect(() => assertTechniqueFile({ mimetype: 'video/mp4', size: EVALUATOR_MAX_BYTES + 1 })).toThrow(
      'El archivo no puede superar 20 MB.',
    );
  });

  test('accepts a jpeg within the size limit', () => {
    expect(() => assertTechniqueFile({ mimetype: 'image/jpeg', size: EVALUATOR_MAX_BYTES })).not.toThrow();
  });
});

describe('technique duration policy', () => {
  test('rejects an unreadable duration and a clip longer than 30 seconds', () => {
    expect(() => assertVideoDuration(Number.NaN)).toThrow('No se pudo leer la duración del vídeo.');
    expect(() => assertVideoDuration(0)).toThrow('No se pudo leer la duración del vídeo.');
    expect(() => assertVideoDuration(30.1)).toThrow('El vídeo no puede superar 30 segundos.');
  });

  test('accepts a clip of exactly 30 seconds', () => {
    expect(() => assertVideoDuration(30)).not.toThrow();
  });
});

describe('technique provider failure', () => {
  test('hides the provider and ffmpeg details', () => {
    const failure = toEvaluatorProviderFailure();
    const body = JSON.stringify(failure.getResponse());
    expect(failure).toBeInstanceOf(ServiceUnavailableException);
    expect(failure.getStatus()).toBe(503);
    expect(body).not.toMatch(/ffmpeg|GEMINI|api key/i);
    expect(body).toContain('Puedes intentarlo de nuevo');
  });
});
