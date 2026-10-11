import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { prepareTechniqueMedia } from '../domain/technique-media';
import {
  assertTechniqueFile,
  EVALUATOR_PROVIDER_TIMEOUT_MS,
  toEvaluatorProviderFailure,
} from '../domain/technique-input.policy';

@Injectable()
export class AnalyzeTechniqueUseCase {
  private readonly ai: GoogleGenAI | null;

  constructor() {
    this.ai = createAiClient();
  }

  async execute(file: Express.Multer.File | undefined, exerciseName?: string) {
    assertTechniqueFile(file);
    if (!this.ai || !file) throw toEvaluatorProviderFailure();
    try {
      const media = await prepareTechniqueMedia(file);
      const text = await withTimeout(requestAnalysis(this.ai, media, exerciseName), EVALUATOR_PROVIDER_TIMEOUT_MS);
      return parseAnalysis(text);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof HttpException && error.getStatus() < 500) throw error;
      throw toEvaluatorProviderFailure();
    }
  }
}

function createAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function requestAnalysis(ai: GoogleGenAI, media: { contentBase64: string; mimeType: string }, exerciseName?: string) {
  return ai.models.generateContent({
    config: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema(),
    },
    contents: [
      {
        parts: [
          { text: buildPrompt(exerciseName) },
          { inlineData: { data: media.contentBase64, mimeType: media.mimeType } },
        ],
        role: 'user',
      },
    ],
    model: 'gemini-3-flash-preview',
  });
}

function parseAnalysis(response: { text?: string }): unknown {
  if (!response.text) throw new Error('empty analysis');
  return JSON.parse(response.text) as unknown;
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('provider timeout')), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error('provider failed'));
      },
    );
  });
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
