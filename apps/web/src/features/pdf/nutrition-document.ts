import type { NutritionMeal } from '../../screens/coach/nutrition/nutrition.types';
import type { PdfSection } from './pdf-model';
import type { PdfTranslate } from './plan-document';

export type NutritionDocumentPlan = {
  name: string;
  type: 'LIBRE' | 'ESTRUCTURADO';
  content: unknown;
  setupData?: unknown;
  description?: string | null;
};
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => (value && typeof value === 'object' ? (value as RecordValue) : {});
const array = (value: unknown): RecordValue[] => (Array.isArray(value) ? value.map(record) : []);

export function nutritionPdfSections(plan: NutritionDocumentPlan, meals: NutritionMeal[], t: PdfTranslate): PdfSection[] {
  const sections: PdfSection[] = [];
  if (plan.description) sections.push({ paragraphs: [plan.description] });
  const setup = record(plan.setupData);
  const macroKeys = ['tdee', 'targetCalories', 'proteinG', 'carbsG', 'fatG'];
  const macros = macroKeys.filter((key) => typeof setup[key] === 'number');
  if (macros.length)
    sections.push({
      heading: t('web.pdf.targets'),
      table: {
        columns: [t('web.pdf.variable'), t('web.pdf.value')],
        rows: macros.map((key) => [t(`web.pdf.${key}`), `${setup[key]} ${key.endsWith('G') ? 'g' : 'kcal'}`]),
      },
    });
  const content = record(plan.content);
  if (plan.type === 'LIBRE') {
    for (const [category, items] of Object.entries(record(content.columns))) {
      sections.push({ heading: t(`coach.nutrition.categories.${category}`) });
      for (const item of array(items)) sections.push(...itemSections(item, meals, t));
    }
  } else {
    for (const week of array(content.weeks)) {
      sections.push({ heading: String(week.label ?? '') });
      for (const day of array(week.days)) {
        sections.push({ heading: String(day.label ?? '') });
        for (const item of array(day.meals ?? day.days)) sections.push(...itemSections(item, meals, t));
      }
    }
  }
  return sections;
}

function itemSections(item: RecordValue, meals: NutritionMeal[], t: PdfTranslate): PdfSection[] {
  const name = String(item.name ?? item.mealName ?? item.foodName ?? '—');
  const paragraphs: string[] = [];
  if (item.time) paragraphs.push(String(item.time));
  if (typeof item.amountGrams === 'number') paragraphs.push(`${item.amountGrams} g`);
  if (item.type === 'food') return [{ heading: name, paragraphs }];
  const meal = meals.find((entry) => entry.id === item.mealId);
  if (!meal) return [{ heading: name, paragraphs: [...paragraphs, t('web.pdf.unavailable')] }];
  if (meal.notes) paragraphs.push(meal.notes);
  const section: PdfSection = {
    heading: name,
    paragraphs,
    table: {
      columns: [t('web.pdf.food'), t('web.pdf.amount')],
      rows: [...meal.ingredients]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((ingredient) => [ingredient.food.name, `${ingredient.amountGrams} g`]),
    },
  };
  return [section];
}
