const request = require('supertest');
const express = require('express');
const shopOutputRoutes = require('../../src/routes/shopOutputRoutes');
const bodyParser = require('body-parser');

// 创建测试用Express应用
const app = express();
app.use(bodyParser.json());
app.use('/api/shop-outputs', shopOutputRoutes);

// Mock ShopOutput控制器方法
jest.mock('../../src/controllers/ShopOutputController', () => {
  return {
    ShopOutputController: {
      getAll: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: [] })),
      getById: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: { id: 1 } })),
      create: jest.fn((req, res) => res.status(201).json({ code: 0, message: '添加成功', data: { id: 1 } })),
      update: jest.fn((req, res) => res.status(200).json({ code: 0, message: '更新成功', data: { id: 1 } })),
      delete: jest.fn((req, res) => res.status(200).json({ code: 0, message: '删除成功' })),
      getRecent: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: [] })),
      getToday: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: [] }))
    },
    validateShopOutput: (req, res, next) => next()
  };
});

describe('ShopOutput Routes', () => {
  it('GET /api/shop-outputs 应返回出力数据列表', async () => {
    const response = await request(app).get('/api/shop-outputs');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/shop-outputs/recent 应返回最近录入数据', async () => {
    const response = await request(app).get('/api/shop-outputs/recent');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/shop-outputs/today 应返回今日出力数据', async () => {
    const response = await request(app).get('/api/shop-outputs/today');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/shop-outputs/:id 应返回单条出力记录', async () => {
    const response = await request(app).get('/api/shop-outputs/1');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data).toHaveProperty('id', 1);
  });

  it('POST /api/shop-outputs 应创建出力记录', async () => {
    const outputData = { 
      shop_id: 1, 
      courier_id: 1, 
      output_date: '2023-05-01',
      quantity: 100 
    };
    const response = await request(app).post('/api/shop-outputs').send(outputData);
    expect(response.status).toBe(201);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('添加成功');
    expect(response.body.data).toHaveProperty('id');
  });

  it('PUT /api/shop-outputs/:id 应更新出力记录', async () => {
    const outputData = { quantity: 200 };
    const response = await request(app).put('/api/shop-outputs/1').send(outputData);
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('更新成功');
    expect(response.body.data).toHaveProperty('id');
  });

  it('DELETE /api/shop-outputs/:id 应删除出力记录', async () => {
    const response = await request(app).delete('/api/shop-outputs/1');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('删除成功');
  });
}); 