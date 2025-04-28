"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";

// 该组件将i18n提供给整个应用
export function I18nProvider({ children }: { children: React.ReactNode }) {
  // 处理服务端渲染与客户端语言同步
  useEffect(() => {
    // 确保HTML的lang属性与当前语言一致
    const savedLang = localStorage.getItem("i18nextLng") || "zh-CN";
    if (document.documentElement.lang !== savedLang) {
      document.documentElement.lang = savedLang;
    }

    // 如果需要，加载保存的语言
    if (i18n.language !== savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
