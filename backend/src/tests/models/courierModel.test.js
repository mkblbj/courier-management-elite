const Courier = require('../../models/Courier');
const db = require('../../db');

// 模拟数据库连接
jest.mock('../../db');

describe('Courier 模型 - 母子类型关系', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getParentTypes 应该返回所有母类型', async () => {
    const mockParentTypes = [
      { id: 1, name: '母类型1', parent_id: null },
      { id: 2, name: '母类型2', parent_id: null },
    ];

    db.query.mockResolvedValue(mockParentTypes);

    const result = await Courier.getParentTypes();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE'),
      expect.any(Array)
    );
    expect(result).toEqual(mockParentTypes);
  });

  test('getChildren 应该返回指定母类型的所有子类型', async () => {
    const mockChildren = [
      { id: 3, name: '子类型1', parent_id: 1 },
      { id: 4, name: '子类型2', parent_id: 1 },
    ];

    db.query.mockResolvedValue(mockChildren);

    const result = await Courier.getChildren(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE'),
      expect.any(Array)
    );
    expect(result).toEqual(mockChildren);
  });

  test('hasChildren 应该正确判断是否有子类型', async () => {
    // 模拟有子类型的情况
    db.query.mockResolvedValueOnce([
      { id: 3, name: '子类型1', parent_id: 1 }
    ]);
    
    const hasChildren = await Courier.hasChildren(1);
    expect(hasChildren).toBe(true);
    
    // 模拟没有子类型的情况
    db.query.mockResolvedValueOnce([]);
    
    const noChildren = await Courier.hasChildren(2);
    expect(noChildren).toBe(false);
  });

  test('getChildrenSum 应该计算子类型的数量总和', async () => {
    db.query.mockResolvedValue([{ total: 15 }]);

    const result = await Courier.getChildrenSum(1);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SUM(count)'),
      [1]
    );
    expect(result).toBe(15);
  });

  test('getTypeHierarchy 应该返回带有层级关系的数据', async () => {
    const mockParentTypes = [
      { id: 1, name: '母类型1', parent_id: null },
      { id: 2, name: '母类型2', parent_id: null },
    ];

    const mockChildren1 = [
      { id: 3, name: '子类型1', parent_id: 1 },
      { id: 4, name: '子类型2', parent_id: 1 },
    ];

    const mockChildren2 = [
      { id: 5, name: '子类型3', parent_id: 2 }
    ];

    // 使用spy替代mock
    const getParentTypesSpy = jest.spyOn(Courier, 'getParentTypes')
      .mockResolvedValue(mockParentTypes);
    
    const getChildrenSpy = jest.spyOn(Courier, 'getChildren')
      .mockResolvedValueOnce(mockChildren1)
      .mockResolvedValueOnce(mockChildren2);
    
    const getChildrenSumSpy = jest.spyOn(Courier, 'getChildrenSum')
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(5);

    const result = await Courier.getTypeHierarchy();

    expect(getParentTypesSpy).toHaveBeenCalled();
    expect(getChildrenSpy).toHaveBeenCalledTimes(2);
    expect(getChildrenSumSpy).toHaveBeenCalledTimes(2);
    
    expect(result).toHaveLength(2);
    expect(result[0].children).toEqual(mockChildren1);
    expect(result[0].totalCount).toBe(10);
    expect(result[1].children).toEqual(mockChildren2);
    expect(result[1].totalCount).toBe(5);
    
    // 清理spy
    getParentTypesSpy.mockRestore();
    getChildrenSpy.mockRestore();
    getChildrenSumSpy.mockRestore();
  });

  test('delete 应该在有子类型时抛出错误', async () => {
    // 模拟有子类型的情况
    db.query.mockResolvedValueOnce([
      { id: 3, name: '子类型1', parent_id: 1 }
    ]);

    await expect(Courier.delete(1)).rejects.toThrow('不能删除有子类型的母类型');
    
    // 验证delete查询没有被执行
    expect(db.query).not.toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM'),
      expect.any(Array)
    );
  });

  test('add 应该支持创建带有parent_id的子类型', async () => {
    db.query.mockResolvedValue({ insertId: 6 });

    const newCourier = {
      name: '新子类型',
      code: 'NEW',
      parent_id: 1
    };

    await Courier.add(newCourier);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO'),
      expect.arrayContaining([
        newCourier.name,
        newCourier.code,
        expect.any(Object), // remark
        expect.any(Number), // is_active
        expect.any(Number), // sort_order
        1 // parent_id
      ])
    );
  });
}); 