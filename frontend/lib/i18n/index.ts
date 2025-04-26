import { en } from './en';
import { zh } from './zh';
import { ja } from './ja';

export type Language = 'zh-CN' | 'en-US' | 'ja-JP';

export const languages = {
  'zh-CN': zh,
  'en-US': en,
  'ja-JP': ja,
};

export type TranslationKeys = keyof typeof zh;

export const languageNames = {
  'zh-CN': '简体中文',
  'en-US': 'English',
  'ja-JP': '日本語',
};

export const defaultLanguage: Language = 'zh-CN'; 