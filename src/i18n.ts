import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations directly
import translationEN from '../public/locales/en/translation.json';
import translationES from '../public/locales/es/translation.json';
import translationJA from '../public/locales/ja/translation.json';
import translationPT from '../public/locales/pt/translation.json';
import translationZH from '../public/locales/zh/translation.json';


const resources = {
  en: {
    translation: translationEN,
  },
  es: {
    translation: translationES,
  },
  ja: {
    translation: translationJA,
  },
  pt: {
    translation: translationPT,
  },
  zh: {
    translation: translationZH,
  },
};


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['pt', 'en', 'es', 'zh', 'ja'],
    fallbackLng: 'pt',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false,
    },
    // Set to true to see logs in the console
    debug: false, 
  });

export default i18n;
