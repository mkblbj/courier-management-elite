const db = require('../db');

class ShippingTrackingNumber {
  constructor() {
    this.table = 'shipping_tracking_numbers';
  }

  async getById(id) {
    const sql = `
      SELECT stn.*, c.name as courier_name, c.barcode_rule_type
      FROM ${this.table} stn
      LEFT JOIN couriers c ON stn.courier_id = c.id
      WHERE stn.id = ?
    `;
    const results = await db.query(sql, [id]);
    return results.length > 0 ? results[0] : null;
  }

  async getByDateAndTrackingNumber(scanDate, trackingNumber) {
    const sql = `
      SELECT stn.*, c.name as courier_name
      FROM ${this.table} stn
      LEFT JOIN couriers c ON stn.courier_id = c.id
      WHERE DATE(stn.scan_date) = DATE(?) AND stn.tracking_number = ?
      LIMIT 1
    `;
    const results = await db.query(sql, [scanDate, trackingNumber]);
    return results.length > 0 ? results[0] : null;
  }

  async add(data) {
    const sql = `
      INSERT INTO ${this.table}
        (tracking_number, raw_input, courier_id, scan_date, batch_id, notes)
      VALUES (?, ?, ?, DATE(?), ?, ?)
    `;

    try {
      const result = await db.query(sql, [
        data.tracking_number,
        data.raw_input,
        data.courier_id,
        data.scan_date,
        data.batch_id,
        data.notes || null
      ]);

      return await this.getById(result.insertId);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          duplicate: true,
          existing: await this.getByDateAndTrackingNumber(data.scan_date, data.tracking_number)
        };
      }
      throw error;
    }
  }

  async getAll(options = {}) {
    let sql = `
      SELECT stn.*, c.name as courier_name, c.barcode_rule_type
      FROM ${this.table} stn
      LEFT JOIN couriers c ON stn.courier_id = c.id
    `;
    const params = [];
    const whereClauses = [];

    if (options.date) {
      whereClauses.push('DATE(stn.scan_date) = DATE(?)');
      params.push(options.date);
    }

    if (options.courier_id) {
      whereClauses.push('stn.courier_id = ?');
      params.push(parseInt(options.courier_id, 10));
    }

    if (options.batch_id) {
      whereClauses.push('stn.batch_id = ?');
      params.push(options.batch_id);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    sql += ' ORDER BY stn.created_at DESC, stn.id DESC';
    return await db.query(sql, params);
  }

  async getByBatch(batchId) {
    return await this.getAll({ batch_id: batchId });
  }

  async getByDateAndCourier(date, courierId) {
    return await this.getAll({ date, courier_id: courierId });
  }

  async getStatsByDate(date) {
    const totalRows = await db.query(
      `SELECT COUNT(*) as total FROM ${this.table} WHERE DATE(scan_date) = DATE(?)`,
      [date]
    );

    const byCourier = await db.query(
      `SELECT
        stn.courier_id,
        c.name as courier_name,
        COUNT(*) as total
       FROM ${this.table} stn
       LEFT JOIN couriers c ON stn.courier_id = c.id
       WHERE DATE(stn.scan_date) = DATE(?)
       GROUP BY stn.courier_id, c.name
       ORDER BY total DESC`,
      [date]
    );

    return {
      total: Number(totalRows[0]?.total || 0),
      by_courier: byCourier.map((row) => ({
        ...row,
        total: Number(row.total || 0)
      }))
    };
  }

  async update(id, data) {
    const setClauses = [];
    const params = [];

    if (data.tracking_number !== undefined) {
      setClauses.push('tracking_number = ?');
      params.push(data.tracking_number);
    }

    if (data.raw_input !== undefined) {
      setClauses.push('raw_input = ?');
      params.push(data.raw_input);
    }

    if (data.courier_id !== undefined) {
      setClauses.push('courier_id = ?');
      params.push(data.courier_id);
    }

    if (data.scan_date !== undefined) {
      setClauses.push('scan_date = DATE(?)');
      params.push(data.scan_date);
    }

    if (data.notes !== undefined) {
      setClauses.push('notes = ?');
      params.push(data.notes);
    }

    if (setClauses.length === 0) {
      return await this.getById(id);
    }

    params.push(id);
    await db.query(`UPDATE ${this.table} SET ${setClauses.join(', ')} WHERE id = ?`, params);
    return await this.getById(id);
  }

  async delete(id) {
    const result = await db.query(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  async deleteBatch(batchId) {
    const result = await db.query(`DELETE FROM ${this.table} WHERE batch_id = ?`, [batchId]);
    return result.affectedRows || 0;
  }

  async existsToday(date, trackingNumber) {
    const existing = await this.getByDateAndTrackingNumber(date, trackingNumber);
    return Boolean(existing);
  }
}

module.exports = new ShippingTrackingNumber();
