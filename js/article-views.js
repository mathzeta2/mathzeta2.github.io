// Article identity is explicit: Safari may strip paths from the HTTP Referer.
(() => {
  'use strict';
  const article = document.getElementById('article-reading');
  if (!article || article.dataset.viewsInitialized) return;
  article.dataset.viewsInitialized = 'true';
  const value = document.getElementById('article-reading-value');
  const status = document.getElementById('article-reading-status');
  const retry = document.getElementById('article-reading-retry');
  const provider = 'soxft-9420-v1';
  const origin = 'https://mathzeta2.github.io';
  const url = new URL(article.dataset.path, origin);
  if (url.origin !== origin || url.pathname === '/') return;
  url.search = '';
  url.hash = '';
  const canonical = url.href;
  const key = `zeta2-article-views-v2:${canonical}`;
  const validCount = count => Number.isSafeInteger(count) && count >= 0;
  const validRecord = data => data && data.provider === provider && data.url === canonical &&
    validCount(data.count) && Number.isFinite(Date.parse(data.time)) && Date.parse(data.time) <= Date.now();
  let record = null;
  let pending = false;
  let attempted = false;
  if (article.dataset.provider === provider && article.dataset.recordedAt) {
    const initial = {provider, url: canonical, count: Number(value.textContent.replace(/,/g, '')), time: article.dataset.recordedAt};
    if (validRecord(initial)) record = initial;
  }
  try {
    // Never restore the old origin-based readings (e.g. 1947 on every article).
    localStorage.removeItem(`zeta2-article-views-v1:${article.dataset.path}`);
    const saved = JSON.parse(localStorage.getItem(key));
    if (validRecord(saved) && (!record || Date.parse(saved.time) > Date.parse(record.time))) record = saved;
  } catch (_) { /* Private mode or blocked storage must not block live counts. */ }
  function show(live) {
    if (!record) return;
    value.textContent = record.count.toLocaleString('zh-CN');
    status.textContent = live ? '已更新' : '最近记录';
    status.title = `本篇文章的独立访问次数；获取于 ${new Date(record.time).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', hour12: false})}`;
  }
  show(false);
  async function update() {
    if (pending || location.hostname !== 'mathzeta2.github.io') return;
    pending = true;
    retry.hidden = true;
    status.textContent = record ? '最近记录 · 更新中' : '加载中';
    // A retry only reads. A timed-out POST might already have been counted.
    const method = attempted ? 'GET' : 'POST';
    attempted = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 16000);
    try {
      const response = await fetch('https://busuanzi.9420.ltd/api', {
        method, mode: 'cors', credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: {'x-bsz-referer': canonical},
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Statistics service unavailable');
      const result = await response.json();
      if (controller.signal.aborted || result.success !== true || !result.data || !validCount(result.data.page_pv)) {
        throw new Error('Invalid article count');
      }
      record = {provider, url: canonical, count: result.data.page_pv, time: new Date().toISOString()};
      show(true);
      try { localStorage.setItem(key, JSON.stringify(record)); } catch (_) {}
    } catch (_) {
      status.textContent = record ? '最近记录 · 暂未更新' : '暂时无法获取';
      status.title = '未取得最新的文章读数；点击重试只查询数据，不重复计数。';
      retry.hidden = false;
    } finally {
      clearTimeout(timer);
      pending = false;
    }
  }
  retry.addEventListener('click', update);
  update();
})();
