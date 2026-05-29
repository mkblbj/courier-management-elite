# Scan Count Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new `出荷计数` page for scanner-based parcel counting and tracking-number collection, with daily duplicate protection and barcode-specific validation.

**Architecture:** Keep the feature independent from existing `shipping_records`: create a new `shipping_tracking_numbers` table and expose it through `/api/scan-counts`. The frontend adds a dedicated `/scan-count` route, parses scanner keyboard input according to courier barcode rules, stores each scanned tracking number, and shows current-batch plus daily totals. Existing shipping-data entry and dashboard shipping totals are not changed in this first version.

**Tech Stack:** Express 5, mysql2, express-validator, Jest/Supertest, MySQL, Next.js 15, React 19, TypeScript, Tailwind CSS, existing shadcn-style UI components, Web Audio API.

---

## Product Decisions

- Data persistence: tracking numbers are stored in a new table only. They do not increment `shipping_records.quantity`.
- Duplicate scope: duplicate detection is daily. The same tracking number is rejected if it has already been scanned on the same `scan_date`, even in another batch.
- Postal NW-7/Codabar handling: for Japan Post style labels, strip leading and trailing `A/B/C/D` guard characters before saving.
- Sagawa handling: prefer Codabar/NW-7 when present, strip paired leading/trailing guard letters before saving. If the scanned value has no letters, keep it as scanned.
- Non-waybill warning: strings like `99-70-15` from the upper-left area of the postal label must be rejected with a clear rescan warning.
- Courier choice: only active courier types are selectable; `未指定` courier types are excluded.

## File Structure

- `backend/src/db/migrations/create_shipping_tracking_numbers.js`: create `shipping_tracking_numbers`, add `couriers.barcode_rule_type`, add indexes and rollback.
- `backend/src/db/initialize.js`: import and execute the migration.
- `backend/src/models/ShippingTrackingNumber.js`: data access for scan records, batch queries, daily stats, update, delete, duplicate lookup.
- `backend/src/controllers/ShippingTrackingNumberController.js`: request validation and REST handlers.
- `backend/src/routes/shippingTrackingNumberRoutes.js`: scan-count route definitions.
- `backend/src/routes/index.js`: mount `/api/scan-counts` and add docs entry.
- `backend/src/tests/unit/shippingTrackingNumber.test.js`: model/controller tests with mocked DB.
- `frontend/lib/barcode-parser.ts`: pure parser for postal, sagawa, generic rules.
- `frontend/lib/audio-feedback.ts`: Web Audio beep helpers.
- `frontend/services/scan-count-api.ts`: frontend API client.
- `frontend/hooks/use-scan-count.ts`: scanner state machine, batch state, local duplicate Set, mutations.
- `frontend/app/scan-count/page.tsx`: page shell with `DashboardHeader`.
- `frontend/app/scan-count/components/ScanCountPanel.tsx`: courier selector and start/stop controls.
- `frontend/app/scan-count/components/ScanInputArea.tsx`: hidden focused input, scanner buffer, focus recovery, manual input.
- `frontend/app/scan-count/components/ScanCountStats.tsx`: current-batch and daily counts.
- `frontend/app/scan-count/components/ScanItemList.tsx`: scanned item list with delete/update/retry actions.
- `frontend/app/scan-count/components/BatchSummaryDialog.tsx`: batch summary and optional batch undo.
- `frontend/components/animated-menu.tsx`: add the `出荷计数` navigation item.
- `frontend/public/locales/{zh-CN,en,ja}/common.json`: add labels and warnings.

## API Contract

### `POST /api/scan-counts`

Request:

```json
{
  "tracking_number": "680175257204",
  "raw_input": "A680175257204A",
  "courier_id": 1,
  "scan_date": "2026-05-08",
  "batch_id": "8bb00f15-7f97-4460-a8d8-8f9ba6d0ff1b",
  "notes": "optional"
}
```

Success:

```json
{
  "success": true,
  "data": {
    "id": 100,
    "tracking_number": "680175257204",
    "raw_input": "A680175257204A",
    "courier_id": 1,
    "courier_name": "ゆうパケット (2CM)",
    "scan_date": "2026-05-08",
    "batch_id": "8bb00f15-7f97-4460-a8d8-8f9ba6d0ff1b",
    "notes": null
  },
  "message": "扫描记录已保存"
}
```

Duplicate:

```json
{
  "success": false,
  "message": "该运单号今天已扫描",
  "duplicate": true,
  "data": {
    "tracking_number": "680175257204",
    "courier_name": "ゆうパケット (2CM)",
    "created_at": "2026-05-08T06:00:00.000Z"
  }
}
```

### `GET /api/scan-counts`

Query params:

- `date=YYYY-MM-DD`
- `courier_id=1`
- `batch_id=uuid`

### `GET /api/scan-counts/stats?date=YYYY-MM-DD`

Response:

```json
{
  "success": true,
  "data": {
    "total": 24,
    "by_courier": [
      {
        "courier_id": 1,
        "courier_name": "ゆうパケット (2CM)",
        "total": 18
      }
    ]
  }
}
```

## Task 1: Backend Migration

**Files:**
- Create: `backend/src/db/migrations/create_shipping_tracking_numbers.js`
- Modify: `backend/src/db/initialize.js`

- [ ] **Step 1: Create the migration file**

Create `backend/src/db/migrations/create_shipping_tracking_numbers.js` with this structure:

```js
const mysql = require('mysql2/promise');
const { initConfig, dbName } = require('../config');

async function tableExists(connection, tableName) {
  const [tables] = await connection.query(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return Array.isArray(tables) && tables.length > 0;
}

async function columnExists(connection, tableName, columnName) {
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return Array.isArray(columns) && columns.length > 0;
}

async function indexExists(connection, tableName, indexName) {
  const [indexes] = await connection.query(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [tableName, indexName]
  );
  return Array.isArray(indexes) && indexes.length > 0;
}

async function migrate() {
  let connection;

  try {
    console.log('开始执行迁移脚本: 创建shipping_tracking_numbers表...');
    connection = await mysql.createConnection({ ...initConfig, database: dbName });

    if (!(await columnExists(connection, 'couriers', 'barcode_rule_type'))) {
      await connection.query(`
        ALTER TABLE couriers
        ADD COLUMN barcode_rule_type ENUM('postal', 'sagawa', 'generic')
        NOT NULL DEFAULT 'generic'
        COMMENT '扫码条码规则：postal=邮政NW-7去首尾字母，sagawa=佐川NW-7去首尾字母，generic=通用字母数字'
        AFTER category_id
      `);
      console.log('couriers.barcode_rule_type 字段添加成功');
    } else {
      console.log('couriers.barcode_rule_type 字段已存在，跳过添加');
    }

    await connection.query(`
      UPDATE couriers
      SET barcode_rule_type = 'postal'
      WHERE barcode_rule_type = 'generic'
        AND (
          name LIKE '%ゆうパケット%'
          OR name LIKE '%ゆうパック%'
          OR name LIKE '%郵便%'
          OR name LIKE '%邮政%'
          OR code LIKE 'up%'
        )
    `);

    await connection.query(`
      UPDATE couriers
      SET barcode_rule_type = 'sagawa'
      WHERE name LIKE '%佐川%' OR code LIKE '%sagawa%'
    `);

    if (!(await tableExists(connection, 'shipping_tracking_numbers'))) {
      await connection.query(`
        CREATE TABLE shipping_tracking_numbers (
          id INT PRIMARY KEY AUTO_INCREMENT,
          tracking_number VARCHAR(50) NOT NULL COMMENT '处理后的运单号',
          raw_input VARCHAR(100) NOT NULL COMMENT '扫码枪原始输入',
          courier_id INT NOT NULL COMMENT '快递类型ID',
          scan_date DATE NOT NULL COMMENT '扫描日期',
          batch_id VARCHAR(36) NOT NULL COMMENT '本轮扫描批次ID',
          notes TEXT DEFAULT NULL COMMENT '备注',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
          UNIQUE KEY uniq_tracking_number_per_day (scan_date, tracking_number),
          INDEX idx_shipping_tracking_date_courier (scan_date, courier_id),
          INDEX idx_shipping_tracking_batch (batch_id),
          INDEX idx_shipping_tracking_created_at (created_at),
          CONSTRAINT fk_shipping_tracking_courier
            FOREIGN KEY (courier_id) REFERENCES couriers(id)
            ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='扫码计数运单号记录表'
      `);
      console.log('shipping_tracking_numbers表创建成功');
    } else {
      console.log('shipping_tracking_numbers表已存在，跳过创建');
    }

    if (!(await indexExists(connection, 'shipping_tracking_numbers', 'idx_shipping_tracking_date_courier'))) {
      await connection.query(`
        CREATE INDEX idx_shipping_tracking_date_courier
        ON shipping_tracking_numbers(scan_date, courier_id)
      `);
    }

    console.log('迁移脚本执行完成');
  } catch (error) {
    console.error('迁移脚本执行失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

async function rollback() {
  let connection;

  try {
    console.log('开始回滚扫码计数迁移...');
    connection = await mysql.createConnection({ ...initConfig, database: dbName });

    if (await tableExists(connection, 'shipping_tracking_numbers')) {
      await connection.query('DROP TABLE shipping_tracking_numbers');
      console.log('shipping_tracking_numbers表已删除');
    }

    if (await columnExists(connection, 'couriers', 'barcode_rule_type')) {
      await connection.query('ALTER TABLE couriers DROP COLUMN barcode_rule_type');
      console.log('couriers.barcode_rule_type字段已删除');
    }

    console.log('回滚脚本执行完成');
  } catch (error) {
    console.error('回滚脚本执行失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

if (require.main === module) {
  const isRollback = process.argv.includes('--rollback');
  const runner = isRollback ? rollback : migrate;

  runner()
    .then(() => {
      console.log(isRollback ? '回滚脚本执行成功' : '迁移脚本执行成功');
      process.exit(0);
    })
    .catch((err) => {
      console.error(isRollback ? '回滚脚本执行失败:' : '迁移脚本执行失败:', err);
      process.exit(1);
    });
}

module.exports = { migrate, rollback };
```

- [ ] **Step 2: Register migration in `backend/src/db/initialize.js`**

Add the import near the other migrations:

```js
const shippingTrackingNumbersMigration = require('./migrations/create_shipping_tracking_numbers');
```

Run it after `addMercariFieldsMigration.migrate()`:

```js
// 6. 创建扫码计数运单号表
console.log('执行创建扫码计数运单号表迁移...');
await shippingTrackingNumbersMigration.migrate();
```

- [ ] **Step 3: Run migration**

Run:

```bash
cd backend && npm run db:init
```

Expected:

```text
数据库初始化完成
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/db/migrations/create_shipping_tracking_numbers.js backend/src/db/initialize.js
git commit -m "feat: add scan count tracking migration"
```

## Task 2: Backend Model

**Files:**
- Create: `backend/src/models/ShippingTrackingNumber.js`
- Create: `backend/src/tests/unit/shippingTrackingNumber.test.js`

- [ ] **Step 1: Create model unit tests**

Create `backend/src/tests/unit/shippingTrackingNumber.test.js`:

```js
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
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
cd backend && npm test -- shippingTrackingNumber.test.js
```

Expected:

```text
Cannot find module '../../models/ShippingTrackingNumber'
```

- [ ] **Step 3: Implement the model**

Create `backend/src/models/ShippingTrackingNumber.js`:

```js
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
```

- [ ] **Step 4: Run tests and verify they pass**

Run:

```bash
cd backend && npm test -- shippingTrackingNumber.test.js
```

Expected:

```text
PASS src/tests/unit/shippingTrackingNumber.test.js
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/models/ShippingTrackingNumber.js backend/src/tests/unit/shippingTrackingNumber.test.js
git commit -m "feat: add scan count tracking model"
```

## Task 3: Backend Controller and Routes

**Files:**
- Create: `backend/src/controllers/ShippingTrackingNumberController.js`
- Create: `backend/src/routes/shippingTrackingNumberRoutes.js`
- Modify: `backend/src/routes/index.js`
- Modify: `backend/src/tests/unit/shippingTrackingNumber.test.js`

- [ ] **Step 1: Add controller tests**

Append to `backend/src/tests/unit/shippingTrackingNumber.test.js`:

```js
const {
  ShippingTrackingNumberController
} = require('../../controllers/ShippingTrackingNumberController');
const Courier = require('../../models/Courier');

jest.mock('../../models/Courier', () => ({
  getById: jest.fn()
}));

const createResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('ShippingTrackingNumberController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('create returns 201 for a new tracking number', async () => {
    Courier.getById.mockResolvedValue({ id: 1, name: 'ゆうパケット', is_active: 1 });
    db.query
      .mockResolvedValueOnce({ insertId: 10 })
      .mockResolvedValueOnce([{ id: 10, tracking_number: '680175257204' }]);

    const req = {
      body: {
        tracking_number: '680175257204',
        raw_input: 'A680175257204A',
        courier_id: 1,
        scan_date: '2026-05-08',
        batch_id: 'batch-1'
      }
    };
    const res = createResponse();

    await ShippingTrackingNumberController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: '扫描记录已保存'
    }));
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
cd backend && npm test -- shippingTrackingNumber.test.js
```

Expected:

```text
Cannot find module '../../controllers/ShippingTrackingNumberController'
```

- [ ] **Step 3: Create controller**

Create `backend/src/controllers/ShippingTrackingNumberController.js`:

```js
const { body, validationResult } = require('express-validator');
const ShippingTrackingNumber = require('../models/ShippingTrackingNumber');
const Courier = require('../models/Courier');
const dateUtils = require('../utils/dateUtils');

const validateCreateTrackingNumber = [
  body('tracking_number')
    .notEmpty().withMessage('运单号不能为空')
    .isLength({ min: 6, max: 50 }).withMessage('运单号长度必须在6-50个字符之间')
    .matches(/^[A-Za-z0-9]+$/).withMessage('运单号只能包含字母和数字'),
  body('raw_input')
    .notEmpty().withMessage('原始扫码内容不能为空')
    .isLength({ min: 1, max: 100 }).withMessage('原始扫码内容不能超过100个字符'),
  body('courier_id')
    .notEmpty().withMessage('快递类型不能为空')
    .isInt().withMessage('快递类型ID必须是整数'),
  body('scan_date')
    .notEmpty().withMessage('扫描日期不能为空')
    .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('扫描日期格式不正确，应为YYYY-MM-DD'),
  body('batch_id')
    .notEmpty().withMessage('批次ID不能为空')
    .isLength({ min: 1, max: 36 }).withMessage('批次ID不能超过36个字符'),
  body('notes')
    .optional({ nullable: true })
    .isLength({ max: 500 }).withMessage('备注长度不能超过500个字符')
];

const validateUpdateTrackingNumber = [
  body('tracking_number')
    .optional()
    .isLength({ min: 6, max: 50 }).withMessage('运单号长度必须在6-50个字符之间')
    .matches(/^[A-Za-z0-9]+$/).withMessage('运单号只能包含字母和数字'),
  body('courier_id')
    .optional()
    .isInt().withMessage('快递类型ID必须是整数'),
  body('notes')
    .optional({ nullable: true })
    .isLength({ max: 500 }).withMessage('备注长度不能超过500个字符')
];

class ShippingTrackingNumberController {
  formatValidationErrors(req, res) {
    const errors = validationResult(req);
    if (errors.isEmpty()) return false;

    res.status(400).json({
      success: false,
      errors: errors.array().reduce((acc, err) => {
        acc[err.path || err.type] = err.msg;
        return acc;
      }, {})
    });
    return true;
  }

  async create(req, res) {
    try {
      if (this.formatValidationErrors(req, res)) return;

      if (!dateUtils.isValidDateString(req.body.scan_date)) {
        return res.status(400).json({
          success: false,
          errors: { scan_date: '扫描日期格式不正确或无效，应为YYYY-MM-DD' }
        });
      }

      const courier = await Courier.getById(req.body.courier_id);
      if (!courier) {
        return res.status(400).json({
          success: false,
          errors: { courier_id: '快递类型不存在' }
        });
      }

      if (!Boolean(courier.is_active)) {
        return res.status(400).json({
          success: false,
          errors: { courier_id: '快递类型已停用' }
        });
      }

      const result = await ShippingTrackingNumber.add(req.body);

      if (result.duplicate) {
        return res.status(409).json({
          success: false,
          duplicate: true,
          message: '该运单号今天已扫描',
          data: result.existing
        });
      }

      return res.status(201).json({
        success: true,
        data: result,
        message: '扫描记录已保存'
      });
    } catch (error) {
      console.error('创建扫码计数记录失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建扫码计数记录失败'
      });
    }
  }

  async getAll(req, res) {
    try {
      const records = await ShippingTrackingNumber.getAll({
        date: req.query.date,
        courier_id: req.query.courier_id,
        batch_id: req.query.batch_id
      });

      return res.status(200).json({
        success: true,
        data: { records }
      });
    } catch (error) {
      console.error('获取扫码计数记录失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取扫码计数记录失败'
      });
    }
  }

  async getStats(req, res) {
    try {
      const date = req.query.date || dateUtils.getCurrentDateString();
      const stats = await ShippingTrackingNumber.getStatsByDate(date);

      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取扫码计数统计失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取扫码计数统计失败'
      });
    }
  }

  async update(req, res) {
    try {
      if (this.formatValidationErrors(req, res)) return;

      const id = parseInt(req.params.id, 10);
      const existing = await ShippingTrackingNumber.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: '扫码计数记录不存在' });
      }

      const updated = await ShippingTrackingNumber.update(id, req.body);
      return res.status(200).json({
        success: true,
        data: updated,
        message: '扫码计数记录已更新'
      });
    } catch (error) {
      console.error('更新扫码计数记录失败:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          duplicate: true,
          message: '该运单号今天已扫描'
        });
      }
      return res.status(500).json({ success: false, message: '更新扫码计数记录失败' });
    }
  }

  async delete(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await ShippingTrackingNumber.delete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: '扫码计数记录不存在' });
      }

      return res.status(200).json({ success: true, message: '扫码计数记录已删除' });
    } catch (error) {
      console.error('删除扫码计数记录失败:', error);
      return res.status(500).json({ success: false, message: '删除扫码计数记录失败' });
    }
  }

  async deleteBatch(req, res) {
    try {
      const deleted = await ShippingTrackingNumber.deleteBatch(req.params.batchId);
      return res.status(200).json({
        success: true,
        data: { deleted },
        message: `已撤销${deleted}条扫码记录`
      });
    } catch (error) {
      console.error('撤销扫码计数批次失败:', error);
      return res.status(500).json({ success: false, message: '撤销扫码计数批次失败' });
    }
  }
}

module.exports = {
  ShippingTrackingNumberController: new ShippingTrackingNumberController(),
  validateCreateTrackingNumber,
  validateUpdateTrackingNumber
};
```

- [ ] **Step 4: Create routes**

Create `backend/src/routes/shippingTrackingNumberRoutes.js`:

```js
const express = require('express');
const {
  ShippingTrackingNumberController,
  validateCreateTrackingNumber,
  validateUpdateTrackingNumber
} = require('../controllers/ShippingTrackingNumberController');

const router = express.Router();

router.get('/stats', ShippingTrackingNumberController.getStats.bind(ShippingTrackingNumberController));
router.get('/', ShippingTrackingNumberController.getAll.bind(ShippingTrackingNumberController));
router.post('/', validateCreateTrackingNumber, ShippingTrackingNumberController.create.bind(ShippingTrackingNumberController));
router.put('/:id', validateUpdateTrackingNumber, ShippingTrackingNumberController.update.bind(ShippingTrackingNumberController));
router.delete('/batch/:batchId', ShippingTrackingNumberController.deleteBatch.bind(ShippingTrackingNumberController));
router.delete('/:id', ShippingTrackingNumberController.delete.bind(ShippingTrackingNumberController));

module.exports = router;
```

- [ ] **Step 5: Mount routes in `backend/src/routes/index.js`**

Add the import:

```js
const shippingTrackingNumberRoutes = require('./shippingTrackingNumberRoutes');
```

Mount it after shipping routes:

```js
// 出荷计数扫码API路由
router.use('/scan-counts', shippingTrackingNumberRoutes);
```

Add a docs entry inside the `apis` array:

```js
{
  name: '出荷计数扫码API',
  description: '扫码枪运单号记录、统计、删除和批次撤销',
  basePath: '/api/scan-counts',
  endpoints: [
    { method: 'GET', path: '/', description: '获取扫码记录列表' },
    { method: 'GET', path: '/stats', description: '获取指定日期扫码统计' },
    { method: 'POST', path: '/', description: '创建扫码记录' },
    { method: 'PUT', path: '/:id', description: '更新扫码记录' },
    { method: 'DELETE', path: '/:id', description: '删除单条扫码记录' },
    { method: 'DELETE', path: '/batch/:batchId', description: '撤销整个批次' }
  ]
}
```

- [ ] **Step 6: Run tests**

Run:

```bash
cd backend && npm test -- shippingTrackingNumber.test.js
```

Expected:

```text
PASS src/tests/unit/shippingTrackingNumber.test.js
```

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/ShippingTrackingNumberController.js backend/src/routes/shippingTrackingNumberRoutes.js backend/src/routes/index.js backend/src/tests/unit/shippingTrackingNumber.test.js
git commit -m "feat: add scan count API"
```

## Task 4: Frontend Barcode Parser and Audio Feedback

**Files:**
- Create: `frontend/lib/barcode-parser.ts`
- Create: `frontend/lib/audio-feedback.ts`

- [ ] **Step 1: Create barcode parser**

Create `frontend/lib/barcode-parser.ts`:

```ts
export type BarcodeRuleType = "postal" | "sagawa" | "generic"

export type BarcodeParseError =
  | "empty"
  | "tooShort"
  | "badFormat"
  | "looksLikeNonShipping"

export type BarcodeParseResult =
  | { ok: true; rawInput: string; trackingNumber: string }
  | { ok: false; rawInput: string; reason: BarcodeParseError }

const GUARD_LETTER_PATTERN = /^[ABCD]$/i
const POSTAL_PATTERN = /^([ABCD])?(\d{10,13})([ABCD])?$/i
const SAGAWA_PATTERN = /^([ABCD])?(\d{10,13})([ABCD])?$/i
const GENERIC_PATTERN = /^[A-Za-z0-9]{8,50}$/

export function parseBarcode(input: string, ruleType: BarcodeRuleType): BarcodeParseResult {
  const rawInput = input.trim()

  if (!rawInput) {
    return { ok: false, rawInput, reason: "empty" }
  }

  if (rawInput.includes("-") || /\s/.test(rawInput)) {
    return { ok: false, rawInput, reason: "looksLikeNonShipping" }
  }

  if (rawInput.length < 8) {
    return { ok: false, rawInput, reason: "tooShort" }
  }

  if (ruleType === "postal") {
    const match = rawInput.match(POSTAL_PATTERN)
    if (!match) {
      return { ok: false, rawInput, reason: "badFormat" }
    }

    const leading = match[1]
    const digits = match[2]
    const trailing = match[3]
    const hasGuardPair = leading && trailing && GUARD_LETTER_PATTERN.test(leading) && GUARD_LETTER_PATTERN.test(trailing)

    return {
      ok: true,
      rawInput,
      trackingNumber: hasGuardPair ? digits : rawInput
    }
  }

  if (ruleType === "sagawa") {
    if (!SAGAWA_PATTERN.test(rawInput) && !/^\d{10,13}$/.test(rawInput)) {
      return { ok: false, rawInput, reason: "badFormat" }
    }

    return { ok: true, rawInput, trackingNumber: rawInput }
  }

  if (!GENERIC_PATTERN.test(rawInput)) {
    return { ok: false, rawInput, reason: "badFormat" }
  }

  return { ok: true, rawInput, trackingNumber: rawInput }
}

export function getBarcodeErrorMessage(reason: BarcodeParseError): string {
  switch (reason) {
    case "looksLikeNonShipping":
      return "扫到的不是运单号，请重新扫描运单号条形码"
    case "empty":
      return "扫码内容为空"
    case "tooShort":
      return "扫码内容过短，请重新扫描"
    default:
      return "运单号格式不正确，请重新扫描"
  }
}
```

Important behavior to preserve:

- `parseBarcode("A680175257204A", "postal")` returns `680175257204`.
- `parseBarcode("99-70-15", "postal")` returns `looksLikeNonShipping`.
- `parseBarcode("A123456789012A", "sagawa")` returns `A123456789012A`.
- `parseBarcode("123456789012", "sagawa")` returns `123456789012`.

- [ ] **Step 2: Create audio feedback helper**

Create `frontend/lib/audio-feedback.ts`:

```ts
type BeepOptions = {
  frequency: number
  durationMs: number
  delayMs?: number
}

function playBeep({ frequency, durationMs, delayMs = 0 }: BeepOptions) {
  if (typeof window === "undefined") return

  window.setTimeout(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.type = "sine"
    oscillator.frequency.value = frequency
    gain.gain.value = 0.08

    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start()

    window.setTimeout(() => {
      oscillator.stop()
      audioContext.close()
    }, durationMs)
  }, delayMs)
}

export function beepSuccess() {
  playBeep({ frequency: 880, durationMs: 60 })
}

export function beepDuplicate() {
  playBeep({ frequency: 620, durationMs: 70 })
  playBeep({ frequency: 620, durationMs: 70, delayMs: 120 })
}

export function beepError() {
  playBeep({ frequency: 220, durationMs: 180 })
}
```

- [ ] **Step 3: Run frontend lint**

Run:

```bash
cd frontend && pnpm lint
```

Expected:

```text
No ESLint warnings or errors
```

If the repository's Next.js 15 setup reports `next lint` deprecation or missing config, record the exact output and continue with `pnpm build` during final verification.

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/barcode-parser.ts frontend/lib/audio-feedback.ts
git commit -m "feat: add barcode parser for scan count"
```

## Task 5: Frontend API Service

**Files:**
- Create: `frontend/services/scan-count-api.ts`

- [ ] **Step 1: Create service**

Create `frontend/services/scan-count-api.ts`:

```ts
import { useEnvStore, debugLog, debugError } from "@/lib/env-config"

function getApiBaseUrl(): string {
  return useEnvStore.getState().getEffectiveApiUrl()
}

function getScanCountEndpoint(): string {
  return `${getApiBaseUrl()}/api/scan-counts`
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return ""

  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString())
    }
  })

  return queryParams.toString() ? `?${queryParams.toString()}` : ""
}

interface ApiResponseFormat<T> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string>
  duplicate?: boolean
}

export interface ScanCountRecord {
  id: number
  tracking_number: string
  raw_input: string
  courier_id: number
  courier_name?: string
  barcode_rule_type?: "postal" | "sagawa" | "generic"
  scan_date: string
  batch_id: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateScanCountRecordRequest {
  tracking_number: string
  raw_input: string
  courier_id: number | string
  scan_date: string
  batch_id: string
  notes?: string | null
}

export interface ScanCountStats {
  total: number
  by_courier: {
    courier_id: number
    courier_name: string
    total: number
  }[]
}

export class ScanCountDuplicateError extends Error {
  record?: ScanCountRecord

  constructor(message: string, record?: ScanCountRecord) {
    super(message)
    this.name = "ScanCountDuplicateError"
    this.record = record
  }
}

async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
  const envConfig = useEnvStore.getState()
  const method = options?.method || "GET"

  if (envConfig.debug) {
    debugLog(`ScanCount API请求: ${method} ${url}`, options?.body ? { body: options.body } : "")
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  const responseData = (await response.json().catch(() => null)) as ApiResponseFormat<T> | null

  if (!response.ok || !responseData?.success) {
    if (response.status === 409 || responseData?.duplicate) {
      throw new ScanCountDuplicateError(responseData?.message || "该运单号今天已扫描", responseData?.data as ScanCountRecord)
    }

    const firstValidationError = responseData?.errors ? Object.values(responseData.errors)[0] : null
    const message = firstValidationError || responseData?.message || `API请求失败: ${response.status} ${response.statusText}`
    debugError(`ScanCount API错误: ${method} ${url}`, responseData || message)
    throw new Error(message)
  }

  return responseData.data as T
}

export const scanCountApi = {
  async list(params?: { date?: string; courier_id?: number | string; batch_id?: string }) {
    const queryString = buildQueryString(params)
    return fetchWithErrorHandling<{ records: ScanCountRecord[] }>(`${getScanCountEndpoint()}${queryString}`)
  },

  async getStats(params?: { date?: string }) {
    const queryString = buildQueryString(params)
    return fetchWithErrorHandling<ScanCountStats>(`${getScanCountEndpoint()}/stats${queryString}`)
  },

  async create(data: CreateScanCountRecordRequest) {
    return fetchWithErrorHandling<ScanCountRecord>(getScanCountEndpoint(), {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: number | string, data: Partial<CreateScanCountRecordRequest>) {
    return fetchWithErrorHandling<ScanCountRecord>(`${getScanCountEndpoint()}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: number | string) {
    return fetchWithErrorHandling<void>(`${getScanCountEndpoint()}/${id}`, {
      method: "DELETE",
    })
  },

  async deleteBatch(batchId: string) {
    return fetchWithErrorHandling<{ deleted: number }>(`${getScanCountEndpoint()}/batch/${batchId}`, {
      method: "DELETE",
    })
  },
}
```

- [ ] **Step 2: Run frontend lint**

Run:

```bash
cd frontend && pnpm lint
```

Expected:

```text
No ESLint warnings or errors
```

- [ ] **Step 3: Commit**

```bash
git add frontend/services/scan-count-api.ts
git commit -m "feat: add scan count API client"
```

## Task 6: Scanner State Hook

**Files:**
- Create: `frontend/hooks/use-scan-count.ts`

- [ ] **Step 1: Create hook**

Create `frontend/hooks/use-scan-count.ts`:

```ts
"use client"

import { useCallback, useMemo, useState } from "react"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { parseBarcode, getBarcodeErrorMessage, type BarcodeRuleType } from "@/lib/barcode-parser"
import { beepDuplicate, beepError, beepSuccess } from "@/lib/audio-feedback"
import { scanCountApi, ScanCountDuplicateError, type ScanCountRecord, type ScanCountStats } from "@/services/scan-count-api"

type ScanStatus = "idle" | "active"

type CourierForScan = {
  id: number | string
  name: string
  barcode_rule_type?: BarcodeRuleType
}

export function useScanCount() {
  const today = format(new Date(), "yyyy-MM-dd")
  const [status, setStatus] = useState<ScanStatus>("idle")
  const [selectedCourier, setSelectedCourier] = useState<CourierForScan | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [currentBatch, setCurrentBatch] = useState<ScanCountRecord[]>([])
  const [todayRecords, setTodayRecords] = useState<ScanCountRecord[]>([])
  const [stats, setStats] = useState<ScanCountStats>({ total: 0, by_courier: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const todaySeenSet = useMemo(() => {
    return new Set(todayRecords.map((record) => record.tracking_number))
  }, [todayRecords])

  const todaySelectedCourierTotal = useMemo(() => {
    if (!selectedCourier) return 0
    const row = stats.by_courier.find((item) => item.courier_id.toString() === selectedCourier.id.toString())
    return row?.total || 0
  }, [selectedCourier, stats.by_courier])

  const refreshTodayData = useCallback(async () => {
    const [listResponse, statsResponse] = await Promise.all([
      scanCountApi.list({ date: today }),
      scanCountApi.getStats({ date: today }),
    ])

    setTodayRecords(listResponse.records)
    setStats(statsResponse)
  }, [today])

  const start = useCallback(async (courier: CourierForScan) => {
    setIsLoading(true)
    setLastError(null)

    try {
      await refreshTodayData()
      setSelectedCourier(courier)
      setBatchId(crypto.randomUUID())
      setCurrentBatch([])
      setStatus("active")
    } catch (error) {
      const message = error instanceof Error ? error.message : "启动出荷计数失败"
      setLastError(message)
      beepError()
      toast({ title: "启动失败", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [refreshTodayData])

  const stop = useCallback(() => {
    setStatus("idle")
  }, [])

  const submitScan = useCallback(async (rawInput: string) => {
    if (status !== "active" || !selectedCourier || !batchId) {
      beepError()
      toast({ title: "请先选择快递类型并开始计数", variant: "destructive" })
      return
    }

    const parseResult = parseBarcode(rawInput, selectedCourier.barcode_rule_type || "generic")

    if (!parseResult.ok) {
      const message = getBarcodeErrorMessage(parseResult.reason)
      setLastError(message)
      beepError()
      toast({ title: "扫码错误", description: message, variant: "destructive" })
      return
    }

    if (todaySeenSet.has(parseResult.trackingNumber)) {
      const message = "该运单号今天已扫描"
      setLastError(message)
      beepDuplicate()
      toast({ title: "重复扫描", description: message, variant: "destructive" })
      return
    }

    setIsLoading(true)
    setLastError(null)

    try {
      const saved = await scanCountApi.create({
        tracking_number: parseResult.trackingNumber,
        raw_input: parseResult.rawInput,
        courier_id: selectedCourier.id,
        scan_date: today,
        batch_id: batchId,
      })

      setCurrentBatch((prev) => [saved, ...prev])
      setTodayRecords((prev) => [saved, ...prev])
      setStats((prev) => {
        const byCourier = [...prev.by_courier]
        const existingIndex = byCourier.findIndex((item) => item.courier_id.toString() === saved.courier_id.toString())

        if (existingIndex >= 0) {
          byCourier[existingIndex] = {
            ...byCourier[existingIndex],
            total: byCourier[existingIndex].total + 1,
          }
        } else {
          byCourier.push({
            courier_id: saved.courier_id,
            courier_name: saved.courier_name || selectedCourier.name,
            total: 1,
          })
        }

        return { total: prev.total + 1, by_courier: byCourier }
      })

      beepSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : "保存扫码记录失败"
      setLastError(message)

      if (error instanceof ScanCountDuplicateError) {
        beepDuplicate()
        await refreshTodayData()
      } else {
        beepError()
      }

      toast({ title: "扫码失败", description: message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [batchId, refreshTodayData, selectedCourier, status, today, todaySeenSet])

  const removeItem = useCallback(async (id: number) => {
    await scanCountApi.delete(id)
    setCurrentBatch((prev) => prev.filter((item) => item.id !== id))
    await refreshTodayData()
  }, [refreshTodayData])

  const undoLast = useCallback(async () => {
    const last = currentBatch[0]
    if (!last) return
    await removeItem(last.id)
  }, [currentBatch, removeItem])

  const updateItem = useCallback(async (id: number, data: Partial<ScanCountRecord>) => {
    const updated = await scanCountApi.update(id, data)
    setCurrentBatch((prev) => prev.map((item) => (item.id === id ? updated : item)))
    await refreshTodayData()
  }, [refreshTodayData])

  const deleteBatch = useCallback(async () => {
    if (!batchId) return 0
    const result = await scanCountApi.deleteBatch(batchId)
    setCurrentBatch([])
    await refreshTodayData()
    return result.deleted
  }, [batchId, refreshTodayData])

  return {
    today,
    status,
    selectedCourier,
    batchId,
    currentBatch,
    stats,
    todaySelectedCourierTotal,
    isLoading,
    lastError,
    setSelectedCourier,
    start,
    stop,
    submitScan,
    removeItem,
    undoLast,
    updateItem,
    deleteBatch,
    refreshTodayData,
  }
}
```

- [ ] **Step 2: Run frontend lint**

Run:

```bash
cd frontend && pnpm lint
```

Expected:

```text
No ESLint warnings or errors
```

- [ ] **Step 3: Commit**

```bash
git add frontend/hooks/use-scan-count.ts
git commit -m "feat: add scan count state hook"
```

## Task 7: Scan Count Page and Components

**Files:**
- Create: `frontend/app/scan-count/page.tsx`
- Create: `frontend/app/scan-count/components/ScanCountPanel.tsx`
- Create: `frontend/app/scan-count/components/ScanInputArea.tsx`
- Create: `frontend/app/scan-count/components/ScanCountStats.tsx`
- Create: `frontend/app/scan-count/components/ScanItemList.tsx`
- Create: `frontend/app/scan-count/components/BatchSummaryDialog.tsx`

- [ ] **Step 1: Create panel component**

Create `frontend/app/scan-count/components/ScanCountPanel.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CourierType } from "@/services/api"

type ScanCountPanelProps = {
  courierTypes: CourierType[]
  selectedCourierId?: string
  status: "idle" | "active"
  isLoading: boolean
  onSelectCourier: (courierId: string) => void
  onStart: () => void
  onStop: () => void
}

export function ScanCountPanel({
  courierTypes,
  selectedCourierId,
  status,
  isLoading,
  onSelectCourier,
  onStart,
  onStop,
}: ScanCountPanelProps) {
  const isActive = status === "active"

  return (
    <Card>
      <CardHeader>
        <CardTitle>出荷计数</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selectedCourierId} onValueChange={onSelectCourier} disabled={isActive}>
          <SelectTrigger>
            <SelectValue placeholder="请选择快递类型" />
          </SelectTrigger>
          <SelectContent>
            {courierTypes.map((courier) => (
              <SelectItem key={courier.id} value={courier.id.toString()}>
                {courier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button onClick={onStart} disabled={!selectedCourierId || isActive || isLoading} className="flex-1">
            开始计数
          </Button>
          <Button onClick={onStop} disabled={!isActive} variant="outline" className="flex-1">
            停止计数
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create scanner input component**

Create `frontend/app/scan-count/components/ScanInputArea.tsx`:

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ScanInputAreaProps = {
  isActive: boolean
  lastError?: string | null
  onSubmitScan: (value: string) => Promise<void>
}

export function ScanInputArea({ isActive, lastError, onSubmitScan }: ScanInputAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [buffer, setBuffer] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [manualInput, setManualInput] = useState("")

  useEffect(() => {
    if (!isActive) return

    inputRef.current?.focus()
    const timer = window.setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus()
      }
      setIsFocused(document.activeElement === inputRef.current)
    }, 500)

    return () => window.clearInterval(timer)
  }, [isActive])

  const submitValue = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    await onSubmitScan(trimmed)
    setBuffer("")
    setManualInput("")
    inputRef.current?.focus()
  }

  return (
    <Card className={cn(isActive ? "border-green-500" : "border-muted", lastError && "border-red-500")}>
      <CardContent className="space-y-4 pt-6">
        <input
          ref={inputRef}
          value={buffer}
          onChange={(event) => setBuffer(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              submitValue(buffer)
            }
          }}
          className="sr-only"
          disabled={!isActive}
          aria-label="扫码枪输入"
        />

        <div className="rounded-lg border p-4 text-center">
          <div className={cn("text-2xl font-bold", isActive ? "text-green-700" : "text-muted-foreground")}>
            {isActive ? "扫码枪接收中" : "未开始计数"}
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            {isActive ? "请扫描运单号条形码，扫描后会自动保存" : "请选择快递类型后点击开始计数"}
          </div>
          {isActive && !isFocused && (
            <div className="mt-2 text-sm text-red-600">输入焦点丢失，正在自动恢复</div>
          )}
          {lastError && <div className="mt-2 text-sm font-medium text-red-600">{lastError}</div>}
        </div>

        <div className="flex gap-2">
          <Input
            value={manualInput}
            onChange={(event) => setManualInput(event.target.value)}
            placeholder="手动输入运单号"
            disabled={!isActive}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                submitValue(manualInput)
              }
            }}
          />
          <Button type="button" variant="outline" disabled={!isActive || !manualInput.trim()} onClick={() => submitValue(manualInput)}>
            手动提交
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create stats component**

Create `frontend/app/scan-count/components/ScanCountStats.tsx`:

```tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ScanCountStatsProps = {
  currentBatchCount: number
  todayCourierTotal: number
  todayTotal: number
}

export function ScanCountStats({ currentBatchCount, todayCourierTotal, todayTotal }: ScanCountStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">本轮计数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-700">{currentBatchCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">今日该快递类型</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-blue-700">{todayCourierTotal}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">今日全部扫码</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{todayTotal}</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 4: Create list component**

Create `frontend/app/scan-count/components/ScanItemList.tsx`:

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ScanCountRecord } from "@/services/scan-count-api"

type ScanItemListProps = {
  records: ScanCountRecord[]
  onDelete: (id: number) => Promise<void>
  onUndoLast: () => Promise<void>
}

export function ScanItemList({ records, onDelete, onUndoLast }: ScanItemListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>本轮扫描记录</CardTitle>
        <Button variant="outline" size="sm" disabled={records.length === 0} onClick={onUndoLast}>
          撤销最后一条
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>运单号</TableHead>
              <TableHead>原始输入</TableHead>
              <TableHead>快递类型</TableHead>
              <TableHead>扫描时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  暂无扫描记录
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono font-medium">{record.tracking_number}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{record.raw_input}</TableCell>
                  <TableCell>{record.courier_name || record.courier_id}</TableCell>
                  <TableCell>{record.created_at ? new Date(record.created_at).toLocaleTimeString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onDelete(record.id)}>
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Create summary dialog**

Create `frontend/app/scan-count/components/BatchSummaryDialog.tsx`:

```tsx
"use client"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

type BatchSummaryDialogProps = {
  open: boolean
  count: number
  courierName?: string
  onOpenChange: (open: boolean) => void
  onUndoBatch: () => Promise<void>
}

export function BatchSummaryDialog({ open, count, courierName, onOpenChange, onUndoBatch }: BatchSummaryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>本轮计数完成</AlertDialogTitle>
          <AlertDialogDescription>
            {courierName || "当前快递类型"} 本轮共扫描 {count} 件。记录已保存到出荷计数。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={async () => {
              await onUndoBatch()
              onOpenChange(false)
            }}
          >
            撤销本轮
          </AlertDialogCancel>
          <AlertDialogAction>确认</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 6: Create page**

Create `frontend/app/scan-count/page.tsx`:

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { useScanCount } from "@/hooks/use-scan-count"
import { ScanCountPanel } from "./components/ScanCountPanel"
import { ScanInputArea } from "./components/ScanInputArea"
import { ScanCountStats } from "./components/ScanCountStats"
import { ScanItemList } from "./components/ScanItemList"
import { BatchSummaryDialog } from "./components/BatchSummaryDialog"

export default function ScanCountPage() {
  const { courierTypes } = useCourierTypes()
  const scanCount = useScanCount()
  const [selectedCourierId, setSelectedCourierId] = useState<string>("")
  const [summaryOpen, setSummaryOpen] = useState(false)

  const activeCourierTypes = useMemo(() => {
    return courierTypes
      .filter((type) => Boolean(type.is_active))
      .filter((type) => !type.name.includes("未指定"))
  }, [courierTypes])

  const selectedCourier = activeCourierTypes.find((type) => type.id.toString() === selectedCourierId)

  useEffect(() => {
    scanCount.refreshTodayData()
  }, [scanCount.refreshTodayData])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (scanCount.status === "active") {
        event.preventDefault()
        event.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [scanCount.status])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">出荷计数</h1>
          <p className="text-sm text-muted-foreground">选择快递类型后使用扫码枪扫描运单号，系统会自动计数并防止当天重复。</p>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <div className="space-y-6 xl:col-span-1">
            <ScanCountPanel
              courierTypes={activeCourierTypes}
              selectedCourierId={selectedCourierId}
              status={scanCount.status}
              isLoading={scanCount.isLoading}
              onSelectCourier={setSelectedCourierId}
              onStart={() => selectedCourier && scanCount.start(selectedCourier)}
              onStop={() => {
                scanCount.stop()
                setSummaryOpen(true)
              }}
            />
          </div>

          <div className="space-y-6 xl:col-span-3">
            <ScanCountStats
              currentBatchCount={scanCount.currentBatch.length}
              todayCourierTotal={scanCount.todaySelectedCourierTotal}
              todayTotal={scanCount.stats.total}
            />

            <ScanInputArea
              isActive={scanCount.status === "active"}
              lastError={scanCount.lastError}
              onSubmitScan={scanCount.submitScan}
            />

            <ScanItemList
              records={scanCount.currentBatch}
              onDelete={scanCount.removeItem}
              onUndoLast={scanCount.undoLast}
            />
          </div>
        </div>

        <BatchSummaryDialog
          open={summaryOpen}
          count={scanCount.currentBatch.length}
          courierName={selectedCourier?.name}
          onOpenChange={setSummaryOpen}
          onUndoBatch={scanCount.deleteBatch}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 7: Run frontend lint/build**

Run:

```bash
cd frontend && pnpm lint
```

Expected:

```text
No ESLint warnings or errors
```

Then run:

```bash
cd frontend && pnpm build
```

Expected:

```text
Compiled successfully
```

- [ ] **Step 8: Commit**

```bash
git add frontend/app/scan-count frontend/hooks/use-scan-count.ts
git commit -m "feat: add scan count page"
```

## Task 8: Navigation and Translations

**Files:**
- Modify: `frontend/components/animated-menu.tsx`
- Modify: `frontend/public/locales/zh-CN/common.json`
- Modify: `frontend/public/locales/en/common.json`
- Modify: `frontend/public/locales/ja/common.json`

- [ ] **Step 1: Add navigation entry**

In `frontend/components/animated-menu.tsx`, update the import:

```tsx
import { BarChart, FileInput, Package, PieChart, Settings, BarChart2, ScanLine } from "lucide-react"
```

Insert this item after `/shipping-data`:

```tsx
{
  label: mounted ? t('scan_count') : '',
  href: "/scan-count",
  icon: <ScanLine className="h-5 w-5" />,
  gradient: gradients[2],
  iconColor: iconColors[2],
},
```

If the additional item shifts gradient indexes, keep any valid existing gradient/iconColor pair; visual exactness is not part of the feature contract.

- [ ] **Step 2: Add Chinese translations**

Add these keys to `frontend/public/locales/zh-CN/common.json`:

```json
{
  "scan_count": "出荷计数",
  "start_counting": "开始计数",
  "stop_counting": "停止计数",
  "current_batch": "本轮计数",
  "today_courier_total": "今日该快递类型",
  "today_scan_total": "今日全部扫码",
  "duplicate_tracking_number": "该运单号今天已扫描",
  "invalid_barcode": "运单号格式不正确，请重新扫描",
  "looks_like_non_shipping_barcode": "扫到的不是运单号，请重新扫描运单号条形码",
  "select_courier_first": "请先选择快递类型",
  "scan_input_active": "扫码枪接收中"
}
```

- [ ] **Step 3: Add English translations**

Add these keys to `frontend/public/locales/en/common.json`:

```json
{
  "scan_count": "Shipment Count",
  "start_counting": "Start Counting",
  "stop_counting": "Stop Counting",
  "current_batch": "Current Batch",
  "today_courier_total": "Today for This Courier",
  "today_scan_total": "Today Total Scans",
  "duplicate_tracking_number": "This tracking number was already scanned today",
  "invalid_barcode": "Invalid tracking number format. Please scan again",
  "looks_like_non_shipping_barcode": "This does not look like a waybill barcode. Please scan the tracking barcode",
  "select_courier_first": "Please select a courier type first",
  "scan_input_active": "Scanner input active"
}
```

- [ ] **Step 4: Add Japanese translations**

Add these keys to `frontend/public/locales/ja/common.json`:

```json
{
  "scan_count": "出荷カウント",
  "start_counting": "カウント開始",
  "stop_counting": "カウント停止",
  "current_batch": "今回のカウント",
  "today_courier_total": "本日の配送種別合計",
  "today_scan_total": "本日のスキャン合計",
  "duplicate_tracking_number": "この追跡番号は本日すでにスキャンされています",
  "invalid_barcode": "追跡番号の形式が正しくありません。再度スキャンしてください",
  "looks_like_non_shipping_barcode": "送り状番号ではない可能性があります。追跡番号のバーコードを再スキャンしてください",
  "select_courier_first": "先に配送種別を選択してください",
  "scan_input_active": "スキャナー入力中"
}
```

- [ ] **Step 5: Wire translations into page/components**

Replace hard-coded user-facing text in the new scan-count frontend files with `useTranslation("common")` and the keys above. Keep table headings that are already clear in Japanese/Chinese only if the rest of the project uses mixed labels in that component area.

- [ ] **Step 6: Run frontend lint/build**

Run:

```bash
cd frontend && pnpm lint
cd frontend && pnpm build
```

Expected:

```text
Compiled successfully
```

- [ ] **Step 7: Commit**

```bash
git add frontend/components/animated-menu.tsx frontend/public/locales/zh-CN/common.json frontend/public/locales/en/common.json frontend/public/locales/ja/common.json frontend/app/scan-count
git commit -m "feat: add scan count navigation"
```

## Task 9: Verification

**Files:**
- Review: all files changed by Tasks 1-8

- [ ] **Step 1: Run backend tests**

Run:

```bash
cd backend && npm test
```

Expected:

```text
Test Suites: all passing
```

- [ ] **Step 2: Run frontend verification**

Run:

```bash
cd frontend && pnpm build
```

Expected:

```text
Compiled successfully
```

- [ ] **Step 3: Start backend and frontend**

In one terminal:

```bash
cd backend && npm run dev
```

Expected:

```text
服务器运行中
```

In another terminal:

```bash
cd frontend && pnpm dev
```

Expected:

```text
Local: http://localhost:3000
```

- [ ] **Step 4: Manual scanner simulation**

Open `http://localhost:3000/scan-count`.

Perform:

1. Select a postal courier type such as `ゆうパケット (2CM)`.
2. Click `开始计数`.
3. Type `A680175257204A` into the page through keyboard or scanner and press Enter.
4. Confirm the list shows saved tracking number `680175257204`.
5. Type `A680175257204A` again and press Enter.
6. Confirm duplicate warning appears and the count does not increase.
7. Type `99-70-15` and press Enter.
8. Confirm non-waybill warning appears and the count does not increase.
9. Click `停止计数`.
10. Confirm summary dialog shows this batch total.

- [ ] **Step 5: Manual Sagawa simulation**

If a `佐川急便` courier type exists:

1. Select it and start a new batch.
2. Scan or type `A123456789012A`.
3. Confirm saved `tracking_number` remains `A123456789012A`.
4. Scan or type `123456789012`.
5. Confirm saved `tracking_number` remains `123456789012`.

- [ ] **Step 6: Database verification**

Run:

```bash
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT scan_date, courier_id, tracking_number, raw_input, batch_id FROM shipping_tracking_numbers ORDER BY id DESC LIMIT 10;"
```

Expected:

```text
scan_date   courier_id   tracking_number   raw_input           batch_id
2026-05-08  1            680175257204      A680175257204A      ...
```

- [ ] **Step 7: Final commit**

```bash
git status --short
git add backend frontend
git commit -m "feat: add shipment scan counting"
```

## Acceptance Criteria

- `/scan-count` exists and is reachable from the top navigation as `出荷计数`.
- User cannot start counting without choosing an active non-`未指定` courier type.
- Scanner input is captured while the page is active and uses Enter to submit each scan.
- Postal NW-7/Codabar values with `A/B/C/D` guard letters save without the leading/trailing guard letters.
- Sagawa values save exactly as scanned, including guard letters when present.
- Values containing `-`, such as `99-70-15`, are rejected with a rescan warning.
- Same-day duplicate tracking numbers are rejected in both frontend logic and DB unique constraint.
- Stopping a batch shows the batch total.
- User can delete an incorrectly scanned row or undo the latest scan.
- The feature stores scan records independently of `shipping_records`.

## Self-Review

- Spec coverage: the plan covers new tab/page, courier selection, scanner input, postal NW-7 stripping, Sagawa preservation, same-day duplicate checks, wrong-barcode warnings, deletion/undo, batch summary, and independent persistence.
- Placeholder scan: there are no unresolved placeholders or vague implementation-only steps.
- Type consistency: backend uses `tracking_number`, `raw_input`, `courier_id`, `scan_date`, `batch_id`; frontend API/hook/components use the same names.
- Scope check: syncing scan counts into existing `shipping_records` is intentionally out of scope because the chosen persistence mode is tracking-only.
