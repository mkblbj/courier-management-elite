const request = require('supertest');
const app = require('../../index');

describe('Mercari 工具API (Mock)', () => {
  test('GET /api/mercari/shops-overview 应返回Mock概览列表', async () => {
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
  });
});


