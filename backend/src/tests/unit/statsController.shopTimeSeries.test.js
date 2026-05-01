const StatsController = require('../../controllers/StatsController');
const db = require('../../db');

jest.mock('../../db', () => ({
  query: jest.fn()
}));

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('StatsController.getShopOutputsByShopTimeSeries', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('按月返回店铺时间序列聚合数据', async () => {
    db.query.mockResolvedValue([
      {
        period: '2026-04',
        group_by: 'month',
        shop_id: 1,
        shop_name: '测试店铺A',
        category_id: 2,
        category_name: '测试类别',
        total_quantity: '120'
      },
      {
        period: '2026-05',
        group_by: 'month',
        shop_id: 1,
        shop_name: '测试店铺A',
        category_id: 2,
        category_name: '测试类别',
        total_quantity: 80
      }
    ]);

    const req = {
      query: {
        group_by: 'month',
        date_from: '2026-01-01',
        date_to: '2026-12-31',
        category_id: '2',
        courier_id: '3',
        shop_id: '1'
      }
    };
    const res = createResponse();

    await StatsController.getShopOutputsByShopTimeSeries(req, res);

    expect(db.query).toHaveBeenCalledTimes(1);
    const [sql, params] = db.query.mock.calls[0];
    expect(sql).toContain("DATE_FORMAT(so.output_date, '%Y-%m')");
    expect(sql).toContain('AND so.shop_id = ?');
    expect(sql).toContain('AND so.courier_id = ?');
    expect(sql).toContain('AND s.category_id = ?');
    expect(sql).toContain("so.operation_type != 'merge'");
    expect(params).toEqual(['1', '3', '2', '2026-01-01', '2026-12-31']);

    expect(res.json).toHaveBeenCalledWith({
      code: 0,
      message: '获取按店铺/时间统计数据成功',
      data: [
        {
          period: '2026-04',
          group_by: 'month',
          shop_id: 1,
          shop_name: '测试店铺A',
          category_id: 2,
          category_name: '测试类别',
          total_quantity: 120
        },
        {
          period: '2026-05',
          group_by: 'month',
          shop_id: 1,
          shop_name: '测试店铺A',
          category_id: 2,
          category_name: '测试类别',
          total_quantity: 80
        }
      ]
    });
  });

  test('拒绝不支持的时间粒度', async () => {
    const req = { query: { group_by: 'week' } };
    const res = createResponse();

    await StatsController.getShopOutputsByShopTimeSeries(req, res);

    expect(db.query).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: 400,
      message: 'group_by 只支持 day、month、year'
    });
  });
});
