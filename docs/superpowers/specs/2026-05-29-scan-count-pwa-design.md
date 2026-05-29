# 出荷计数独立 PWA 设计

## 目标

将现有 `/scan-count` 出荷计数页面做成可安装的移动端 PWA。手机用户从桌面图标进入后，直接打开轻量的出荷计数工具，不需要先进入完整的出荷出力系统。

## 背景

当前仓库已经有独立的 `/scan-count` 页面、扫码计数 API、今日记录、重复扫描保护、条码规则和音频反馈。这个设计不重写计数业务，只把该页面独立成适合移动端安装使用的应用入口。

## 范围

包含：

- 为出荷计数提供独立 PWA 安装入口。
- 安装后默认打开 `/scan-count`。
- 在 `/scan-count` 内隐藏主系统顶部导航，使用轻量应用头部。
- 增加 PWA manifest、应用图标、移动端主题色和 service worker 注册。
- 保持扫码保存、今日记录和统计数据走现有后端 API。
- 增加 PWA 相关基础验证。

不包含：

- 不新建单独仓库或单独部署服务。
- 不重写后端扫码 API。
- 不做离线扫码保存队列。
- 不改变其他页面的主系统导航。

## 推荐方案

在现有 Next.js 前端内，为 `/scan-count` 增加专用 PWA 壳层。

原因：

- 复用现有 API、国际化、样式和扫码组件，改动范围小。
- 手机安装后能像独立工具一样启动。
- 不需要维护第二套构建和部署。
- 后续如果出荷计数继续变复杂，也可以再拆成单独应用。

## 页面体验

`/scan-count` 页面进入后显示专用轻量头部，不显示 `DashboardHeader` 和主系统菜单。

轻量头部包含：

- 应用名称：出荷计数。
- 当前日期。
- 网络状态提示。
- 可选的返回主系统入口，放在不干扰扫码的位置。

主体继续保留现有功能：

- 扫描页签：快递选择、开始/停止、扫码输入、手动输入、当前批次、撤销。
- 今日记录页签：今日全部记录、按快递筛选、搜索、删除。
- 批次结束汇总弹窗。

移动端优先处理：

- 首屏优先显示快递选择、开始按钮和当前批次数。
- 按钮高度保持适合手指点击。
- 统计卡片不挤压关键数字。
- 扫码输入区域保持自动聚焦和失焦恢复。

## PWA 元数据

新增出荷计数专用 manifest，关键字段：

- `name`: `出荷计数`
- `short_name`: `出荷计数`
- `start_url`: `/scan-count`
- `scope`: `/scan-count`
- `display`: `standalone`
- `theme_color`: 与出荷计数页面主色一致
- `background_color`: 页面背景色
- `icons`: 192、512、maskable 图标

实现上优先在 `/scan-count` 路由 metadata 中挂载专用 manifest 链接，避免把主系统默认安装入口也改成出荷计数。如果 Next.js 当前版本对嵌套 manifest 支持不足，则使用 `public/scan-count/manifest.webmanifest` 加路由 metadata 的 `manifest` 字段。

## Service Worker

新增 `public/scan-count-sw.js`，只在 `/scan-count` 页面注册，scope 为 `/scan-count/`。

缓存策略：

- 应用壳和静态资源使用 cache-first 加版本号缓存。
- `/scan-count` 导航请求可使用 network-first，网络失败时回退到已缓存页面。
- API 请求全部 network-only，不缓存 `POST /api/scan-counts`、删除、批次删除和统计结果。
- 激活新版本时清理旧缓存。

这样手机可以更快打开工具，但不会把扫码数据误判为已保存。

## 组件结构

新增：

- `frontend/app/scan-count/layout.tsx`
  - 设置出荷计数专用 metadata。
  - 提供独立页面外壳。
- `frontend/app/scan-count/components/ScanCountAppHeader.tsx`
  - 轻量头部、日期和网络状态。
- `frontend/app/scan-count/components/ScanCountPwaRegistrar.tsx`
  - 注册 service worker。
  - 可记录安装模式和浏览器支持状态。
- `frontend/public/scan-count/manifest.webmanifest`
  - PWA manifest。
- `frontend/public/scan-count/icons/*`
  - PWA 图标。
- `frontend/public/scan-count-sw.js`
  - service worker。

修改：

- `frontend/app/scan-count/page.tsx`
  - 移除 `DashboardHeader`。
  - 使用独立 PWA 页面布局。
- `frontend/next.config.mjs`
  - 为 service worker 增加正确的 `Content-Type` 和 `Cache-Control` 头。

## 数据流

扫码业务数据流不变：

1. 用户打开 `/scan-count`。
2. 页面加载快递类型。
3. 用户选择快递并开始计数。
4. 扫码输入由现有 parser 解析。
5. `useScanCount` 调用 `scanCountApi.create` 保存。
6. 后端继续负责当天重复判断。
7. 页面刷新当前批次、今日记录和统计。

PWA 只影响应用启动、安装和静态资源缓存，不改变扫码数据保存规则。

## 错误处理

- 浏览器不支持 service worker：页面照常使用，只是不提供离线启动能力。
- service worker 注册失败：记录到控制台，不阻断扫码。
- 网络断开：继续显示页面，但保存扫码时提示网络错误。
- API 超时或失败：沿用现有失败提示和错误音效。
- 离线状态下不允许假装保存成功。

## 测试方案

自动检查：

- `npm test -- --runInBand` in `backend`
- `node lib/audio-feedback.test.cjs` in `frontend`
- `node lib/courier-barcode-rule.test.cjs` in `frontend`
- `node lib/scan-count-record-utils.test.cjs` in `frontend`
- `NEXT_DIST_DIR=.next-dev-3002 pnpm build` in `frontend`

手动检查：

- Chrome DevTools Application 面板能看到 manifest 和 service worker。
- Android Chrome 可以添加到主屏幕。
- iOS Safari 可以添加到主屏幕，并以独立窗口打开。
- 从桌面图标打开后默认进入 `/scan-count`。
- 独立窗口内不显示主系统顶部菜单。
- 扫码保存、重复扫码提示、今日记录和删除仍然正常。
- 断网后刷新页面有明确反馈，扫码保存不会显示成功。

## 验收标准

- 手机能把出荷计数安装到主屏幕。
- 主屏幕打开后直接进入 `/scan-count`。
- 出荷计数页面不显示主系统顶部导航。
- 现有扫码计数功能不退化。
- API 数据不被 service worker 缓存。
- 构建和现有测试通过。

## 后续扩展

后续可以增加：

- 更明显的安装提示。
- 独立应用内设置页。
- 最近使用快递类型记忆。
- 扫码历史本地只读缓存。
- 离线扫码草稿队列，但需要单独设计冲突和重复处理规则。
