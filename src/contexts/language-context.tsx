
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
  const [locale, setLocale] = useState<Locale>('lt'); // Default to Lithuanian

  useEffect(() => {
    const storedLocale = localStorage.getItem('drivercheck-locale') as Locale | null;
    if (storedLocale && translations.hasOwnProperty(storedLocale)) {
      setLocale(storedLocale);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('drivercheck-locale', locale);
    if (typeof document !== 'undefined') {
        document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = translations[locale]?.[key] || translations['en']?.[key] || key; // Fallback to English, then key itself
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
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
