const db = require('../../db');
const ShippingTrackingNumber = require('../../models/ShippingTrackingNumber');

jest.mock('../../db', () => ({
  query: jest.fn()
}));

describe('ShippingTrackingNumber model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('add inserts a scan record and returns the inserted row', async () => {
    db.query
      .mockResolvedValueOnce({ insertId: 10 })
      .mockResolvedValueOnce([{ id: 10, tracking_number: '680175257204' }]);

    const result = await ShippingTrackingNumber.add({
      tracking_number: '680175257204',
      raw_input: 'A680175257204A',
      courier_id: 1,
      scan_date: '2026-05-08',
      batch_id: 'batch-1',
      notes: null
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO shipping_tracking_numbers'),
      ['680175257204', 'A680175257204A', 1, '2026-05-08', 'batch-1', null]
    );
    expect(result).toEqual({ id: 10, tracking_number: '680175257204' });
  });

  test('add returns duplicate result on daily unique conflict', async () => {
    const duplicateError = new Error('Duplicate entry');
    duplicateError.code = 'ER_DUP_ENTRY';
    db.query
      .mockRejectedValueOnce(duplicateError)
      .mockResolvedValueOnce([{ id: 3, tracking_number: '680175257204' }]);

    const result = await ShippingTrackingNumber.add({
      tracking_number: '680175257204',
      raw_input: 'A680175257204A',
      courier_id: 1,
      scan_date: '2026-05-08',
      batch_id: 'batch-1'
    });

    expect(result).toEqual({
      duplicate: true,
      existing: { id: 3, tracking_number: '680175257204' }
    });
  });

  test('getStatsByDate returns total and courier grouping', async () => {
    db.query
      .mockResolvedValueOnce([{ total: 24 }])
      .mockResolvedValueOnce([
        { courier_id: 1, courier_name: 'ゆうパケット', total: 18 },
        { courier_id: 2, courier_name: '佐川急便', total: 6 }
      ]);

    const result = await ShippingTrackingNumber.getStatsByDate('2026-05-08');

    expect(result).toEqual({
      total: 24,
      by_courier: [
        { courier_id: 1, courier_name: 'ゆうパケット', total: 18 },
        { courier_id: 2, courier_name: '佐川急便', total: 6 }
      ]
    });
  });
});
