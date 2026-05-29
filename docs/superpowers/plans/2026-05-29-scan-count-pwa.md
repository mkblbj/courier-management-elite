# Scan Count PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an installable mobile PWA entry at `/scan-count/mobile` while keeping the existing `/scan-count` web page and desktop workflow unchanged.

**Architecture:** Extract the current scan-count page body into a shared `ScanCountWorkspace` client component. Keep `/scan-count` as the desktop web shell with `DashboardHeader`, and add `/scan-count/mobile` as the PWA shell with a lightweight mobile header, service worker registration, manifest, icons, and static asset caching. API calls remain network-only and continue to use the existing scan-count backend.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, existing shadcn-style UI components, Web App Manifest, browser Service Worker API, Node CJS structural tests.

---

## File Structure

- Create `frontend/lib/scan-count-pwa.ts`
  - Owns route, manifest, service worker path, scope, and cache constants.
  - Provides a tiny API-path predicate used by tests and documentation.
- Create `frontend/lib/scan-count-pwa.test.cjs`
  - Verifies the PWA constants lock to `/scan-count/mobile`.
- Create `frontend/lib/scan-count-pwa-structure.test.cjs`
  - Verifies `/scan-count` keeps `DashboardHeader`, the mobile page omits it, and both routes use the shared workspace.
- Create `frontend/lib/scan-count-pwa-assets.test.cjs`
  - Verifies manifest fields, icon files, service worker API exclusions, and `next.config.mjs` headers.
- Create `frontend/app/scan-count/components/ScanCountWorkspace.tsx`
  - Contains the current scan-count page logic and UI body.
  - Accepts `showHeaderText` so `/scan-count/mobile` can avoid a duplicate title.
- Modify `frontend/app/scan-count/page.tsx`
  - Keep the existing desktop shell and `DashboardHeader`.
  - Render `ScanCountWorkspace`.
- Create `frontend/app/scan-count/mobile/layout.tsx`
  - Defines mobile route metadata, manifest, icons, Apple web app settings, and viewport theme color.
- Create `frontend/app/scan-count/mobile/page.tsx`
  - Renders the mobile PWA shell and shared workspace.
- Create `frontend/app/scan-count/components/ScanCountAppHeader.tsx`
  - Lightweight sticky mobile header with date, online/offline state, and web-version link.
- Create `frontend/app/scan-count/components/ScanCountPwaRegistrar.tsx`
  - Registers `public/scan-count-sw.js` only from the mobile route.
- Create `frontend/public/scan-count/manifest.webmanifest`
  - Mobile PWA manifest.
- Create `frontend/public/scan-count/icons/icon-192.svg`
  - 192px app icon.
- Create `frontend/public/scan-count/icons/icon-512.svg`
  - 512px app icon.
- Create `frontend/public/scan-count/icons/maskable.svg`
  - Maskable app icon.
- Create `frontend/public/scan-count-sw.js`
  - Service worker with static shell caching and network-only API requests.
- Modify `frontend/next.config.mjs`
  - Add headers for service worker and manifest.
- Modify `frontend/public/locales/zh-CN/common.json`
  - Add mobile header labels.
- Modify `frontend/public/locales/en/common.json`
  - Add mobile header labels.
- Modify `frontend/public/locales/ja/common.json`
  - Add mobile header labels.

---

## Task 1: PWA Constants

**Files:**
- Create: `frontend/lib/scan-count-pwa.test.cjs`
- Create: `frontend/lib/scan-count-pwa.ts`

- [ ] **Step 1: Write the failing constants test**

Create `frontend/lib/scan-count-pwa.test.cjs`:

```js
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
```

- [ ] **Step 2: Run the constants test and verify it fails**

Run:

```bash
node lib/scan-count-pwa.test.cjs
```

Expected: FAIL with `ENOENT` for `scan-count-pwa.ts`.

- [ ] **Step 3: Add the PWA constants**

Create `frontend/lib/scan-count-pwa.ts`:

```ts
export const SCAN_COUNT_WEB_ROUTE = "/scan-count"
export const SCAN_COUNT_MOBILE_ROUTE = "/scan-count/mobile"
export const SCAN_COUNT_PWA_MANIFEST_PATH = "/scan-count/manifest.webmanifest"
export const SCAN_COUNT_PWA_SERVICE_WORKER_PATH = "/scan-count-sw.js"
export const SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE = "/scan-count/mobile/"
export const SCAN_COUNT_PWA_CACHE_NAME = "scan-count-pwa-v1"

const SCAN_COUNT_API_PREFIXES = [
  "/api/scan-counts",
  "/api/proxy/scan-counts",
]

export function isScanCountApiPath(pathname: string) {
  return SCAN_COUNT_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}
```

- [ ] **Step 4: Run the constants test and verify it passes**

Run:

```bash
node lib/scan-count-pwa.test.cjs
```

Expected: PASS with `scan-count-pwa constants tests passed`.

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/scan-count-pwa.test.cjs frontend/lib/scan-count-pwa.ts
git commit -m "test: add scan count pwa constants"
```

---

## Task 2: Shared Scan Count Workspace

**Files:**
- Create: `frontend/lib/scan-count-pwa-structure.test.cjs`
- Create: `frontend/app/scan-count/components/ScanCountWorkspace.tsx`
- Modify: `frontend/app/scan-count/page.tsx`

- [ ] **Step 1: Write the failing route structure test**

Create `frontend/lib/scan-count-pwa-structure.test.cjs`:

```js
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
```

- [ ] **Step 2: Run the structure test and verify it fails**

Run:

```bash
node lib/scan-count-pwa-structure.test.cjs
```

Expected: FAIL with `ENOENT` for `app/scan-count/components/ScanCountWorkspace.tsx`.

- [ ] **Step 3: Create the shared workspace component**

Create `frontend/app/scan-count/components/ScanCountWorkspace.tsx`:

```tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCourierTypes } from "@/hooks/use-courier-types"
import { useScanCount } from "@/hooks/use-scan-count"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BatchSummaryDialog } from "./BatchSummaryDialog"
import { ScanCountPanel } from "./ScanCountPanel"
import { ScanCountStats } from "./ScanCountStats"
import { ScanInputArea } from "./ScanInputArea"
import { ScanItemList } from "./ScanItemList"
import { TodayScanRecords } from "./TodayScanRecords"

type ScanCountWorkspaceProps = {
  showHeaderText?: boolean
  className?: string
}

export function ScanCountWorkspace({ showHeaderText = true, className }: ScanCountWorkspaceProps) {
  const { t } = useTranslation("common")
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
    <main className={cn("container mx-auto space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-6", className)}>
      {showHeaderText && (
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t("scan_count")}</h1>
          <p className="text-sm text-muted-foreground">{t("scan_count_description")}</p>
        </div>
      )}

      <Tabs defaultValue="scan" className="space-y-4">
        <TabsList className="grid h-12 w-full grid-cols-2 sm:w-[360px]">
          <TabsTrigger value="scan" className="h-10 text-base sm:text-sm">
            {t("scan_tab")}
          </TabsTrigger>
          <TabsTrigger value="today" className="h-10 text-base sm:text-sm">
            {t("today_records_tab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-4 xl:gap-6">
            <div className="space-y-4 xl:col-span-1">
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

            <div className="space-y-4 xl:col-span-3 xl:space-y-6">
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
        </TabsContent>

        <TabsContent value="today">
          <TodayScanRecords
            records={scanCount.todayRecords}
            courierTypes={activeCourierTypes}
            isLoading={scanCount.isLoading}
            onRefresh={scanCount.refreshTodayData}
            onDelete={scanCount.deleteTodayRecord}
          />
        </TabsContent>
      </Tabs>

      <BatchSummaryDialog
        open={summaryOpen}
        count={scanCount.currentBatch.length}
        courierName={selectedCourier?.name}
        onOpenChange={setSummaryOpen}
        onUndoBatch={async () => {
          await scanCount.deleteBatch()
        }}
      />
    </main>
  )
}
```

- [ ] **Step 4: Replace the desktop page with the stable shell**

Replace `frontend/app/scan-count/page.tsx` with:

```tsx
"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ScanCountWorkspace } from "./components/ScanCountWorkspace"

export default function ScanCountPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <ScanCountWorkspace />
    </div>
  )
}
```

- [ ] **Step 5: Run the structure test and verify it passes**

Run:

```bash
node lib/scan-count-pwa-structure.test.cjs
```

Expected: PASS with `scan-count route structure tests passed`.

- [ ] **Step 6: Run a build check for the extraction**

Run:

```bash
NEXT_DIST_DIR=.next-dev-3002 pnpm build
```

Expected: build succeeds and `/scan-count` appears in the route list.

- [ ] **Step 7: Commit**

```bash
git add frontend/lib/scan-count-pwa-structure.test.cjs frontend/app/scan-count/page.tsx frontend/app/scan-count/components/ScanCountWorkspace.tsx
git commit -m "refactor: share scan count workspace"
```

---

## Task 3: Mobile PWA Route Shell

**Files:**
- Modify: `frontend/lib/scan-count-pwa-structure.test.cjs`
- Create: `frontend/app/scan-count/mobile/layout.tsx`
- Create: `frontend/app/scan-count/mobile/page.tsx`
- Create: `frontend/app/scan-count/components/ScanCountAppHeader.tsx`
- Create: `frontend/app/scan-count/components/ScanCountPwaRegistrar.tsx`
- Modify: `frontend/public/locales/zh-CN/common.json`
- Modify: `frontend/public/locales/en/common.json`
- Modify: `frontend/public/locales/ja/common.json`

- [ ] **Step 1: Extend the structure test for the mobile route**

Replace `frontend/lib/scan-count-pwa-structure.test.cjs` with:

```js
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
```

- [ ] **Step 2: Run the structure test and verify it fails**

Run:

```bash
node lib/scan-count-pwa-structure.test.cjs
```

Expected: FAIL with `ENOENT` for `app/scan-count/mobile/page.tsx`.

- [ ] **Step 3: Add mobile route metadata**

Create `frontend/app/scan-count/mobile/layout.tsx`:

```tsx
import type React from "react"
import type { Metadata, Viewport } from "next"
import {
  SCAN_COUNT_PWA_MANIFEST_PATH,
  SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE,
} from "@/lib/scan-count-pwa"

export const metadata: Metadata = {
  title: "出荷计数",
  description: "移动端出荷计数工具",
  manifest: SCAN_COUNT_PWA_MANIFEST_PATH,
  appleWebApp: {
    capable: true,
    title: "出荷计数",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/scan-count/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/scan-count/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/scan-count/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-scope": SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE,
  },
}

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
}

export default function ScanCountMobileLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

- [ ] **Step 4: Add the mobile app header**

Create `frontend/app/scan-count/components/ScanCountAppHeader.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ExternalLink, Wifi, WifiOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { SCAN_COUNT_WEB_ROUTE } from "@/lib/scan-count-pwa"
import { cn } from "@/lib/utils"

export function ScanCountAppHeader() {
  const { t } = useTranslation("common")
  const [mounted, setMounted] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine)

    setMounted(true)
    updateOnlineState()
    window.addEventListener("online", updateOnlineState)
    window.addEventListener("offline", updateOnlineState)

    return () => {
      window.removeEventListener("online", updateOnlineState)
      window.removeEventListener("offline", updateOnlineState)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-16 w-full max-w-screen-xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold leading-tight">{t("scan_count")}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{mounted ? format(new Date(), "yyyy-MM-dd") : ""}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                isOnline ? "border-green-200 text-green-700" : "border-red-200 text-red-700",
              )}
            >
              {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isOnline ? t("scan_count_mobile_online") : t("scan_count_mobile_offline")}
            </span>
          </div>
        </div>

        <Button asChild variant="outline" size="sm" className="h-9 shrink-0">
          <Link href={SCAN_COUNT_WEB_ROUTE}>
            <ExternalLink className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">{t("scan_count_web_version")}</span>
            <span className="sm:hidden">{t("back")}</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Add the service worker registrar**

Create `frontend/app/scan-count/components/ScanCountPwaRegistrar.tsx`:

```tsx
"use client"

import { useEffect } from "react"
import {
  SCAN_COUNT_PWA_SERVICE_WORKER_PATH,
  SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE,
} from "@/lib/scan-count-pwa"

export function ScanCountPwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker
      .register(SCAN_COUNT_PWA_SERVICE_WORKER_PATH, {
        scope: SCAN_COUNT_PWA_SERVICE_WORKER_SCOPE,
        updateViaCache: "none",
      })
      .catch((error) => {
        console.error("出荷计数 PWA 注册失败:", error)
      })
  }, [])

  return null
}
```

- [ ] **Step 6: Add the mobile page**

Create `frontend/app/scan-count/mobile/page.tsx`:

```tsx
import { ScanCountAppHeader } from "../components/ScanCountAppHeader"
import { ScanCountPwaRegistrar } from "../components/ScanCountPwaRegistrar"
import { ScanCountWorkspace } from "../components/ScanCountWorkspace"

export default function ScanCountMobilePage() {
  return (
    <div className="min-h-screen bg-background">
      <ScanCountPwaRegistrar />
      <ScanCountAppHeader />
      <ScanCountWorkspace
        showHeaderText={false}
        className="pb-[calc(env(safe-area-inset-bottom)+1rem)]"
      />
    </div>
  )
}
```

- [ ] **Step 7: Add locale labels**

Add these keys to `frontend/public/locales/zh-CN/common.json` near the existing scan-count keys:

```json
  "scan_count_mobile_online": "在线",
  "scan_count_mobile_offline": "离线",
  "scan_count_web_version": "网页入口",
```

Add these keys to `frontend/public/locales/en/common.json` near the existing scan-count keys:

```json
  "scan_count_mobile_online": "Online",
  "scan_count_mobile_offline": "Offline",
  "scan_count_web_version": "Web version",
```

Add these keys to `frontend/public/locales/ja/common.json` near the existing scan-count keys:

```json
  "scan_count_mobile_online": "オンライン",
  "scan_count_mobile_offline": "オフライン",
  "scan_count_web_version": "Web版",
```

- [ ] **Step 8: Run the structure test and verify it passes**

Run:

```bash
node lib/scan-count-pwa-structure.test.cjs
```

Expected: PASS with `scan-count route structure tests passed`.

- [ ] **Step 9: Run a build check for the route**

Run:

```bash
NEXT_DIST_DIR=.next-dev-3002 pnpm build
```

Expected: build succeeds and both `/scan-count` and `/scan-count/mobile` appear in the route list.

- [ ] **Step 10: Commit**

```bash
git add frontend/lib/scan-count-pwa-structure.test.cjs frontend/app/scan-count/mobile frontend/app/scan-count/components/ScanCountAppHeader.tsx frontend/app/scan-count/components/ScanCountPwaRegistrar.tsx frontend/public/locales/zh-CN/common.json frontend/public/locales/en/common.json frontend/public/locales/ja/common.json
git commit -m "feat: add scan count mobile pwa route"
```

---

## Task 4: Manifest, Icons, and Service Worker

**Files:**
- Create: `frontend/lib/scan-count-pwa-assets.test.cjs`
- Create: `frontend/public/scan-count/manifest.webmanifest`
- Create: `frontend/public/scan-count/icons/icon-192.svg`
- Create: `frontend/public/scan-count/icons/icon-512.svg`
- Create: `frontend/public/scan-count/icons/maskable.svg`
- Create: `frontend/public/scan-count-sw.js`
- Modify: `frontend/next.config.mjs`

- [ ] **Step 1: Write the failing PWA asset test**

Create `frontend/lib/scan-count-pwa-assets.test.cjs`:

```js
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const frontendRoot = path.join(__dirname, "..")

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8")
}

function existsPublicPath(publicPath) {
  return fs.existsSync(path.join(frontendRoot, "public", publicPath.replace(/^\//, "")))
}

const manifest = JSON.parse(read("public/scan-count/manifest.webmanifest"))
const sw = read("public/scan-count-sw.js")
const nextConfig = read("next.config.mjs")

assert.equal(manifest.name, "出荷计数")
assert.equal(manifest.short_name, "出荷计数")
assert.equal(manifest.start_url, "/scan-count/mobile")
assert.equal(manifest.scope, "/scan-count/mobile")
assert.equal(manifest.display, "standalone")
assert.equal(manifest.orientation, "portrait")
assert.equal(manifest.theme_color, "#16a34a")
assert.ok(manifest.icons.some((icon) => icon.src === "/scan-count/icons/icon-192.svg" && icon.sizes === "192x192"))
assert.ok(manifest.icons.some((icon) => icon.src === "/scan-count/icons/icon-512.svg" && icon.sizes === "512x512"))
assert.ok(manifest.icons.some((icon) => icon.src === "/scan-count/icons/maskable.svg" && icon.purpose.includes("maskable")))
manifest.icons.forEach((icon) => assert.equal(existsPublicPath(icon.src), true))

assert.match(sw, /scan-count-pwa-v1/)
assert.match(sw, /\/scan-count\/mobile/)
assert.match(sw, /request\.method !== "GET"/)
assert.match(sw, /\/api\/scan-counts/)
assert.match(sw, /\/api\/proxy\/scan-counts/)
assert.match(sw, /isApiRequest/)
assert.match(sw, /caches\.open/)
assert.match(sw, /networkFirstNavigation/)
assert.doesNotMatch(sw, /cache\.put\(request, response\.clone\(\)\).*api/s)

assert.match(nextConfig, /source: '\/scan-count-sw\.js'/)
assert.match(nextConfig, /Service-Worker-Allowed/)
assert.match(nextConfig, /source: '\/scan-count\/manifest\.webmanifest'/)
assert.match(nextConfig, /application\/manifest\+json/)

console.log("scan-count pwa asset tests passed")
```

- [ ] **Step 2: Run the PWA asset test and verify it fails**

Run:

```bash
node lib/scan-count-pwa-assets.test.cjs
```

Expected: FAIL with `ENOENT` for `public/scan-count/manifest.webmanifest`.

- [ ] **Step 3: Add the web app manifest**

Create `frontend/public/scan-count/manifest.webmanifest`:

```json
{
  "name": "出荷计数",
  "short_name": "出荷计数",
  "description": "移动端出荷计数工具",
  "start_url": "/scan-count/mobile",
  "scope": "/scan-count/mobile",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#f8fafc",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "/scan-count/icons/icon-192.svg",
      "sizes": "192x192",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "/scan-count/icons/icon-512.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "/scan-count/icons/maskable.svg",
      "sizes": "512x512",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 4: Add the 192 icon**

Create `frontend/public/scan-count/icons/icon-192.svg`:

```xml
<svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" rx="42" fill="#16A34A"/>
  <rect x="39" y="52" width="114" height="88" rx="14" fill="#FFFFFF"/>
  <path d="M57 76H135" stroke="#16A34A" stroke-width="10" stroke-linecap="round"/>
  <path d="M57 98H118" stroke="#16A34A" stroke-width="10" stroke-linecap="round"/>
  <path d="M57 120H96" stroke="#16A34A" stroke-width="10" stroke-linecap="round"/>
  <path d="M37 38H62M37 38V63" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
  <path d="M155 38H130M155 38V63" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
  <path d="M37 154H62M37 154V129" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
  <path d="M155 154H130M155 154V129" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 5: Add the 512 icon**

Create `frontend/public/scan-count/icons/icon-512.svg`:

```xml
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#16A34A"/>
  <rect x="104" y="139" width="304" height="234" rx="36" fill="#FFFFFF"/>
  <path d="M152 203H360" stroke="#16A34A" stroke-width="28" stroke-linecap="round"/>
  <path d="M152 261H314" stroke="#16A34A" stroke-width="28" stroke-linecap="round"/>
  <path d="M152 319H256" stroke="#16A34A" stroke-width="28" stroke-linecap="round"/>
  <path d="M99 101H166M99 101V168" stroke="#FFFFFF" stroke-width="32" stroke-linecap="round"/>
  <path d="M413 101H346M413 101V168" stroke="#FFFFFF" stroke-width="32" stroke-linecap="round"/>
  <path d="M99 411H166M99 411V344" stroke="#FFFFFF" stroke-width="32" stroke-linecap="round"/>
  <path d="M413 411H346M413 411V344" stroke="#FFFFFF" stroke-width="32" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 6: Add the maskable icon**

Create `frontend/public/scan-count/icons/maskable.svg`:

```xml
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#16A34A"/>
  <rect x="124" y="154" width="264" height="204" rx="34" fill="#FFFFFF"/>
  <path d="M166 211H346" stroke="#16A34A" stroke-width="26" stroke-linecap="round"/>
  <path d="M166 260H306" stroke="#16A34A" stroke-width="26" stroke-linecap="round"/>
  <path d="M166 309H256" stroke="#16A34A" stroke-width="26" stroke-linecap="round"/>
  <path d="M120 120H180M120 120V180" stroke="#FFFFFF" stroke-width="30" stroke-linecap="round"/>
  <path d="M392 120H332M392 120V180" stroke="#FFFFFF" stroke-width="30" stroke-linecap="round"/>
  <path d="M120 392H180M120 392V332" stroke="#FFFFFF" stroke-width="30" stroke-linecap="round"/>
  <path d="M392 392H332M392 392V332" stroke="#FFFFFF" stroke-width="30" stroke-linecap="round"/>
</svg>
```

- [ ] **Step 7: Add the service worker**

Create `frontend/public/scan-count-sw.js`:

```js
const CACHE_NAME = "scan-count-pwa-v1"
const APP_SHELL_URLS = [
  "/scan-count/mobile",
  "/scan-count/manifest.webmanifest",
  "/scan-count/icons/icon-192.svg",
  "/scan-count/icons/icon-512.svg",
  "/scan-count/icons/maskable.svg",
]
const API_PREFIXES = [
  "/api/scan-counts",
  "/api/proxy/scan-counts",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("scan-count-pwa-") && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isApiRequest(url) {
  return API_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    (
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/scan-count/icons/") ||
      url.pathname === "/scan-count/manifest.webmanifest"
    )
  )
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response && response.status === 200) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }

  return response
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request)
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put("/scan-count/mobile", response.clone())
    }
    return response
  } catch (error) {
    const cached = await caches.match("/scan-count/mobile")
    if (cached) return cached
    throw error
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== "GET") return
  if (url.origin !== self.location.origin) return
  if (isApiRequest(url)) return

  if (request.mode === "navigate" && url.pathname.startsWith("/scan-count/mobile")) {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request))
  }
})
```

- [ ] **Step 8: Add manifest and service worker headers**

Modify `frontend/next.config.mjs` so `headers()` returns these route-specific headers before the existing `/:path*` entry:

```js
  async headers() {
    return [
      {
        source: '/scan-count-sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/scan-count/mobile/'
          }
        ],
      },
      {
        source: '/scan-count/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json; charset=utf-8'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache'
          }
        ],
      },
      {
        source: '/:path*',
        headers: [
          // 注意：这是一个非常宽松的CSP配置，仅用于开发和测试
          // 生产环境中应该使用更严格的配置
          {
            key: 'Content-Security-Policy',
            value: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Feature-Policy',
            value: 'mixed-content *'
          }
        ],
      },
    ]
  },
```

- [ ] **Step 9: Run the PWA asset test and verify it passes**

Run:

```bash
node lib/scan-count-pwa-assets.test.cjs
```

Expected: PASS with `scan-count pwa asset tests passed`.

- [ ] **Step 10: Run all frontend scan-count tests**

Run:

```bash
node lib/audio-feedback.test.cjs
node lib/courier-barcode-rule.test.cjs
node lib/scan-count-record-utils.test.cjs
node lib/scan-count-pwa.test.cjs
node lib/scan-count-pwa-structure.test.cjs
node lib/scan-count-pwa-assets.test.cjs
```

Expected: all six scripts pass.

- [ ] **Step 11: Commit**

```bash
git add frontend/lib/scan-count-pwa-assets.test.cjs frontend/public/scan-count frontend/public/scan-count-sw.js frontend/next.config.mjs
git commit -m "feat: add scan count pwa assets"
```

---

## Task 5: Full Verification

**Files:**
- No source changes.

- [ ] **Step 1: Run backend tests**

Run:

```bash
npm test -- --runInBand
```

Expected in `backend`: 5 test suites pass and 23 tests pass.

- [ ] **Step 2: Run frontend scan-count tests**

Run:

```bash
node lib/audio-feedback.test.cjs
node lib/courier-barcode-rule.test.cjs
node lib/scan-count-record-utils.test.cjs
node lib/scan-count-pwa.test.cjs
node lib/scan-count-pwa-structure.test.cjs
node lib/scan-count-pwa-assets.test.cjs
```

Expected in `frontend`: all six scripts pass.

- [ ] **Step 3: Run frontend production build**

Run:

```bash
NEXT_DIST_DIR=.next-dev-3002 pnpm build
```

Expected in `frontend`: build succeeds and the route list includes both `/scan-count` and `/scan-count/mobile`.

- [ ] **Step 4: Check the service worker and manifest manually in development**

Run:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000/scan-count/mobile
```

Expected:

- The page shows the lightweight mobile header.
- The page does not show `DashboardHeader`.
- Chrome DevTools Application panel shows `/scan-count/manifest.webmanifest`.
- Chrome DevTools Application panel shows `/scan-count-sw.js`.
- The service worker scope is `/scan-count/mobile/`.

- [ ] **Step 5: Check the desktop route manually**

Open:

```text
http://localhost:3000/scan-count
```

Expected:

- The page still shows `DashboardHeader`.
- The scan tab and today-records tab are available.
- The page does not register `/scan-count-sw.js` from this route.

- [ ] **Step 6: Check API network-only behavior**

In Chrome DevTools Network panel on `/scan-count/mobile`, scan or manually submit one tracking number against a running backend.

Expected:

- `POST /api/scan-counts` or `POST /api/proxy/scan-counts` is visible in Network.
- The response comes from the network, not from service worker cache.
- The scan result updates the current batch.

- [ ] **Step 7: Commit the verified final state if any verification-only file changed**

Run:

```bash
git status --short
```

Expected: no source changes. If `frontend/tsconfig.json` changed because Next.js added a new temporary build directory, remove only that new temporary include entry and rerun `NEXT_DIST_DIR=.next-dev-3002 pnpm build`.

---

## Self-Review

- Spec coverage:
  - `/scan-count/mobile` route: Task 3.
  - Existing `/scan-count` unchanged with `DashboardHeader`: Task 2 and Task 5.
  - Manifest, icons, theme color: Task 4.
  - Service worker scoped to mobile route: Task 3 and Task 4.
  - API network-only behavior: Task 4 and Task 5.
  - Current scan functionality reused: Task 2.
  - Build and tests: Task 5.
- Placeholder scan:
  - No placeholder markers or open-ended implementation steps are intentionally present.
  - Every created file has concrete content.
- Type consistency:
  - `ScanCountWorkspace` exports a named component and is imported by both route pages.
  - PWA constants are defined once in `frontend/lib/scan-count-pwa.ts` and imported by route metadata, header, and registrar.
  - Test names and file paths match the files introduced in the tasks.
