const axios = require('axios');
const Shop = require('../models/Shop');
const { decrypt } = require('../utils/crypto');

const BASE_URL = process.env.MERCARI_BASE_URL || 'https://api.mercari-shops.example.com';
const TIMEOUT_MS = parseInt(process.env.MERCARI_TIMEOUT_MS || '10000', 10);
const CONCURRENCY = parseInt(process.env.MERCARI_CONCURRENCY || '3', 10);

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, retries = 2, baseDelay = 300) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // 429/5xx/backoff
      const status = err && err.response && err.response.status;
      if (i < retries && (status === 429 || (status >= 500 && status < 600) || !status)) {
        await delay(baseDelay * Math.pow(2, i));
        continue;
      }
      break;
    }
  }
  throw lastErr;
}

async function fetchPendingCountForShop({ mercari_access_token, shopName }) {
  if (!mercari_access_token) return 0;
  const pat = decrypt(mercari_access_token);
  const client = axios.create({ baseURL: BASE_URL, timeout: TIMEOUT_MS });

  // 参考官方文档：这里假设存在订单列表端点 /orders，支持按状态筛选与分页
  // 实际项目请替换为真实的 Mercari Shops API 路径与查询参数
  const fetchPage = async (pageToken) => {
    const headers = { Authorization: `Bearer ${pat}` };
    const params = { status: 'unshipped', page_token: pageToken };
    const res = await client.get('/orders', { headers, params });
    return res.data;
  };

  let total = 0;
  let next = undefined;
  await withRetry(async () => {
    // 第一页
    const data = await fetchPage(undefined);
    total += Array.isArray(data.orders) ? data.orders.length : 0;
    next = data.next_page_token;
  });

  // 遍历分页（不重试每一页，仅在第一页失败时重试；如需更稳可对每页包一层 withRetry）
  while (next) {
    try {
      const data = await fetchPage(next);
      total += Array.isArray(data.orders) ? data.orders.length : 0;
      next = data.next_page_token;
    } catch (err) {
      // 分页失败不致命，记录并停止继续翻页
      console.error(`[Mercari] 分页获取失败(${shopName || ''}):`, err && err.message);
      break;
    }
  }

  return total;
}

async function fetchShopsOverview() {
  // 获取启用店铺
  const shops = await Shop.getAll({ is_active: true });
  // 仅显示“メルカリ”类别下的店铺
  const shopsInMercariCategory = shops.filter(s => (s.category_name || '').trim() === 'メルカリ');
  const targets = shopsInMercariCategory.filter(s => s.mercari_access_token);

  const results = [];
  let index = 0;
  while (index < targets.length) {
    const chunk = targets.slice(index, index + CONCURRENCY);
    // 并发执行一批
    // eslint-disable-next-line no-await-in-loop
    const batch = await Promise.all(chunk.map(async (s) => {
      try {
        const count = await fetchPendingCountForShop({
          mercari_access_token: s.mercari_access_token,
          shopName: s.name,
        });
        return { shopId: String(s.id), shopName: s.name, pendingCount: count };
      } catch (err) {
        const status = err && err.response && err.response.status;
        if (status === 401 || status === 403) {
          console.error(`[Mercari] PAT 失效或未授权(${s.name}): 需轮换`);
        } else {
          console.error(`[Mercari] 获取未处理订单失败(${s.name}):`, err && err.message);
        }
        return { shopId: String(s.id), shopName: s.name, pendingCount: 0 };
      }
    }));
    results.push(...batch);
    index += CONCURRENCY;
  }

  // 对未配置 PAT 的启用店铺也返回（pendingCount=0），以保持前端列表完整
  const missing = shopsInMercariCategory.filter(s => !s.mercari_access_token).map(s => ({
    shopId: String(s.id),
    shopName: s.name,
    pendingCount: 0,
  }));

  return { shops: [...results, ...missing] };
}

module.exports = {
  fetchPendingCountForShop,
  fetchShopsOverview,
};


