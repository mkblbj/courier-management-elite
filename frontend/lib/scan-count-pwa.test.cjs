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

const pwa = loadTsModule("scan-count-pwa.ts")

assert.equal(pwa.SCAN_COUNT_WEB_ROUTE, "/scan-count")
assert.equal(pwa.SCAN_COUNT_MOBILE_ROUTE, "/scan-count/mobile")
assert.equal(pwa.SCAN_COUNT_PWA_MANIFEST_PATH, "/scan-count/manifest.webmanifest")
assert.equal(pwa.SCAN_COUNT_PWA_SERVICE_WORKER_PATH, "/scan-count-sw.js")
assert.equal(pwa.SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE, "/scan-count/mobile/")
assert.equal(pwa.SCAN_COUNT_PWA_CACHE_NAME, "scan-count-pwa-v1")
assert.equal(pwa.isScanCountApiPath("/api/scan-counts"), true)
assert.equal(pwa.isScanCountApiPath("/api/scan-counts/stats"), true)
assert.equal(pwa.isScanCountApiPath("/api/proxy/scan-counts"), true)
assert.equal(pwa.isScanCountApiPath("/api/proxy/scan-counts/stats"), true)
assert.equal(pwa.isScanCountApiPath("/scan-count/mobile"), false)

console.log("scan-count-pwa constants tests passed")
