
'use client';
import { useContext } from 'react';
import { I18nContext } from '@/context/i18n-context';

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  // This function is redefined to ensure it always returns a string,
  // preventing crashes when a translation key is not found.
  const t = (key: string, options?: any): string => {
    let translation = context.t(key, options);
    // Fallback to the key if the translation is missing, which is the behavior of the original t function.
    // The key is to ensure the return is always a string.
    return typeof translation === 'string' ? translation : key;
  };

  return { ...context, t };
};
