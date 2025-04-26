require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const db = require('./db');
const { initializeDatabase } = require('./db/initialize');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 数据库初始化和启动服务器
async function startServer() {
  try {
    // 初始化数据库 - 如果数据库不存在则创建，并执行表结构迁移
    await initializeDatabase();
    
    // 测试数据库连接
    await db.connect();
    console.log('数据库连接成功');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
      console.log(`API根路径: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

// API路由
app.use('/api', apiRoutes);

// 处理404错误
app.use((req, res, next) => {
  const error = new Error('接口不存在');
  error.status = 404;
  next(error);
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
startServer();

// 处理未捕获的异常
process.on('uncaughtException', err => {
  console.error('未捕获的异常:', err);
  process.exit(1);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
});

module.exports = app; 