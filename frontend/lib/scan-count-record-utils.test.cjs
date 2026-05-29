const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")

function loadTsModule(relativePath) {
  const filename = path.join(__dirname, relativePath)
  const source = fs.readFileSync(filename, "utf8")
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText

  const module = { exports: {} }
  const fn = new Function("module", "exports", "require", "__dirname", "__filename", compiled)
  fn(module, module.exports, require, __dirname, filename)
  return module.exports
}

const { filterScanRecords, summarizeScanRecordsByCourier } = loadTsModule("scan-count-record-utils.ts")

const records = [
  {
    id: 1,
    tracking_number: "680175257204",
    raw_input: "A680175257204A",
    courier_id: 10,
    courier_name: "ゆうパケット",
    scan_date: "2026-05-12",
    batch_id: "batch-a",
    created_at: "2026-05-12T01:00:00.000Z",
  },
  {
    id: 2,
    tracking_number: "SAGAWA001",
    raw_input: "SAGAWA001",
    courier_id: 20,
    courier_name: "佐川急便",
    scan_date: "2026-05-12",
    batch_id: "batch-b",
    created_at: "2026-05-12T02:00:00.000Z",
  },
  {
    id: 3,
    tracking_number: "680175999999",
    raw_input: "A680175999999A",
    courier_id: 10,
    courier_name: "ゆうパケット",
    scan_date: "2026-05-12",
    batch_id: "batch-c",
    created_at: "2026-05-12T03:00:00.000Z",
  },
]

assert.deepEqual(
  filterScanRecords(records, { courierId: "10", search: "999" }).map((record) => record.id),
  [3]
)

assert.deepEqual(summarizeScanRecordsByCourier(records), [
  { courier_id: 10, courier_name: "ゆうパケット", total: 2 },
  { courier_id: 20, courier_name: "佐川急便", total: 1 },
])

console.log("scan-count-record-utils tests passed")
