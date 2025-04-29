#!/bin/bash
# 国际化处理简化脚本
# 用法: ./i18n.sh [命令]
# 例如: ./i18n.sh all, ./i18n.sh extract, ./i18n.sh demo

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
  extract)
    echo "执行文本提取..."
    docker exec -it courier-frontend sh -c "cd /app && pnpm i18n:extract"
    ;;
  replace)
    echo "执行代码替换..."
    docker exec -it courier-frontend sh -c "cd /app && pnpm i18n:replace"
    ;;
  process)
    echo "执行翻译处理..."
    docker exec -it courier-frontend sh -c "cd /app && pnpm i18n:process"
    ;;
  demo)
    echo "运行国际化演示..."
    docker exec -it courier-frontend sh -c "cd /app && pnpm i18n:demo"
    ;;
  *)
    echo "未知命令: $COMMAND"
    echo "可用命令: all, extract, replace, process, demo"
    exit 1
    ;;
esac

echo "完成!" 