const request = require('supertest');
const app = require('../../index');
const ShopOutput = require('../../models/ShopOutput');
const Shop = require('../../models/Shop');
const Courier = require('../../models/Courier');

// 模拟模型
jest.mock('../../models/ShopOutput');
jest.mock('../../models/Shop');
jest.mock('../../models/Courier');

describe('出力数据API端点', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockShop = { id: 1, name: '测试店铺', category_id: 1 };
  const mockCourier = { id: 1, name: '测试快递', code: 'TEST' };

  // 测试创建出力记录（新增操作）
  test('POST /api/shop-outputs 应创建新增出力记录', async () => {
    const newOutput = {
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 100,
      notes: '测试新增'
    };

    const mockCreatedOutput = {
      id: 1,
      ...newOutput,
      operation_type: 'add',
      shop_name: '测试店铺',
      courier_name: '测试快递',
      created_at: '2024-12-19T10:00:00Z'
    };

    Shop.getById = jest.fn().mockResolvedValue(mockShop);
    Courier.getById = jest.fn().mockResolvedValue(mockCourier);
    ShopOutput.add = jest.fn().mockResolvedValue(1);
    ShopOutput.getById = jest.fn().mockResolvedValue(mockCreatedOutput);

    const response = await request(app)
      .post('/api/shop-outputs')
      .send(newOutput)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('添加成功');
    expect(response.body.data).toEqual(mockCreatedOutput);
    expect(ShopOutput.add).toHaveBeenCalledWith(expect.objectContaining({
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 100,
      operation_type: 'add'
    }));
  });

  // 测试减少操作
  test('POST /api/shop-outputs/subtract 应创建减少记录', async () => {
    const subtractData = {
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 30,
      notes: '测试减少'
    };

    const mockNetStats = {
      net_growth: 100,
      add_total: 100,
      subtract_total: 0,
      merge_total: 0
    };

    const mockCreatedRecord = {
      id: 2,
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: -30,
      operation_type: 'subtract',
      original_quantity: 100,
      shop_name: '测试店铺',
      courier_name: '测试快递',
      created_at: '2024-12-19T10:30:00Z'
    };

    Shop.getById = jest.fn().mockResolvedValue(mockShop);
    Courier.getById = jest.fn().mockResolvedValue(mockCourier);
    ShopOutput.getNetGrowthStats = jest.fn().mockResolvedValue(mockNetStats);
    ShopOutput.add = jest.fn().mockResolvedValue(2);
    ShopOutput.getById = jest.fn().mockResolvedValue(mockCreatedRecord);

    const response = await request(app)
      .post('/api/shop-outputs/subtract')
      .send(subtractData)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('减少操作成功');
    expect(response.body.data.record).toEqual(mockCreatedRecord);
    expect(response.body.data.original_quantity).toBe(100);
    expect(response.body.data.subtract_quantity).toBe(30);
    expect(response.body.data.remaining_quantity).toBe(70);

    expect(ShopOutput.getNetGrowthStats).toHaveBeenCalledWith({
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19'
    });

    expect(ShopOutput.add).toHaveBeenCalledWith(expect.objectContaining({
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: -30,
      operation_type: 'subtract',
      original_quantity: 100
    }));
  });

  // 测试减少数量超过库存的情况
  test('POST /api/shop-outputs/subtract 当减少数量超过库存时应返回错误', async () => {
    const subtractData = {
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 150,
      notes: '测试减少超量'
    };

    const mockNetStats = {
      net_growth: 100,
      add_total: 100,
      subtract_total: 0,
      merge_total: 0
    };

    Shop.getById = jest.fn().mockResolvedValue(mockShop);
    Courier.getById = jest.fn().mockResolvedValue(mockCourier);
    ShopOutput.getNetGrowthStats = jest.fn().mockResolvedValue(mockNetStats);

    const response = await request(app)
      .post('/api/shop-outputs/subtract')
      .send(subtractData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe('减少数量(150)超过当前库存(100)');
  });

  // 测试合单操作
  test('POST /api/shop-outputs/merge 应创建合单记录', async () => {
    const mergeData = {
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 50,
      merge_note: '合并两个订单',
      notes: '测试合单'
    };

    const mockCreatedRecord = {
      id: 3,
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 50,
      operation_type: 'merge',
      merge_note: '合并两个订单',
      shop_name: '测试店铺',
      courier_name: '测试快递',
      created_at: '2024-12-19T11:00:00Z'
    };

    Shop.getById = jest.fn().mockResolvedValue(mockShop);
    Courier.getById = jest.fn().mockResolvedValue(mockCourier);
    ShopOutput.add = jest.fn().mockResolvedValue(3);
    ShopOutput.getById = jest.fn().mockResolvedValue(mockCreatedRecord);

    const response = await request(app)
      .post('/api/shop-outputs/merge')
      .send(mergeData)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('合单操作成功');
    expect(response.body.data).toEqual(mockCreatedRecord);

    expect(ShopOutput.add).toHaveBeenCalledWith(expect.objectContaining({
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 50,
      operation_type: 'merge',
      merge_note: '合并两个订单'
    }));
  });

  // 测试根据操作类型获取数据
  test('GET /api/shop-outputs/operation/:operationType 应返回指定操作类型的数据', async () => {
    const mockOutputs = [
      {
        id: 1,
        shop_id: 1,
        courier_id: 1,
        output_date: '2024-12-19',
        quantity: 100,
        operation_type: 'add',
        shop_name: '测试店铺',
        courier_name: '测试快递'
      },
      {
        id: 2,
        shop_id: 1,
        courier_id: 1,
        output_date: '2024-12-19',
        quantity: 80,
        operation_type: 'add',
        shop_name: '测试店铺',
        courier_name: '测试快递'
      }
    ];

    ShopOutput.getByOperationType = jest.fn().mockResolvedValue(mockOutputs);

    const response = await request(app)
      .get('/api/shop-outputs/operation/add')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data).toEqual(mockOutputs);
    expect(ShopOutput.getByOperationType).toHaveBeenCalledWith('add', expect.any(Object));
  });

  // 测试无效操作类型
  test('GET /api/shop-outputs/operation/:operationType 对无效操作类型应返回错误', async () => {
    const response = await request(app)
      .get('/api/shop-outputs/operation/invalid')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe('无效的操作类型，支持的类型: add, subtract, merge');
  });

  // 测试获取操作统计
  test('GET /api/shop-outputs/stats/operations 应返回操作统计数据', async () => {
    const mockTypeStats = [
      {
        operation_type: 'add',
        record_count: 5,
        total_quantity: 500,
        avg_quantity: 100
      },
      {
        operation_type: 'subtract',
        record_count: 2,
        total_quantity: -60,
        avg_quantity: -30
      },
      {
        operation_type: 'merge',
        record_count: 1,
        total_quantity: 50,
        avg_quantity: 50
      }
    ];

    const mockNetStats = {
      add_total: 500,
      subtract_total: 60,
      merge_total: 50,
      net_growth: 490,
      add_count: 5,
      subtract_count: 2,
      merge_count: 1,
      total_operations: 8
    };

    ShopOutput.getStatsByOperationType = jest.fn().mockResolvedValue(mockTypeStats);
    ShopOutput.getNetGrowthStats = jest.fn().mockResolvedValue(mockNetStats);

    const response = await request(app)
      .get('/api/shop-outputs/stats/operations')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.message).toBe('获取成功');
    expect(response.body.data.by_type).toEqual(mockTypeStats);
    expect(response.body.data.net_growth).toEqual(mockNetStats);
  });

  // 测试验证错误
  test('POST /api/shop-outputs/subtract 缺少必填字段应返回验证错误', async () => {
    const invalidData = {
      shop_id: 1,
      courier_id: 1,
      // 缺少 output_date 和 quantity
    };

    const response = await request(app)
      .post('/api/shop-outputs/subtract')
      .send(invalidData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe('请求数据验证失败');
    expect(response.body.errors).toBeDefined();
  });

  // 测试合单操作缺少备注
  test('POST /api/shop-outputs/merge 缺少合单备注应返回验证错误', async () => {
    const invalidMergeData = {
      shop_id: 1,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 50,
      // 缺少 merge_note
    };

    const response = await request(app)
      .post('/api/shop-outputs/merge')
      .send(invalidMergeData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe('请求数据验证失败');
    expect(response.body.errors).toBeDefined();
  });

  // 测试店铺不存在的情况
  test('POST /api/shop-outputs/subtract 店铺不存在应返回错误', async () => {
    const subtractData = {
      shop_id: 999,
      courier_id: 1,
      output_date: '2024-12-19',
      quantity: 30
    };

    Shop.getById = jest.fn().mockResolvedValue(null);
    Courier.getById = jest.fn().mockResolvedValue(mockCourier);

    const response = await request(app)
      .post('/api/shop-outputs/subtract')
      .send(subtractData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe('店铺不存在');
  });

  // 测试快递类型不存在的情况
  test('POST /api/shop-outputs/merge 快递类型不存在应返回错误', async () => {
    const mergeData = {
      shop_id: 1,
      courier_id: 999,
      output_date: '2024-12-19',
      quantity: 50,
      merge_note: '测试合单'
    };

    Shop.getById = jest.fn().mockResolvedValue(mockShop);
    Courier.getById = jest.fn().mockResolvedValue(null);

    const response = await request(app)
      .post('/api/shop-outputs/merge')
      .send(mergeData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe('快递类型不存在');
  });
}); 