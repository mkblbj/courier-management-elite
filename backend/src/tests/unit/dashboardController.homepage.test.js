const mockGetByDate = jest.fn();

jest.mock('../../models/ShopOutput', () => ({
  getAggregatedOutputsByDate: jest.fn()
}));

jest.mock('../../models/Shop', () => ({
  getAll: jest.fn()
}));

jest.mock('../../models/Courier', () => ({
  getAll: jest.fn()
}));

jest.mock('../../models/ShippingRecord', () => ({
  instance: {
    getByDate: mockGetByDate
  }
}));

const ShopOutput = require('../../models/ShopOutput');
const Shop = require('../../models/Shop');
const DashboardController = require('../../controllers/DashboardController');

function createResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('DashboardController.getHomepageStats', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-13T00:00:00.000Z'));
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await DashboardController.clearCache({}, createResponse());
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('返回昨日出力总量以及与今日一致的店铺快递明细', async () => {
    Shop.getAll.mockResolvedValue([
      {
        id: 1,
        name: '测试店铺',
        category_id: 2,
        category_name: '测试类别'
      }
    ]);
    ShopOutput.getAggregatedOutputsByDate.mockImplementation(async date => {
      if (date === '2026-07-12') {
        return [{
          shop_id: 1,
          shop_name: '测试店铺',
          courier_id: 2,
          courier_name: '测试快递',
          quantity: 12
        }];
      }

      return [];
    });
    mockGetByDate.mockResolvedValue([]);

    const res = createResponse();
    await DashboardController.getHomepageStats({}, res);

    const body = res.json.mock.calls[0][0];
    expect(ShopOutput.getAggregatedOutputsByDate.mock.calls.map(([date]) => date))
      .toEqual(['2026-07-12', '2026-07-13', '2026-07-14']);
    expect(body.yesterday_output_quantity).toBe(12);
    expect(body.yesterday_output).toMatchObject({
      date: '2026-07-12',
      total_quantity: 12,
      shops_count: 1,
      active_shops_count: 1,
      shops: [{
        shop_id: 1,
        shop_name: '测试店铺',
        total_quantity: 12,
        couriers: [{
          courier_id: 2,
          courier_name: '测试快递',
          quantity: 12
        }]
      }]
    });
  });

  test('查询失败时返回昨日日期对应的空出力结构', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    Shop.getAll.mockRejectedValue(new Error('数据库不可用'));
    ShopOutput.getAggregatedOutputsByDate.mockResolvedValue([]);
    mockGetByDate.mockResolvedValue([]);

    const res = createResponse();
    await DashboardController.getHomepageStats({}, res);

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(500);
    expect(body.yesterday_output_quantity).toBe(0);
    expect(body.yesterday_output).toEqual({
      date: '2026-07-12',
      total_quantity: 0,
      shops_count: 0,
      active_shops_count: 0,
      shops: []
    });

    consoleError.mockRestore();
  });
});
