FROM node:18-alpine AS builder

WORKDIR /app

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 检查构建结果
RUN ls -la .next || echo ".next directory not found"
RUN ls -la .next/standalone || echo "standalone directory not found"

# 生产环境阶段
FROM node:18-alpine AS runner
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制构建结果
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "server.js"] 