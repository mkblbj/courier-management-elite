# 国际化使用指南

本指南帮助你理解如何在日常开发中使用项目的国际化自动化工具。

## 快速上手

1. 运行演示流程，了解整个国际化过程：

```bash
# 在Docker容器内执行
pnpm i18n:demo

# 或使用简化脚本在宿主机执行
./i18n.sh demo
```

这将创建一个测试组件，并展示如何提取和转换硬编码文本。

2. 处理实际项目中的文本：

```bash
# 在Docker容器内执行
pnpm i18n:all

# 或使用简化脚本在宿主机执行
./i18n.sh all
```

此命令将执行完整的国际化流程，包括提取文本、转换代码和组织语言文件。

## 命令详解

项目提供以下国际化相关命令：

| 命令                | 说明                      | 简化脚本            |
| ------------------- | ------------------------- | ------------------- |
| `pnpm i18n:extract` | 提取代码中的文本到语言包  | `./i18n.sh extract` |
| `pnpm i18n:replace` | 将硬编码中文替换为 t 函数 | `./i18n.sh replace` |
| `pnpm i18n:process` | 处理提取结果，统一语言包  | `./i18n.sh process` |
| `pnpm i18n:all`     | 执行完整的国际化流程      | `./i18n.sh all`     |
| `pnpm i18n:demo`    | 运行演示流程              | `./i18n.sh demo`    |

## 开发工作流

在开发过程中，推荐以下工作流：

1. **新功能开发**：

   - 在开发阶段，可以先使用中文进行界面设计
   - 完成功能后，运行 `./i18n.sh all` 提取和转换文本

2. **添加新文本**：

   - 推荐直接使用 `t('你的文本')` 的形式
   - 定期运行 `./i18n.sh extract` 更新语言包

3. **管理翻译**：
   - 语言包位于 `public/locales/` 目录下
   - 手动编辑语言包进行翻译调整

## 在代码中使用

以下是在代码中使用 i18next 的典型模式：

```tsx
// 引入翻译钩子
import { useTranslation } from "react-i18next";

export default function YourComponent() {
  // 使用翻译函数
  const { t } = useTranslation("common");
  // 使用多个命名空间
  // const { t } = useTranslation(['common', 'courier']);

  return (
    <div>
      {/* 基本用法 */}
      <h1>{t("你好")}</h1>

      {/* 带变量的文本 */}
      <p>{t("欢迎, {{name}}", { name: "用户" })}</p>

      {/* 使用不同命名空间 */}
      <p>{t("courier:courier_type")}</p>
    </div>
  );
}
```

## 命名空间规范

项目使用以下命名空间划分：

- **common.json**: 通用文本，如按钮、标题等
- **courier.json**: 与快递相关的专有文本
- **shipping.json**: 与物流相关的专有文本

添加新文本时，请考虑其用途，放置到合适的命名空间下。

## 常见问题

1. **替换不完全**：自动替换可能无法处理所有情况，特别是模板字符串和嵌套文本。这些情况需要手动调整。

2. **命名空间选择**：如果不确定使用哪个命名空间，可以放在 common 中，后续根据需要调整。

3. **语言切换**：项目已配置自动检测和保存用户语言偏好，存储在 localStorage 中。

4. **新增语言**：如需添加新语言，请修改`i18next-parser.config.js`的`locales`数组，并运行完整流程生成相应的语言文件。

## 工作流程简化

为简化国际化工作流程，我们提供了脚本`i18n.sh`，允许直接在宿主机执行国际化命令，无需进入 Docker 容器。详细信息请参阅[国际化工作流程简化指南](./i18n-simplified-workflow.md)。

## 更多资源

详细的国际化自动化流程请参考 [i18n-automation.md](./i18n-automation.md)。

相关技术文档：

- [react-i18next 文档](https://react.i18next.com/)
- [i18next 文档](https://www.i18next.com/)
