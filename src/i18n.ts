import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// console.log('Initializing i18next...'); // Basic log to confirm file execution

i18n
  .use(HttpApi) // Load translations using http (default public/locales/{{lng}}/{{ns}}.json)
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    supportedLngs: ['pt', 'en', 'es', 'zh', 'ja'],
    fallbackLng: 'pt', // Default language if detection fails
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'], // Order of language detection
      caches: ['localStorage'], // Cache found language in localStorage
      lookupLocalStorage: 'i18nextLng', // localStorage key
      // TODO: Add logic for 'profile' (custom detector for user preference)
      // This will require integrating with how user profiles are stored and accessed.
      // Example: order: ['profileDetector', 'localStorage', 'navigator', 'htmlTag'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Path to translation files
    },
    react: {
      useSuspense: false, // Set to true if using React Suspense; Next.js might require true with App Router
    },
    // interpolation: {
    //   escapeValue: false, // React already safes from xss
    // },
    // debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
  });

// Example of a custom language detector for user profile (to be implemented later)
// const profileDetector = {
//   name: 'profileDetector',
//   lookup(options) {
//     // This function would need to access user profile data, potentially asynchronously.
//     // For example, if user data is in a global state or context:
//     // const user = getUserContextData(); // Hypothetical function
//     // return user?.preferredLanguage;
//     // Or if it needs to be fetched:
//     // This is more complex as LanguageDetector lookup is synchronous.
//     // A common pattern is to load user preferences early in app lifecycle
//     // and then have i18next re-initialize or changeLanguage.
//     return null; // Placeholder for now
//   },
//   cacheUserLanguage(lng, options) {
//     // This function would save the language preference to the user's profile.
//     // For example, by calling an API or updating local state that syncs.
//     // setUserProfileLanguage(lng); // Hypothetical function
//   },
// };

// if (typeof window !== 'undefined') { // Ensure LanguageDetector is only used client-side
//   LanguageDetector.addDetector(profileDetector);
// }


export default i18n;
