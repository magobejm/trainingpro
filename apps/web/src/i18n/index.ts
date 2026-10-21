import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';
import { progressDashboardEn, progressDashboardEs } from '../screens/coach/progress/dashboard.locale';

const resources = {
  en: { common: { ...enCommon, progressDashboard: progressDashboardEn } },
  es: { common: { ...esCommon, progressDashboard: progressDashboardEs } },
} as const;

const UI_LANGUAGE = 'es';

function applyDocumentLanguage(lng: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng;
  document.documentElement.setAttribute('translate', 'no');
}

void i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: UI_LANGUAGE,
    fallbackLng: UI_LANGUAGE,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  })
  .then(() => applyDocumentLanguage(UI_LANGUAGE));

export default i18next;
