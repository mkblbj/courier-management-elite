
import { useTranslation } from "react-i18next";
// 测试组件 - 包含硬编码的中文文本
import React from 'react';

export default function TestComponent() {
  const {
    t: t
  } = useTranslation();

  return (
    (<div className="test-container">
      <h1>{t("测试标题")}</h1>
      <p>{t("这是一个测试段落，用于演示国际化提取功能。")}</p>
      <button type="button" onClick={() => alert(t("你点击了按钮"))}>{t("点击我")}</button>
      <div title={t("这是一个提示文本")}>
        <span>{t("带属性的元素")}</span>
      </div>
      <input placeholder={t("请输入内容")} />
    </div>)
  );
}
