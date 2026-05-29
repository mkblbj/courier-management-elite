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
