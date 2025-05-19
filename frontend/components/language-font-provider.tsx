"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * 语言字体提供器
 * 根据当前语言设置适当的字体
 */
export function LanguageFontProvider({ children }: { children: React.ReactNode }) {
      const { i18n } = useTranslation();

      useEffect(() => {
            // 监听语言变化
            const updateFontClass = () => {
                  const currentLang = i18n.language;
                  const rootElement = document.documentElement;

                  // 移除所有可能的字体类
                  rootElement.classList.remove('font-sans');
                  rootElement.classList.remove('font-japanese');

                  // 根据语言添加相应的字体类
                  if (currentLang === 'ja') {
                        rootElement.classList.add('font-japanese');
                  } else {
                        rootElement.classList.add('font-sans');
                  }
            };

            // 初始设置和语言变化时更新
            updateFontClass();

            // 监听语言变化
            const handleLanguageChanged = () => {
                  updateFontClass();
            };

            i18n.on('languageChanged', handleLanguageChanged);

            return () => {
                  i18n.off('languageChanged', handleLanguageChanged);
            };
      }, [i18n]);

      return <>{children}</>;
} 