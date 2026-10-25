"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "bn" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (bn: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "bn",
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (bn) => bn,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("bn");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("ehrj_language") as Language | null;
      if (savedLang === "bn" || savedLang === "en") {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
      }
    } catch {
      // localStorage fallback
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("ehrj_language", lang);
      document.cookie = `ehrj_language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "bn" ? "en" : "bn");
  };

  const t = (bn: string, en: string) => {
    if (!mounted) return bn;
    return language === "en" ? en : bn;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
