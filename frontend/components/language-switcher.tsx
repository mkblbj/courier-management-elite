"use client";

import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useCallback, useEffect } from "react";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation("common");

  // 检测并保存语言选择
  useEffect(() => {
    const savedLang = localStorage.getItem("i18nextLng");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  // 切换语言
  const changeLanguage = useCallback(
    (value: string) => {
      i18n.changeLanguage(value);
      localStorage.setItem("i18nextLng", value);
      // 更新HTML标签的lang属性
      document.documentElement.lang = value;
    },
    [i18n]
  );

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4" />
      <Select
        onValueChange={changeLanguage}
        defaultValue={i18n.language || "zh-CN"}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder={t("language")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zh-CN">{t("chinese")}</SelectItem>
          <SelectItem value="en">{t("english")}</SelectItem>
          <SelectItem value="ja">{t("japanese")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
