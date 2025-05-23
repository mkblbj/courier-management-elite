# TinyMCE 富文本编辑器配置指南

## 概述

本项目使用 TinyMCE 作为富文本编辑器，用于通知模板的内容编辑。TinyMCE 提供了强大的富文本编辑功能，包括文字格式化、图片上传、表格编辑等。

## API 密钥配置

### 1. 获取 API 密钥

1. 访问 [TinyMCE Cloud](https://www.tiny.cloud/)
2. 注册账户（免费账户每月有 1000 次加载限制）
3. 在控制台中创建新的应用
4. 复制生成的 API 密钥

### 2. 配置环境变量

在项目根目录的 `.env.local` 文件中添加：

```bash
NEXT_PUBLIC_TINYMCE_API_KEY=your-actual-api-key-here
```

**注意：**

- 开发环境可以不配置 API 密钥，编辑器仍然可以正常工作，只是会显示警告信息
- 生产环境强烈建议配置 API 密钥以获得完整功能和去除警告

### 3. 环境变量说明

| 变量名                        | 类型   | 必填 | 说明                   |
| ----------------------------- | ------ | ---- | ---------------------- |
| `NEXT_PUBLIC_TINYMCE_API_KEY` | string | 否   | TinyMCE Cloud API 密钥 |

## 功能特性

### 已配置的插件

- **advlist**: 高级列表功能
- **autolink**: 自动链接识别
- **lists**: 列表编辑
- **link**: 链接插入和编辑
- **image**: 图片插入和编辑
- **charmap**: 特殊字符插入
- **anchor**: 锚点功能
- **searchreplace**: 查找替换
- **visualblocks**: 可视化块显示
- **code**: 源代码编辑
- **fullscreen**: 全屏编辑
- **insertdatetime**: 日期时间插入
- **media**: 媒体文件插入
- **table**: 表格编辑
- **preview**: 预览功能
- **help**: 帮助文档
- **wordcount**: 字数统计
- **emoticons**: 表情符号
- **template**: 模板功能
- **codesample**: 代码示例

### 工具栏配置

```
undo redo | blocks | bold italic forecolor backcolor |
alignleft aligncenter alignright alignjustify |
bullist numlist outdent indent | removeformat |
link image media | emoticons | code | help
```

### 预设模板

编辑器内置了三个预设模板：

1. **通知模板**: 基础通知模板
2. **促销模板**: 促销活动模板
3. **系统通知模板**: 系统维护通知模板

## 自定义配置

### 图片上传

当前配置支持图片的 base64 编码上传。如需要上传到服务器，可以修改 `images_upload_handler` 配置：

```typescript
images_upload_handler: async (blobInfo, success, failure) => {
  try {
    const formData = new FormData();
    formData.append("file", blobInfo.blob(), blobInfo.filename());

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    success(result.url);
  } catch (error) {
    failure("上传失败");
  }
};
```

### 样式自定义

编辑器的样式通过 `content_style` 配置，当前使用 Inter 字体和现代化的样式设计。

### 语言设置

编辑器已配置为中文界面：

```typescript
language: "zh_CN";
```

## 故障排除

### 常见问题

1. **编辑器显示 "This domain is not registered with TinyMCE Cloud" 警告**

   - 解决方案：配置正确的 API 密钥

2. **编辑器加载缓慢**

   - 原因：网络连接问题或 CDN 访问慢
   - 解决方案：考虑使用自托管版本

3. **图片上传失败**
   - 检查 `images_upload_handler` 配置
   - 确认服务器端上传接口正常

### 调试模式

在开发环境中，可以通过浏览器控制台查看 TinyMCE 的详细日志信息。

## 更新和维护

### 版本更新

当前使用的 TinyMCE React 版本：`@tinymce/tinymce-react@6.1.0`

更新命令：

```bash
pnpm update @tinymce/tinymce-react
```

### 配置备份

重要的配置更改应该记录在此文档中，确保团队成员了解最新的配置状态。

## 相关链接

- [TinyMCE 官方文档](https://www.tiny.cloud/docs/)
- [TinyMCE React 集成指南](https://www.tiny.cloud/docs/integrations/react/)
- [TinyMCE 插件文档](https://www.tiny.cloud/docs/plugins/)
- [TinyMCE API 参考](https://www.tiny.cloud/docs/api/)
