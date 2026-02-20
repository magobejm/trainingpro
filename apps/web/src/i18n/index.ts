import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import esCommon from './locales/es/common.json';

const resources = {
  en: { common: enCommon },
  es: { common: esCommon },
} as const;

void i18next.use(initReactI18next).init({
  resources,
  fallbackLng: 'es',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18next;
