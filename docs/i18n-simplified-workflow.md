# 国际化工作流程简化指南

本文档介绍如何通过脚本和配置优化，简化国际化(i18n)工作流程，避免重复进入 Docker 容器操作。

## 脚本简化

我们创建了一个简化脚本`i18n.sh`，允许你直接在宿主机上执行国际化相关命令，而无需每次都进入 Docker 容器。

### 使用方法

```bash
# 基本用法
./i18n.sh [命令]

# 执行完整国际化流程
./i18n.sh all

# 仅执行文本提取
./i18n.sh extract

# 运行国际化演示
./i18n.sh demo
```

### 支持的命令

| 命令    | 描述                      | 对应 Docker 容器内命令 |
| ------- | ------------------------- | ---------------------- |
| all     | 执行完整国际化流程        | pnpm i18n:all          |
| extract | 仅提取需要翻译的文本      | pnpm i18n:extract      |
| replace | 将硬编码文本替换为 t 函数 | pnpm i18n:replace      |
| process | 处理翻译文件，统一格式    | pnpm i18n:process      |
| demo    | 运行国际化演示流程        | pnpm i18n:demo         |

## 相对路径配置

我们更新了国际化配置文件，使用相对路径代替绝对路径，使工作流程更加灵活。

### 主要修改

1. **i18next-parser.config.js**：

```javascript
// 修改前
const projectRoot = process.cwd();
output: path.join(projectRoot, 'public/locales/$LOCALE/$NAMESPACE.json'),

// 修改后
const localesPath = './public/locales';
output: path.join(localesPath, '$LOCALE/$NAMESPACE.json'),
```

2. **extract-translations.js**：
   - 保留了`projectRoot`以确保脚本正常运行
   - 通过相对路径引用确保在不同环境下一致性

## 工作流程比较

### 修改前的工作流

```bash
# 1. 进入Docker容器
docker exec -it courier-frontend bash

# 2. 进入应用目录
cd /app

# 3. 执行国际化命令
pnpm i18n:all
```

### 修改后的工作流

```bash
# 直接在项目根目录执行
./i18n.sh all
```

## 自定义脚本

如果需要自定义国际化脚本，可以编辑`i18n.sh`文件：

```bash
#!/bin/bash
# 国际化处理简化脚本
# 用法: ./i18n.sh [命令]

# 设置工作目录为脚本所在目录
cd "$(dirname "$0")"

# 检查参数
if [ $# -lt 1 ]; then
  echo "用法: ./i18n.sh [命令]"
  echo "可用命令: all, extract, replace, process, demo"
  exit 1
fi

COMMAND=$1

# 根据命令执行对应的操作
case $COMMAND in
  all)
    echo "执行完整国际化流程..."
    docker exec -it courier-frontend sh -c "cd /app && pnpm i18n:all"
    ;;
  # ... 其他命令
esac
```

## 注意事项

1. 确保脚本具有执行权限：

   ```bash
   chmod +x i18n.sh
   ```

2. 脚本要求 Docker 容器正在运行：

   ```bash
   docker-compose up -d
   ```

3. 如果容器名称发生变化，请相应更新脚本中的容器名：
   ```bash
   # 修改此行
   docker exec -it courier-frontend sh -c "cd /app && pnpm i18n:all"
   ```

## 相关文档

- [国际化使用指南](./i18n-usage-guide.md)
- [国际化自动化流程](./i18n-automation.md)
