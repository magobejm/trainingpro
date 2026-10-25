import { Injectable } from '@nestjs/common';
import { Type } from '@google/genai';
import { z } from 'zod';
import { GeminiService } from '../../ai/gemini.service';

const AI_TIMEOUT_MS = 25_000;
const OFF_TIMEOUT_MS = 6_000;

export const aiEstimateSchema = z.object({
  carbsG: z.number().min(0).max(2000),
  confidence: z.number().min(0).max(1),
  dishes: z.array(z.string().max(120)).max(12),
  fatG: z.number().min(0).max(2000),
  kcal: z.number().min(0).max(10000),
  proteinG: z.number().min(0).max(2000),
});

export type AiMealEstimate = z.infer<typeof aiEstimateSchema>;

/** Macros per 100 g (or per portion when the product has no weight) ready to become a Food row. */
export type ProductNutrition = {
  barcode: string | null;
  caloriesKcal: number;
  carbsG: number;
  fatG: number;
  name: string;
  proteinG: number;
};

const labelSchema = z.object({
  caloriesKcal: z.number().min(0).max(1500),
  carbsG: z.number().min(0).max(100),
  fatG: z.number().min(0).max(100),
  name: z.string().min(1).max(120),
  proteinG: z.number().min(0).max(100),
});

@Injectable()
export class NutritionAiService {
  constructor(private readonly gemini: GeminiService) {}

  /** Never throws: a failing provider just means "no estimate". */
  async estimateMeal(buffer: Buffer, mimeType: string): Promise<AiMealEstimate | null> {
    if (!this.gemini.isConfigured()) return null;
    try {
      const raw = await this.gemini.generateJson({
        parts: [
          {
            text:
              'Eres un nutricionista. Observa la foto de esta comida y estima las calorías y macronutrientes ' +
              'TOTALES del plato completo tal como se ve. Lista los platos o alimentos identificados en español. ' +
              'Si la imagen no es comida devuelve todo a 0, dishes vacío y confidence 0. ' +
              'confidence es de 0 a 1.',
          },
          { inlineData: { data: buffer.toString('base64'), mimeType } },
        ],
        schema: {
          properties: {
            carbsG: { type: Type.NUMBER },
            confidence: { type: Type.NUMBER },
            dishes: { items: { type: Type.STRING }, type: Type.ARRAY },
            fatG: { type: Type.NUMBER },
            kcal: { type: Type.NUMBER },
            proteinG: { type: Type.NUMBER },
          },
          required: ['kcal', 'proteinG', 'carbsG', 'fatG', 'dishes', 'confidence'],
          type: Type.OBJECT,
        },
        timeoutMs: AI_TIMEOUT_MS,
      });
      const parsed = aiEstimateSchema.safeParse(raw);
      return parsed.success ? roundEstimate(parsed.data) : null;
    } catch {
      return null;
    }
  }

  /** Reads a nutrition label photo. Values are per 100 g. Returns null when it cannot be read. */
  async readLabel(buffer: Buffer, mimeType: string): Promise<ProductNutrition | null> {
    if (!this.gemini.isConfigured()) return null;
    try {
      const raw = await this.gemini.generateJson({
        parts: [
          {
            text:
              'Lee la etiqueta nutricional de este producto. Devuelve el nombre del producto (si no se ve, ' +
              'usa "Producto") y los valores por 100 g (o por 100 ml): calorías en kcal, proteínas, hidratos de carbono y grasas en gramos.',
          },
          { inlineData: { data: buffer.toString('base64'), mimeType } },
        ],
        schema: {
          properties: {
            caloriesKcal: { type: Type.NUMBER },
            carbsG: { type: Type.NUMBER },
            fatG: { type: Type.NUMBER },
            name: { type: Type.STRING },
            proteinG: { type: Type.NUMBER },
          },
          required: ['name', 'caloriesKcal', 'proteinG', 'carbsG', 'fatG'],
          type: Type.OBJECT,
        },
        timeoutMs: AI_TIMEOUT_MS,
      });
      const parsed = labelSchema.safeParse(raw);
      if (!parsed.success || parsed.data.caloriesKcal <= 0) return null;
      return { ...roundProduct(parsed.data), barcode: null };
    } catch {
      return null;
    }
  }

  /** Open Food Facts lookup. Returns null when the product is unknown or the service is unreachable. */
  async lookupBarcode(code: string): Promise<ProductNutrition | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), OFF_TIMEOUT_MS);
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,nutriments`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'TrainerPro/1.0 (support@trainerpro.app)' },
        signal: controller.signal,
      });
      if (!response.ok) return null;
      return parseOpenFoodFacts(code, (await response.json()) as unknown);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function parseOpenFoodFacts(code: string, payload: unknown): ProductNutrition | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as {
    product?: { brands?: string; nutriments?: Record<string, unknown>; product_name?: string };
    status?: number;
  };
  if (body.status !== 1 || !body.product) return null;
  const nutriments = body.product.nutriments ?? {};
  const kcal = numberOf(nutriments['energy-kcal_100g']) ?? kjToKcal(numberOf(nutriments['energy_100g']));
  const name = [body.product.product_name, body.product.brands?.split(',')[0]].filter(Boolean).join(' · ').trim();
  if (kcal === null || !name) return null;
  return {
    barcode: code,
    ...roundProduct({
      caloriesKcal: kcal,
      carbsG: numberOf(nutriments['carbohydrates_100g']) ?? 0,
      fatG: numberOf(nutriments['fat_100g']) ?? 0,
      name: name.slice(0, 120),
      proteinG: numberOf(nutriments['proteins_100g']) ?? 0,
    }),
  };
}

function numberOf(value: unknown): number | null {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function kjToKcal(kj: number | null): number | null {
  return kj === null ? null : kj / 4.184;
}

function roundEstimate(value: AiMealEstimate): AiMealEstimate {
  return {
    ...value,
    carbsG: Math.round(value.carbsG),
    fatG: Math.round(value.fatG),
    kcal: Math.round(value.kcal),
    proteinG: Math.round(value.proteinG),
  };
}

function roundProduct(value: Omit<ProductNutrition, 'barcode'>): Omit<ProductNutrition, 'barcode'> {
  return {
    caloriesKcal: Math.round(value.caloriesKcal),
    carbsG: Math.round(value.carbsG),
    fatG: Math.round(value.fatG),
    name: value.name,
    proteinG: Math.round(value.proteinG),
  };
}
