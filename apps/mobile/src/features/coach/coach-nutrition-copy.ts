import { useTranslation } from 'react-i18next';

export type NutritionCopyKey = string;

export function useNutritionCopy() {
  const { t } = useTranslation();
  return (key: NutritionCopyKey) => t(`coach.nutrition.${key}`);
}
