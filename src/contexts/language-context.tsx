
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ltTranslations from '@/locales/lt.json';
import enTranslations from '@/locales/en.json';
import ruTranslations from '@/locales/ru.json';
import lvTranslations from '@/locales/lv.json';
import etTranslations from '@/locales/et.json';
import plTranslations from '@/locales/pl.json';

type Locale = 'lt' | 'en' | 'ru' | 'lv' | 'et' | 'pl';

interface LanguageContextType {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Locale, Record<string, string>> = {
  lt: ltTranslations,
  en: enTranslations,
  ru: ruTranslations,
  lv: lvTranslations,
  et: etTranslations,
  pl: plTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('lt'); // Default to Lithuanian initially

  useEffect(() => {
    // This effect runs only once on the client-side
    const storedLocale = localStorage.getItem('drivercheck-locale') as Locale | null;
    if (storedLocale && translations.hasOwnProperty(storedLocale)) {
      setLocale(storedLocale);
    } else {
      // If no stored locale, detect from browser settings
      const browserLang = navigator.language.split('-')[0] as Locale;
      if (translations.hasOwnProperty(browserLang)) {
        setLocale(browserLang);
      } else {
        // Fallback to English if the browser language is not supported
        setLocale('en');
      }
    }
  }, []);

  useEffect(() => {
    // This effect runs whenever the locale changes, saving it to localStorage
    // and updating the document's lang attribute.
    localStorage.setItem('drivercheck-locale', locale);
    if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = translations[locale]?.[key] || translations['en']?.[key] || key; // Fallback to English, then key itself
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const value = params[paramKey];
        if (value !== null && value !== undefined) {
          translation = translation.replace(`{${paramKey}}`, String(value));
        }
      });
    }
    return translation;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
