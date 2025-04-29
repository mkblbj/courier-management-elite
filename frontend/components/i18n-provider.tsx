"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

// 该组件将i18n提供给整个应用
export function I18nProvider({ children }: { children: React.ReactNode }) {
  // 处理服务端渲染与客户端语言同步
  useEffect(() => {
    // 获取浏览器语言
    const getBrowserLanguage = () => {
      // 获取浏览器语言设置
      const browserLang = navigator.language || (navigator as any).userLanguage;
      // 检查是否支持该语言，截取主要语言代码 (如 zh-CN -> zh)
      const mainLang = browserLang.split('-')[0];
      
      // 获取支持的语言列表
      const supportedLangs = i18n.options.supportedLngs as string[] || ['zh-CN', 'en', 'ja'];
      
      // 检查完整语言代码是否在支持列表中
      if (supportedLangs.includes(browserLang)) {
        return browserLang;
      }
      
      // 检查语言主代码是否在支持列表中
      if (supportedLangs.some(lang => lang.startsWith(mainLang))) {
        // 返回第一个匹配的支持语言
        return supportedLangs.find(lang => lang.startsWith(mainLang)) || 'zh-CN';
      }
      
      // 如果都不匹配，返回默认语言
      return typeof i18n.options.fallbackLng === 'string' 
        ? i18n.options.fallbackLng 
        : 'zh-CN';
    };

    // 检查本地存储中是否已有保存的语言设置
    const savedLang = localStorage.getItem("i18nextLng");
    
    // 如果没有保存的语言，则使用浏览器默认语言
    if (!savedLang) {
      const browserLang = getBrowserLanguage();
      i18n.changeLanguage(browserLang);
      localStorage.setItem("i18nextLng", browserLang);
    } else if (i18n.language !== savedLang) {
      // 如果已有保存的语言但与当前i18n实例不同，则应用保存的语言
      i18n.changeLanguage(savedLang);
    }
    
    // 确保HTML的lang属性与当前语言一致
    document.documentElement.lang = i18n.language;
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
