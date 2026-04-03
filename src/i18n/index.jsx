import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import ja from './ja.js';
import en from './en.js';
import ko from './ko.js';

export const LANGUAGES = [
  { code: 'ja', label: 'JA' },
  { code: 'en', label: 'EN' },
  { code: 'ko', label: 'KO' },
];

const dictionaries = { ja, en, ko };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('kirei-lang') || 'ja'; }
    catch { return 'ja'; }
  });

  const setLang = useCallback((code) => {
    setLangState(code);
    try { localStorage.setItem('kirei-lang', code); } catch { /* */ }
  }, []);

  // t(key) — 辞書キーで翻訳を引く
  // t(key, { foo: "bar" }) — プレースホルダ置換
  // t({ ja: "...", en: "...", ko: "..." }) — インラインオブジェクトから言語を引く
  const t = useCallback((key, params) => {
    // インライン多言語オブジェクト
    if (key && typeof key === 'object') {
      return key[lang] || key.ja || Object.values(key)[0] || '';
    }
    // 辞書キー引き
    const dict = dictionaries[lang] || dictionaries.ja;
    let str = dict[key] ?? dictionaries.ja[key] ?? key;
    // プレースホルダ置換: {name} → params.name
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      }
    }
    return str;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useT must be used within LanguageProvider');
  return ctx;
}
