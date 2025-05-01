const request = require('supertest');
const app = require('../../index');

// 模拟模型
jest.mock('../../models/ShippingRecord', () => ({
  getShippingRecordsWithHierarchy: jest.fn(),
  getByTypeId: jest.fn(),
  getByTypeIds: jest.fn()
}));

jest.mock('../../models/Courier', () => ({
  getById: jest.fn(),
  getChildren: jest.fn()
}));

// 导入模拟的模块
const ShippingRecord = require('../../models/ShippingRecord');
const Courier = require('../../models/Courier');

describe('发货记录API端点', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 测试获取发货记录列表（支持层级和汇总）
  test('GET /api/shipping/hierarchy应返回带层级数据的发货记录列表', async () => {
    // 模拟数据
    const mockParent = { id: 1, name: '母类型', parent_id: null };
    const mockChildren = [{ id: 3, name: '子类型', parent_id: 1 }];
    const mockParentRecords = [
      { id: 1, courier_id: 1, tracking_number: '123456', date: '2023-05-15' }
    ];
    const mockChildrenRecords = [
      { id: 2, courier_id: 3, tracking_number: '789012', date: '2023-05-16' }
    ];

    const mockResult = [
      {
        ...mockParent,
        children: mockChildren,
        shipping: {
          own: mockParentRecords,
          children: mockChildrenRecords,
          total: [...mockParentRecords, ...mockChildrenRecords]
        }
      }
    ];

    // 设置模拟函数的返回值
    ShippingRecord.getShippingRecordsWithHierarchy.mockResolvedValue(mockResult);

    // 发送请求并检查响应
    const response = await request(app)
      .get('/api/shipping/hierarchy?includeHierarchy=true')
      .expect('Content-Type', /json/)
      .expect(200);

    // 验证响应结果
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(mockResult);
    
    // 验证函数调用
    expect(ShippingRecord.getShippingRecordsWithHierarchy).toHaveBeenCalledWith({
      includeHierarchy: true
    });
  });

  // 测试获取母类型发货统计
  test('GET /api/shipping/stats/parent/:id应返回母类型统计数据', async () => {
    // 模拟数据
    const parentId = 1;
    const mockParent = { id: 1, name: '母类型', parent_id: null };
    const mockChildren = [{ id: 3, name: '子类型', parent_id: 1 }];
    const mockParentRecords = [
      { id: 1, courier_id: 1, tracking_number: '123456', date: '2023-05-15' }
    ];
    const mockChildrenRecords = [
      { id: 2, courier_id: 3, tracking_number: '789012', date: '2023-05-16' }
    ];

    // 设置模拟函数的返回值
    Courier.getById.mockResolvedValue(mockParent);
    Courier.getChildren.mockResolvedValue(mockChildren);
    ShippingRecord.getByTypeId.mockResolvedValue(mockParentRecords);
    ShippingRecord.getByTypeIds.mockResolvedValue(mockChildrenRecords);

    // 发送请求并检查响应
    const response = await request(app)
      .get(`/api/shipping/stats/parent/${parentId}`)
      .expect('Content-Type', /json/)
      .expect(200);

    // 验证响应结果
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      courierType: mockParent,
      children: mockChildren,
      shipping: {
        own: mockParentRecords,
        children: mockChildrenRecords,
        total: [...mockParentRecords, ...mockChildrenRecords]
      }
    });
    
    // 验证函数调用
    expect(Courier.getById).toHaveBeenCalledWith(parentId.toString());
    expect(Courier.getChildren).toHaveBeenCalledWith(parentId.toString());
    expect(ShippingRecord.getByTypeId).toHaveBeenCalledWith(parentId.toString(), expect.any(Object));
    expect(ShippingRecord.getByTypeIds).toHaveBeenCalledWith(
      mockChildren.map(child => child.id),
      expect.any(Object)
    );
  });

  // 测试查询非母类型的错误处理
  test('查询非母类型的统计数据应返回400错误', async () => {
    const childId = 3;
    const mockChild = { id: 3, name: '子类型', parent_id: 1 };

    // 设置模拟函数的返回值
    Courier.getById.mockResolvedValue(mockChild);

    // 发送请求并检查响应
    const response = await request(app)
      .get(`/api/shipping/stats/parent/${childId}`)
      .expect('Content-Type', /json/)
      .expect(400);

    // 验证响应结果
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('只能查询母类型的统计数据');
    
    // 验证函数调用
    expect(Courier.getById).toHaveBeenCalledWith(childId.toString());
  });

  // 测试查询不存在的类型
  test('查询不存在的类型应返回404错误', async () => {
    const nonExistentId = 999;

    // 设置模拟函数的返回值
    Courier.getById.mockResolvedValue(null);

    // 发送请求并检查响应
    const response = await request(app)
      .get(`/api/shipping/stats/parent/${nonExistentId}`)
      .expect('Content-Type', /json/)
      .expect(404);

    // 验证响应结果
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('快递类型不存在');
    
    // 验证函数调用
    expect(Courier.getById).toHaveBeenCalledWith(nonExistentId.toString());
  });
}); 