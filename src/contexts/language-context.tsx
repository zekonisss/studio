
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translationsMaster, type Locale } from '@/lib/translations-master';

interface LanguageContextType {
  locale: Locale;
  setLocale: Dispatch<SetStateAction<Locale>>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const supportedLocales: Locale[] = ['lt', 'en', 'ru', 'lv', 'et', 'pl'];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('lt');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const storedLocale = localStorage.getItem('drivercheck-locale') as Locale | null;
      if (storedLocale && supportedLocales.includes(storedLocale)) {
        setLocale(storedLocale);
      } else {
        const browserLang = navigator.language.split('-')[0] as Locale;
        if (supportedLocales.includes(browserLang)) {
          setLocale(browserLang);
        } else {
          setLocale('lt');
        }
      }
    }
  }, [isClient]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('drivercheck-locale', locale);
      document.documentElement.lang = locale;
    }
  }, [locale, isClient]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translationsForKey = translationsMaster[key];

    if (!translationsForKey) {
      return key; // Grąžiname raktą, jei vertimų išvis nėra
    }

    // Bandoma gauti vertimą pagal esamą lokalę, jei nepavyksta - pagal anglų, tada pirmą pasitaikiusį, galiausiai patį raktą.
    let translation = translationsForKey[locale] ?? translationsForKey['en'] ?? Object.values(translationsForKey).find(Boolean) ?? key;

    if (params) {
      Object.keys(params).forEach(paramKey => {
        const value = params[paramKey];
        if (value !== null && value !== undefined) {
          translation = (translation as string).replace(`{${paramKey}}`, String(value));
        }
      });
    }
    return translation as string;
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
