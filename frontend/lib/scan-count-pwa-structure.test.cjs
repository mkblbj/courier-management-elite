const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const frontendRoot = path.join(__dirname, "..")

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8")
}

const desktopPage = read("app/scan-count/page.tsx")
const workspace = read("app/scan-count/components/ScanCountWorkspace.tsx")

assert.match(desktopPage, /DashboardHeader/)
assert.match(desktopPage, /ScanCountWorkspace/)
assert.doesNotMatch(desktopPage, /useScanCount/)
assert.match(workspace, /export function ScanCountWorkspace/)
assert.match(workspace, /useScanCount/)
assert.match(workspace, /BatchSummaryDialog/)
assert.match(workspace, /TodayScanRecords/)

console.log("scan-count route structure tests passed")
