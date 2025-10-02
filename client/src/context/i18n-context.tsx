
'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import enTranslations from '../../public/locales/en.json';
import jaTranslations from '../../public/locales/ja.json';

type Language = 'en' | 'ja';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: any) => string;
  loading: boolean;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper function to get cookie on the client side
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};


export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ja');
  const [loading, setLoading] = useState(true);

  const translations = {
    en: enTranslations,
    ja: jaTranslations,
  }

  const handleSetLanguage = (newLang: Language) => {
    document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000`; // 1 year
    setLanguage(newLang);
  };

  useEffect(() => {
    const savedLang = getCookie('NEXT_LOCALE') as Language;
    if (savedLang && ['en', 'ja'].includes(savedLang)) {
      setLanguage(savedLang);
    } else {
      setLanguage('ja');
    }
    setLoading(false);
  }, []);
  
  const t = useCallback((key: string, options?: any): string => {
      const langTranslations = translations[language] || translations.ja;
      let translation = key.split('.').reduce((obj: any, k: string) => obj && obj[k], langTranslations);

      if (typeof translation !== 'string') {
        return key; // Return the key itself as a fallback
      }

      if (options) {
        Object.keys(options).forEach(optKey => {
          const regex = new RegExp(`{{${optKey}}}`, 'g');
          translation = (translation as string).replace(regex, options[optKey]);
        });
      }

      return translation;
    }, [language, translations]
  );
  
  const value = { language, setLanguage: handleSetLanguage, t, loading };

  return <I18nContext.Provider value={value}>{!loading && children}</I18nContext.Provider>;
}
