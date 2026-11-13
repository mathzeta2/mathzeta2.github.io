// One Busuanzi request updates site totals and this article's independent PV.
(() => {
  'use strict';
  const root = document.getElementById('visit-stats');
  const article = document.getElementById('article-reading');
  const owner = root || article;
  if (!owner || owner.dataset.statsInitialized) return;
  owner.dataset.statsInitialized = 'true';
  const pv = document.getElementById('busuanzi_value_site_pv');
  const uv = document.getElementById('busuanzi_value_site_uv');
  const status = document.getElementById('visit-stats-status');
  const retry = document.getElementById('visit-stats-retry');
  const pagePv = document.getElementById('busuanzi_value_page_pv');
  const pageStatus = document.getElementById('article-reading-status');
  const pageRetry = document.getElementById('article-reading-retry');
  const siteKey = 'zeta2-visitor-stats-v2';
  const pageKey = article ? `zeta2-article-views-v1:${article.dataset.path}` : null;
  const parseCount = element => Number((element ? element.textContent : '').replace(/,/g, ''));
  const countIsValid = value => Number.isSafeInteger(value) && value >= 0;
  const siteIsValid = data => data && countIsValid(data.site_pv) && countIsValid(data.site_uv) && data.site_pv >= data.site_uv;
  const pageIsValid = data => data && countIsValid(data.count) && Number.isFinite(Date.parse(data.time));
  const dateText = time => new Date(time).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', hour12: false});
  let siteRecord = root ? {site_pv: parseCount(pv), site_uv: parseCount(uv), time: root.dataset.recordedAt} : null;
  let pageRecord = article && article.dataset.recordedAt ? {count: parseCount(pagePv), time: article.dataset.recordedAt} : null;
  let pending = false;
  function restore(key, initial, validate) {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (validate(saved) && Date.parse(saved.time) <= Date.now() && (!initial || Date.parse(saved.time) > Date.parse(initial.time))) return saved;
    } catch (_) { /* Storage may be unavailable; keep server-rendered records. */ }
    return initial;
  }
  function save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  }
  function showSite(data, live) {
    if (!root || !siteIsValid(data)) return;
    siteRecord = data;
    pv.textContent = data.site_pv.toLocaleString('zh-CN');
    uv.textContent = data.site_uv.toLocaleString('zh-CN');
    status.textContent = `${live ? '更新于' : '最近记录：'} ${dateText(data.time)}`;
    status.title = live ? '统计服务刚刚返回的数据。' : '最近一次成功取得的真实数据，暂未更新。';
  }
  function showPage(data, live) {
    if (!article || !pageIsValid(data)) return;
    pageRecord = data;
    pagePv.textContent = data.count.toLocaleString('zh-CN');
    pageStatus.textContent = live ? '已更新' : '最近记录';
    pageStatus.title = `${live ? '统计服务返回于' : '最近一次成功获取于'} ${dateText(data.time)}；仅统计本篇文章。`;
  }
  if (root) showSite(restore(siteKey, siteRecord, siteIsValid), false);
  if (article) {
    pageRecord = restore(pageKey, pageRecord, pageIsValid);
    showPage(pageRecord, false);
  }
  function update() {
    // Preview builds must never increase production counters.
    if (pending || location.hostname !== 'mathzeta2.github.io') return;
    pending = true;
    if (retry) retry.hidden = true;
    if (pageRetry) pageRetry.hidden = true;
    if (pageStatus) pageStatus.textContent = pageRecord ? '最近记录 · 更新中' : '加载中';
    const script = document.createElement('script');
    const callback = `ZetaStats_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let done = false;
    const timer = setTimeout(fail, 16000);
    function clean() {
      done = true;
      pending = false;
      clearTimeout(timer);
      script.remove();
      // Ignore late responses, including those arriving after a successful retry.
      window[callback] = () => {};
      setTimeout(() => { delete window[callback]; }, 60000);
    }
    function fail() {
      if (done) return;
      clean();
      if (status) status.title = '统计服务暂时无法连接，目前显示最近的真实记录。可点击重新获取。';
      if (retry) retry.hidden = false;
      if (pageStatus) {
        pageStatus.textContent = pageRecord ? '最近记录 · 暂未更新' : '暂时无法获取';
        pageStatus.title = pageRecord ? `最近真实记录：${dateText(pageRecord.time)}。连接恢复后可重试。` : '尚未取得本篇文章的真实读数，请稍后重试。';
      }
      if (pageRetry) pageRetry.hidden = false;
    }
    window[callback] = data => {
      if (done) return;
      if (!siteIsValid(data) || (article && !countIsValid(data.page_pv))) return fail();
      clean();
      const time = new Date().toISOString();
      if (root) {
        showSite({site_pv: data.site_pv, site_uv: data.site_uv, time}, true);
        save(siteKey, siteRecord);
      }
      if (article) {
        showPage({count: data.page_pv, time}, true);
        save(pageKey, pageRecord);
      }
    };
    script.async = true;
    // Busuanzi uses Referer to identify each post. Limit full-path referrers
    // to this existing statistics-service request; other requests are unchanged.
    script.referrerPolicy = article ? 'unsafe-url' : 'origin';
    script.src = `https://busuanzi.ibruce.info/busuanzi?jsonpCallback=${callback}`;
    script.onerror = fail;
    document.head.appendChild(script);
  }
  if (retry) retry.addEventListener('click', update);
  if (pageRetry) pageRetry.addEventListener('click', update);
  update();
})();
