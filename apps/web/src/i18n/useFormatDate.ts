import { useTranslation } from 'react-i18next';
import { formatDate } from '@trainerpro/shared';

export function useFormatDate(): (value: Date | string | null | undefined) => string {
  const { i18n } = useTranslation();
  return (value) => formatDate(value, i18n.language);
}
