const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const frontendRoot = path.join(__dirname, "..")

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8")
}

const desktopPage = read("app/scan-count/page.tsx")
const workspace = read("app/scan-count/components/ScanCountWorkspace.tsx")
const mobilePage = read("app/scan-count/mobile/page.tsx")
const mobileLayout = read("app/scan-count/mobile/layout.tsx")
const mobileHeader = read("app/scan-count/components/ScanCountAppHeader.tsx")
const registrar = read("app/scan-count/components/ScanCountPwaRegistrar.tsx")

assert.match(desktopPage, /DashboardHeader/)
assert.match(desktopPage, /ScanCountWorkspace/)
assert.doesNotMatch(desktopPage, /useScanCount/)
assert.match(workspace, /export function ScanCountWorkspace/)
assert.match(workspace, /useScanCount/)
assert.match(workspace, /BatchSummaryDialog/)
assert.match(workspace, /TodayScanRecords/)
assert.match(mobilePage, /ScanCountAppHeader/)
assert.match(mobilePage, /ScanCountPwaRegistrar/)
assert.match(mobilePage, /showHeaderText=\{false\}/)
assert.doesNotMatch(mobilePage, /DashboardHeader/)
assert.match(mobileLayout, /manifest: SCAN_COUNT_PWA_MANIFEST_PATH/)
assert.match(mobileLayout, /appleWebApp/)
assert.match(mobileHeader, /navigator\.onLine/)
assert.match(mobileHeader, /SCAN_COUNT_WEB_ROUTE/)
assert.match(registrar, /navigator\.serviceWorker\.register/)
assert.match(registrar, /SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE/)

console.log("scan-count route structure tests passed")
