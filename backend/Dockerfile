FROM node:18-alpine

WORKDIR /app

# 创建应用目录并设置权限
RUN mkdir -p /app && chown -R node:node /app

# 首先复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 然后复制所有文件
COPY . .

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3000

# 使用node用户运行应用
USER node

# 启动命令
CMD ["node", "src/index.js"] 