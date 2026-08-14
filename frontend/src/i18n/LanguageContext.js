import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  translations,
  categoryNamesAr,
  categoryCopyAr,
  serviceTypesAr,
  format,
} from './translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('tyre-lang') || 'en');

  useEffect(() => {
    localStorage.setItem('tyre-lang', lang);
    document.documentElement.lang = lang === 'ar' ? 'ar' : 'en';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('is-arabic', lang === 'ar');
  }, [lang]);

  const value = useMemo(() => {
    const t = (key, vars) => {
      const text = translations[lang]?.[key] || translations.en[key] || key;
      return vars ? format(text, vars) : text;
    };

    const categoryName = (name = '') => (lang === 'ar' ? categoryNamesAr[name] || name : name);
    const categoryDescription = (name = '', fallback = '') =>
      lang === 'ar' ? categoryCopyAr[name] || fallback : fallback;
    const serviceName = (name = '') => (lang === 'ar' ? serviceTypesAr[name] || name : name);
    const toggleLang = () => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));

    return { lang, setLang, toggleLang, t, categoryName, categoryDescription, serviceName, isAr: lang === 'ar' };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
