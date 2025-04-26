import { useState, useEffect, useCallback } from 'react';
import { languages, Language, TranslationKeys, defaultLanguage, languageNames } from '@/lib/i18n';

// 从localStorage加载语言设置或使用默认语言
const loadSavedLanguage = (): Language => {
  if (typeof window === 'undefined') return defaultLanguage;
  const savedLanguage = localStorage.getItem('i18n-language') as Language;
  return savedLanguage && Object.keys(languages).includes(savedLanguage) 
    ? savedLanguage 
    : defaultLanguage;
};

// 创建一个全局事件来同步不同组件之间的语言变化
export const languageChangeEvent = typeof window !== 'undefined' 
  ? new CustomEvent('languageChange') 
  : null;

export const useI18n = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);

  // 初始化时从localStorage加载语言设置
  useEffect(() => {
    const savedLanguage = loadSavedLanguage();
    setCurrentLanguage(savedLanguage);
  }, []);

  // 监听语言变化事件
  useEffect(() => {
    const handleLanguageChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.language) {
        setCurrentLanguage(detail.language);
      }
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange);
    };
  }, []);

  // 更换语言的方法
  const changeLanguage = useCallback((language: Language) => {
    if (Object.keys(languages).includes(language)) {
      localStorage.setItem('i18n-language', language);
      setCurrentLanguage(language);
      
      // 触发语言变化事件，以便其他组件可以响应
      if (window && window.dispatchEvent && languageChangeEvent) {
        window.dispatchEvent(new CustomEvent('languageChange', { 
          detail: { language } 
        }));
      }
    }
  }, []);

  // 翻译函数
  const translate = useCallback((key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let translation: any = languages[currentLanguage];
    
    // 遍历获取嵌套的翻译值
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // 如果找不到翻译，返回原始key
      }
    }
    
    // 如果翻译包含参数，替换它们
    if (params && typeof translation === 'string') {
      return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
        return acc.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      }, translation);
    }
    
    return translation;
  }, [currentLanguage]);

  return {
    currentLanguage,
    languageNames,
    changeLanguage,
    t: translate,
  };
};

export default useI18n; 