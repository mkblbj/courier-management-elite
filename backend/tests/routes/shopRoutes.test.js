const request = require('supertest');
const express = require('express');
const shopRoutes = require('../../src/routes/shopRoutes');
const bodyParser = require('body-parser');

// 创建测试用Express应用
const app = express();
app.use(bodyParser.json());
app.use('/api/shops', shopRoutes);

// Mock Shop控制器方法
jest.mock('../../src/controllers/ShopController', () => {
  return {
    ShopController: {
      getAll: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: [] })),
      getById: jest.fn((req, res) => res.status(200).json({ code: 0, message: '获取成功', data: { id: 1 } })),
      create: jest.fn((req, res) => res.status(201).json({ code: 0, message: '添加成功', data: { id: 1 } })),
      update: jest.fn((req, res) => res.status(200).json({ code: 0, message: '更新成功', data: { id: 1 } })),
      delete: jest.fn((req, res) => res.status(200).json({ code: 0, message: '删除成功' })),
      toggleStatus: jest.fn((req, res) => res.status(200).json({ code: 0, message: '店铺已启用', data: { id: 1, is_active: true } })),
      reorder: jest.fn((req, res) => res.status(200).json({ code: 0, message: '排序更新成功' }))
    },
    validateShop: (req, res, next) => next()
  };
});

describe('Shop Routes', () => {
  it('GET /api/shops 应返回店铺列表', async () => {
    const response = await request(app).get('/api/shops');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/shops/:id 应返回单个店铺', async () => {
    const response = await request(app).get('/api/shops/1');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data).toHaveProperty('id', 1);
  });

  it('POST /api/shops 应创建店铺', async () => {
    const shopData = { name: '测试店铺', is_active: true };
    const response = await request(app).post('/api/shops').send(shopData);
    expect(response.status).toBe(201);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('添加成功');
    expect(response.body.data).toHaveProperty('id');
  });

  it('PUT /api/shops/:id 应更新店铺', async () => {
    const shopData = { name: '更新的店铺名称' };
    const response = await request(app).put('/api/shops/1').send(shopData);
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('更新成功');
    expect(response.body.data).toHaveProperty('id');
  });

  it('DELETE /api/shops/:id 应删除店铺', async () => {
    const response = await request(app).delete('/api/shops/1');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('删除成功');
  });

  it('POST /api/shops/:id/toggle 应切换店铺状态', async () => {
    const response = await request(app).post('/api/shops/1/toggle');
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('店铺已启用');
    expect(response.body.data).toHaveProperty('is_active', true);
  });

  it('POST /api/shops/sort 应更新店铺排序', async () => {
    const sortData = [
      { id: 1, sort_order: 3 },
      { id: 2, sort_order: 1 },
      { id: 3, sort_order: 2 }
    ];
    const response = await request(app).post('/api/shops/sort').send(sortData);
    expect(response.status).toBe(200);
    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('排序更新成功');
  });
}); 