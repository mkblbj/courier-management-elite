const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../../src/routes/dashboardRoutes');
const bodyParser = require('body-parser');

// 创建测试用Express应用
const app = express();
app.use(bodyParser.json());
app.use('/api/dashboard', dashboardRoutes);

// Mock Dashboard控制器方法
jest.mock('../../src/controllers/DashboardController', () => {
  return {
    getTodayShopOutputs: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: {} })),
    getTomorrowShopOutputs: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: {} }))
  };
});

describe('Dashboard Routes', () => {
  it('GET /api/dashboard/shop-outputs/today 应返回今日出力概览', async () => {
    const response = await request(app).get('/api/dashboard/shop-outputs/today');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data).toBeDefined();
  });

  it('GET /api/dashboard/shop-outputs/tomorrow 应返回明日出力预测', async () => {
    const response = await request(app).get('/api/dashboard/shop-outputs/tomorrow');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data).toBeDefined();
  });
}); 