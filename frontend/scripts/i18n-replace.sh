#!/bin/bash
# 用于查找所有 tsx 文件并运行 jscodeshift 进行替换
find ./app ./components ./lib -name "*.tsx" -type f | xargs npx jscodeshift -t ./scripts/replace-hardcoded-text.js --extensions=tsx --parser=tsx
