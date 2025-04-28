import { createInstance } from 'i18next';
import { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// 创建i18next实例
const i18n = createInstance();

const initOptions: InitOptions = {
  // 默认语言
  fallbackLng: 'zh-CN',
  // 支持的语言
  supportedLngs: ['zh-CN', 'en', 'ja'],
  // 命名空间
  ns: ['common', 'courier', 'shipping'],
  defaultNS: 'common',
  // 不转义HTML标签
  interpolation: {
    escapeValue: false,
  },
  // Next.js下建议关闭Suspense
  react: {
    useSuspense: false,
  },
  // 语言检测选项
  detection: {
    order: ['cookie', 'localStorage', 'navigator'],
    caches: ['cookie', 'localStorage'],
  },
};

i18n
  // 语言检测
  .use(LanguageDetector)
  // 将翻译资源转换为后端
  .use(resourcesToBackend((language: string, namespace: string) => 
    import(`../public/locales/${language}/${namespace}.json`)
  ))
  // 初始化react-i18next
  .use(initReactI18next)
  .init(initOptions);

export default i18n; 