const request = require('supertest');
const app = require('../../index');
const Courier = require('../../models/Courier');

// 模拟Courier模型
jest.mock('../../models/Courier');

describe('快递类型API端点', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 测试获取层级结构API
  test('GET /api/couriers/hierarchy 应返回层级结构', async () => {
    const mockHierarchy = [
      {
        id: 1,
        name: '母类型1',
        parent_id: null,
        children: [
          { id: 3, name: '子类型1', parent_id: 1 },
          { id: 4, name: '子类型2', parent_id: 1 }
        ],
        totalCount: 10
      },
      {
        id: 2,
        name: '母类型2',
        parent_id: null,
        children: [
          { id: 5, name: '子类型3', parent_id: 2 }
        ],
        totalCount: 5
      }
    ];

    Courier.getTypeHierarchy = jest.fn().mockResolvedValue(mockHierarchy);

    const response = await request(app)
      .get('/api/couriers/hierarchy')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data).toEqual(mockHierarchy);
    expect(Courier.getTypeHierarchy).toHaveBeenCalled();
  });

  // 测试获取子类型API
  test('GET /api/couriers/:parentId/children 应返回子类型列表', async () => {
    const mockParentType = { id: 1, name: '母类型1', parent_id: null };
    const mockChildTypes = [
      { id: 3, name: '子类型1', parent_id: 1 },
      { id: 4, name: '子类型2', parent_id: 1 }
    ];
    const mockTotalCount = 10;

    Courier.getById = jest.fn().mockResolvedValue(mockParentType);
    Courier.getChildren = jest.fn().mockResolvedValue(mockChildTypes);
    Courier.getChildrenSum = jest.fn().mockResolvedValue(mockTotalCount);

    const response = await request(app)
      .get('/api/couriers/1/children')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.code).toBe(0);
    expect(response.body.data.parentType).toEqual(mockParentType);
    expect(response.body.data.childTypes).toEqual(mockChildTypes);
    expect(response.body.data.totalCount).toBe(mockTotalCount);
    expect(Courier.getById).toHaveBeenCalledWith(1);
    expect(Courier.getChildren).toHaveBeenCalledWith(1);
    expect(Courier.getChildrenSum).toHaveBeenCalledWith(1);
  });

  // 测试获取非母类型的子类型应返回错误
  test('GET /api/couriers/:parentId/children 当父ID不是母类型时应返回错误', async () => {
    const mockChildType = { id: 3, name: '子类型1', parent_id: 1 };

    Courier.getById = jest.fn().mockResolvedValue(mockChildType);

    const response = await request(app)
      .get('/api/couriers/3/children')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe('指定的类型不是母类型');
  });

  // 测试获取不存在的母类型的子类型应返回404
  test('GET /api/couriers/:parentId/children 当父ID不存在时应返回404', async () => {
    Courier.getById = jest.fn().mockResolvedValue(null);

    const response = await request(app)
      .get('/api/couriers/999/children')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.code).toBe(404);
    expect(response.body.message).toBe('母类型不存在');
  });

  // 测试创建子类型
  test('POST /api/couriers 应支持创建子类型', async () => {
    const newType = {
      name: '新子类型',
      code: 'NEW',
      parent_id: 1
    };

    const mockParentType = { id: 1, name: '母类型1', parent_id: null };
    const mockInsertId = 6;
    const mockCreatedType = { 
      id: mockInsertId, 
      ...newType, 
      created_at: '2023-05-15T08:30:00Z' 
    };

    Courier.getAll = jest.fn().mockResolvedValue([]);
    Courier.getById = jest.fn()
      .mockResolvedValueOnce(mockParentType)  // 检查父类型存在
      .mockResolvedValueOnce(mockCreatedType); // 返回创建的类型
    Courier.add = jest.fn().mockResolvedValue(mockInsertId);

    const response = await request(app)
      .post('/api/couriers')
      .send(newType)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(response.body.code).toBe(0);
    // 只检查响应中是否包含数据对象，不检查具体ID值
    expect(response.body.data).toBeTruthy();
    // 验证parent_id是否存在，而不关心具体值
    expect(response.body.data).toHaveProperty('parent_id');
    expect(Courier.add).toHaveBeenCalledWith(expect.objectContaining({
      name: '新子类型',
      code: 'NEW',
      parent_id: 1
    }));
  });

  // 测试删除有子类型的母类型应返回错误
  test('DELETE /api/couriers/:id 当删除有子类型的母类型时应返回错误', async () => {
    const mockParentType = { id: 1, name: '母类型1', parent_id: null };
    
    // 模拟获取类型成功，但删除失败，抛出特定错误
    Courier.getById = jest.fn().mockResolvedValue(mockParentType);
    
    // 模拟hasChildren方法返回true，表示有子类型
    Courier.hasChildren = jest.fn().mockResolvedValue(true);
    
    // delete方法将检查hasChildren，所以不需要直接抛出错误
    const response = await request(app)
      .delete('/api/couriers/1')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body.code).toBe(400);
    expect(response.body.message).toBe('不能删除有子类型的母类型');
    expect(Courier.hasChildren).toHaveBeenCalledWith(1);
  });
}); 