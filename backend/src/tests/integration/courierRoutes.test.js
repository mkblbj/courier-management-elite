const request = require('supertest');
const app = require('../../index');
const Courier = require('../../models/Courier');

jest.mock('../../models/Courier');

describe('快递类型API端点', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/couriers 应返回快递类型列表并支持筛选参数', async () => {
    const mockCouriers = [
      { id: 1, name: '测试快递', code: 'TEST', category_id: 2, is_active: true }
    ];

    Courier.getAll = jest.fn().mockResolvedValue(mockCouriers);

    const response = await request(app)
      .get('/api/couriers?status=active&sort=name&order=DESC&search=TEST&category_id=2')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data).toEqual(mockCouriers);
    expect(Courier.getAll).toHaveBeenCalledWith({
      is_active: true,
      sort_by: 'name',
      sort_order: 'DESC',
      search: 'TEST',
      category_id: 2
    });
  });

  test('GET /api/couriers/category/:categoryId 应返回指定类别的快递类型', async () => {
    const mockCouriers = [
      { id: 1, name: '类别快递A', code: 'A', category_id: 3 },
      { id: 2, name: '类别快递B', code: 'B', category_id: 3 }
    ];

    Courier.getByCategoryId = jest.fn().mockResolvedValue(mockCouriers);

    const response = await request(app)
      .get('/api/couriers/category/3')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data).toEqual(mockCouriers);
    expect(Courier.getByCategoryId).toHaveBeenCalledWith(3);
  });

  test('POST /api/couriers 应支持创建带类别的快递类型', async () => {
    const newType = {
      name: '新快递类型',
      code: 'NEW',
      category_id: 1
    };
    const mockCreatedType = {
      id: 6,
      ...newType,
      is_active: true,
      created_at: '2023-05-15T08:30:00Z'
    };

    Courier.getAll = jest.fn().mockResolvedValue([]);
    Courier.add = jest.fn().mockResolvedValue(6);
    Courier.getById = jest.fn().mockResolvedValue(mockCreatedType);

    const response = await request(app)
      .post('/api/couriers')
      .send(newType)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('添加成功');
    expect(response.body.data).toEqual(mockCreatedType);
    expect(Courier.add).toHaveBeenCalledWith(expect.objectContaining({
      name: '新快递类型',
      code: 'NEW',
      category_id: 1
    }));
  });

  test('DELETE /api/couriers/:id 应删除存在的快递类型', async () => {
    const mockCourier = { id: 1, name: '测试快递', category_id: 1 };

    Courier.getById = jest.fn().mockResolvedValue(mockCourier);
    Courier.delete = jest.fn().mockResolvedValue(true);

    const response = await request(app)
      .delete('/api/couriers/1')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('删除成功');
    expect(Courier.getById).toHaveBeenCalledWith(1);
    expect(Courier.delete).toHaveBeenCalledWith(1);
  });

  test('DELETE /api/couriers/:id 当快递类型不存在时应返回404', async () => {
    Courier.getById = jest.fn().mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/couriers/999')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.code).toBe(404);
    expect(response.body.message).toBe('快递类型不存在');
  });
});
