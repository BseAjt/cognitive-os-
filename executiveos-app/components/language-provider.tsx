"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppLanguage = "fr" | "en";
type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; text: (french: string, english: string) => string };
const STORAGE_KEY = "cognitiveos-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("fr");
  useEffect(() => { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved === "fr" || saved === "en") setLanguageState(saved); }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  function setLanguage(next: AppLanguage) { setLanguageState(next); window.localStorage.setItem(STORAGE_KEY, next); }
  return <LanguageContext.Provider value={{ language, setLanguage, text: (fr, en) => language === "fr" ? fr : en }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage, text } = useLanguage();
  return <div role="group" aria-label={text("Choisir la langue", "Choose language")} className="flex shrink-0 rounded-xl border border-white/[.1] bg-white/[.04] p-1">
    {(["fr", "en"] as const).map((item) => <button key={item} type="button" onClick={() => setLanguage(item)} aria-pressed={language === item} className={`min-h-9 min-w-10 rounded-lg px-2 text-[11px] font-black uppercase tracking-[.08em] transition ${language === item ? "bg-white text-[#07111f] shadow-sm" : "text-[#91a2bd] hover:text-white"}`}>{item}</button>)}
  </div>;
}
