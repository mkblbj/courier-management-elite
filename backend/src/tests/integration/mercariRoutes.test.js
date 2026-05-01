const request = require('supertest');
const app = require('../../index');
const Shop = require('../../models/Shop');

jest.mock('../../models/Shop');

describe('Mercari 工具API (Mock)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/mercari/shops-overview 应返回Mock概览列表', async () => {
    Shop.getAll = jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Mercari测试店铺',
        category_name: 'メルカリ',
        mercari_access_token: null,
        is_active: true
      }
    ]);

    const res = await request(app)
      .get('/api/mercari/shops-overview')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data.shops)).toBe(true);
    expect(res.body.data.shops[0]).toHaveProperty('shopId');
    expect(res.body.data.shops[0]).toHaveProperty('shopName');
    expect(res.body.data.shops[0]).toHaveProperty('pendingCount');
    expect(Shop.getAll).toHaveBeenCalledWith({ is_active: true });
  });
});

