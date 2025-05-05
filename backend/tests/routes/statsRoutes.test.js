const request = require('supertest');
const express = require('express');
const statsRoutes = require('../../src/routes/statsRoutes');
const bodyParser = require('body-parser');

// 创建测试用Express应用
const app = express();
app.use(bodyParser.json());
app.use('/api/stats', statsRoutes);

// Mock Stats控制器方法
jest.mock('../../src/controllers/StatsController', () => {
  return {
    getShopOutputsByShop: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: [] })),
    getShopOutputsByCourier: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: [] })),
    getShopOutputsByDate: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: [] })),
    getShopOutputsTotal: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: {} }))
  };
});

describe('Stats Routes', () => {
  it('GET /api/stats/shop-outputs/shops 应返回按店铺统计', async () => {
    const response = await request(app).get('/api/stats/shop-outputs/shops');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/stats/shop-outputs/couriers 应返回按快递类型统计', async () => {
    const response = await request(app).get('/api/stats/shop-outputs/couriers');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/stats/shop-outputs/dates 应返回按日期统计', async () => {
    const response = await request(app).get('/api/stats/shop-outputs/dates');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/stats/shop-outputs/total 应返回总计数据', async () => {
    const response = await request(app).get('/api/stats/shop-outputs/total');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data).toBeDefined();
  });
}); 