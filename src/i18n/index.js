import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import es from "./es.json";

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  // Detecta el idioma del dispositivo (ej: 'es-US' -> 'es')
  lng: Localization.getLocales()[0].languageCode,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
