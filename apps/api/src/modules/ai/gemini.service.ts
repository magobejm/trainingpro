import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODEL = 'gemini-3-flash-preview';

export type GeminiPart = { inlineData: { data: string; mimeType: string } } | { text: string };

/** Thin wrapper over @google/genai shared by every feature that needs structured JSON from Gemini. */
@Injectable()
export class GeminiService {
  private readonly ai: GoogleGenAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  isConfigured(): boolean {
    return this.ai !== null;
  }

  /** Returns the parsed JSON, or throws when the provider is missing, times out or answers empty. */
  async generateJson(input: { parts: GeminiPart[]; schema: unknown; timeoutMs: number }): Promise<unknown> {
    const ai = this.ai;
    if (!ai) throw new Error('gemini not configured');
    const response = await withTimeout(
      ai.models.generateContent({
        config: {
          responseMimeType: 'application/json',
          responseSchema: input.schema as never,
        },
        contents: [{ parts: input.parts, role: 'user' }],
        model: GEMINI_MODEL,
      }),
      input.timeoutMs,
    );
    if (!response.text) throw new Error('empty analysis');
    return JSON.parse(response.text) as unknown;
  }
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
