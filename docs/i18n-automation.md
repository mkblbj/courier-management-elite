# 国际化自动化流程

本文档介绍如何使用自动化工具提取项目中的硬编码文本，并将其转换为使用 i18next 的国际化格式。

## 技术栈

本项目使用以下技术进行国际化：

- Next.js
- react-i18next
- i18next
- i18next-parser (用于提取文本)
- jscodeshift (用于代码转换)

## 自动化流程

### 1. 文本提取流程

文本提取过程通过`i18next-parser`完成，将扫描所有指定的文件，识别需要翻译的文本，并将这些文本提取到语言包 JSON 文件中。

```bash
# 在Docker容器内执行
pnpm i18n:extract

# 或使用简化脚本在宿主机执行
./i18n.sh extract
```

此命令会：

- 扫描`app/**/*.{js,jsx,ts,tsx}`和`components/**/*.{js,jsx,ts,tsx}`目录下的所有文件
- 提取所有包含在`t('...')`函数中的文本
- 将这些文本按命名空间组织，存储到`public/locales/{语言}/`目录下的 JSON 文件中

### 2. 代码转换流程

使用 jscodeshift 可以将硬编码的文本自动转换为`t('...')`函数调用：

```bash
# 在Docker容器内执行
pnpm i18n:replace

# 或使用简化脚本在宿主机执行
./i18n.sh replace
```

此命令会：

- 查找 JSX 中的中文文本
- 将这些文本替换为`t('文本')`格式
- 自动添加必要的`useTranslation`导入
- 在组件中添加`const { t } = useTranslation()`

### 3. 全流程执行

执行完整流程：

```bash
# 在Docker容器内执行
pnpm i18n:all

# 或使用简化脚本在宿主机执行
./i18n.sh all
```

此命令会按顺序执行提取和替换步骤。

## 文件结构

国际化相关文件组织如下：

```
frontend/
├── lib/
│   └── i18n.ts          # i18n配置文件
├── public/
│   └── locales/         # 语言文件目录
│       ├── zh-CN/       # 中文语言包
│       ├── en/          # 英文语言包
│       └── ja/          # 日文语言包
├── scripts/
│   ├── replace-hardcoded-text.js  # 代码转换脚本
│   └── extract-translations.js    # 辅助提取脚本
└── i18next-parser.config.js      # i18next解析器配置
```

## 最佳实践

1. **组织文本到命名空间**：

   - common.json: 通用文本，如按钮文字、提示信息等
   - courier.json: 特定于快递相关的文本
   - shipping.json: 特定于物流相关的文本

2. **开发工作流**：

   - 初始开发时使用中文
   - 开发完成后运行提取脚本（`./i18n.sh all`）
   - 代码审查时检查国际化使用情况

3. **代码中使用 i18next**：

   ```javascript
   // 从单一命名空间引入
   const { t } = useTranslation("common");

   // 从多个命名空间引入
   const { t } = useTranslation(["common", "courier"]);
   // 使用时指定命名空间
   t("courier:courier_type");
   ```

## 注意事项

1. 自动转换工具可能无法处理所有情况，特别是：

   - 动态生成的文本
   - 模板字符串中的文本
   - 复杂的 JSX 结构

2. 在这些情况下，可能需要手动调整生成的代码。

3. 确保定期运行提取脚本，以捕获新增的翻译内容。

## 简化工作流

为了避免频繁进入 Docker 容器操作，我们提供了简化脚本`i18n.sh`，允许在宿主机直接执行国际化命令。

详细说明请参阅[国际化工作流程简化指南](./i18n-simplified-workflow.md)。

## 配置修改

最近对国际化配置进行了更新，使用相对路径代替绝对路径，这样在不同环境下运行更加灵活：

```javascript
// 修改前
const projectRoot = process.cwd();
output: path.join(projectRoot, 'public/locales/$LOCALE/$NAMESPACE.json'),

// 修改后
const localesPath = './public/locales';
output: path.join(localesPath, '$LOCALE/$NAMESPACE.json'),
```

## 扩展阅读

- [react-i18next 文档](https://react.i18next.com/)
- [i18next-parser 文档](https://github.com/i18next/i18next-parser)
- [jscodeshift 文档](https://github.com/facebook/jscodeshift)
