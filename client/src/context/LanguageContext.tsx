import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types/index.js';

// Pre-load default English dictionary to guarantee synchronous fallback in both SSR, JSDom tests, and offline
import enData from '../../../locales/en.json';

interface RegionalData {
  marqueeStores?: string[];
  statSaving?: string;
  heroTrust?: string;
  step1Shops?: string;
  faqStores?: string;
  chipBudgetEmoji?: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, fallback?: string) => string;
  regional: RegionalData;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('mise-site-lang');
      if (saved && ['en', 'de', 'fr', 'nl'].includes(saved)) {
        return saved as Language;
      }
      const nav = navigator.language.slice(0, 2);
      if (['en', 'de', 'fr', 'nl'].includes(nav)) return nav as Language;
    }
    return 'en';
  });

  const [copy, setCopy] = useState<Record<string, any>>(enData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (language === 'en') {
      setCopy(enData);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    if (typeof window !== 'undefined' && window.location) {
      fetch(`/locales/${language}.json`)
        .then((res) => {
          if (!res.ok) throw new Error(`Locale ${language} failed to load`);
          return res.json();
        })
        .then((data) => {
          if (isMounted) {
            setCopy(data);
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setCopy(enData);
            setIsLoading(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('mise-site-lang', lang);
    }
  };

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  };

  const interpolate = (text: string, regionalData?: RegionalData): string => {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return (regionalData as any)?.[key] ?? '';
    });
  };

  const t = (path: string, fallback?: string): string => {
    const raw = getNestedValue(copy, path);
    if (raw == null) {
      const enRaw = getNestedValue(enData, path);
      if (enRaw != null) return interpolate(enRaw, (enData as any).regional);
      return fallback || path;
    }
    return interpolate(raw, copy.regional);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        regional: copy.regional || (enData as any).regional || {},
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
