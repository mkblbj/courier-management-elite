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

const { parseBarcode } = loadTsModule("barcode-parser.ts")
const { resolveCourierBarcodeRuleType } = loadTsModule("courier-barcode-rule.ts")

assert.equal(
  resolveCourierBarcodeRuleType({
    name: "クリップポスト (3CM)",
    code: "cp3",
    barcode_rule_type: "generic",
  }),
  "postal"
)

assert.equal(
  resolveCourierBarcodeRuleType({
    name: "佐川急便",
    code: "sagawa",
    barcode_rule_type: "sagawa",
  }),
  "sagawa"
)

assert.equal(
  resolveCourierBarcodeRuleType({
    name: "その他",
    code: "other",
    barcode_rule_type: "generic",
  }),
  "generic"
)

const clipPostRule = resolveCourierBarcodeRuleType({
  name: "クリップポスト (3CM)",
  code: "cp3",
  barcode_rule_type: "generic",
})

assert.deepEqual(parseBarcode("A680404812824A", clipPostRule), {
  ok: true,
  rawInput: "A680404812824A",
  trackingNumber: "680404812824",
})

console.log("courier-barcode-rule tests passed")
