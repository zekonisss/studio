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

  // Sync state with cookies and localStorage
  useEffect(() => {
    if (isClient) {
      // 1. Check cookies (set by middleware or previous session)
      const cookieLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1] as Locale | undefined;

      // 2. Check localStorage (legacy or user override)
      const storedLocale = localStorage.getItem('drivercheck-locale') as Locale | null;

      if (cookieLocale && supportedLocales.includes(cookieLocale)) {
        setLocale(cookieLocale);
      } else if (storedLocale && supportedLocales.includes(storedLocale)) {
        setLocale(storedLocale);
      } else {
        // 3. Fallback to browser detection (handled by middleware usually, but safeguard here)
        const browserLang = navigator.language.split('-')[0] as Locale;
        if (supportedLocales.includes(browserLang)) {
          setLocale(browserLang);
        } else {
          setLocale('lt');
        }
      }
    }
  }, [isClient]);

  // Update persistence layers when locale changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('drivercheck-locale', locale);
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      document.documentElement.lang = locale;
    }
  }, [locale, isClient]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translationsForKey = translationsMaster[key];

    if (!translationsForKey) {
      return key;
    }

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
