// Legacy Busuanzi is retained only for the historical site-wide totals.
(() => {
  'use strict';
  const root = document.getElementById('visit-stats');
  if (!root || root.dataset.statsInitialized) return;
  root.dataset.statsInitialized = 'true';
  const pv = document.getElementById('busuanzi_value_site_pv');
  const uv = document.getElementById('busuanzi_value_site_uv');
  const status = document.getElementById('visit-stats-status');
  const retry = document.getElementById('visit-stats-retry');
  const siteKey = 'zeta2-visitor-stats-v2';
  const parseCount = element => Number((element ? element.textContent : '').replace(/,/g, ''));
  const countIsValid = value => Number.isSafeInteger(value) && value >= 0;
  const siteIsValid = data => data && countIsValid(data.site_pv) && countIsValid(data.site_uv) && data.site_pv >= data.site_uv;
  const dateText = time => new Date(time).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', hour12: false});
  let siteRecord = root ? {site_pv: parseCount(pv), site_uv: parseCount(uv), time: root.dataset.recordedAt} : null;
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
  showSite(restore(siteKey, siteRecord, siteIsValid), false);
  function update() {
    // Preview builds must never increase production counters.
    if (pending || location.hostname !== 'mathzeta2.github.io') return;
    pending = true;
    if (retry) retry.hidden = true;
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

    }
    window[callback] = data => {
      if (done) return;
      if (!siteIsValid(data)) return fail();
      clean();
      const time = new Date().toISOString();
      if (root) {
        showSite({site_pv: data.site_pv, site_uv: data.site_uv, time}, true);
        save(siteKey, siteRecord);
      }

    };
    script.async = true;
    script.referrerPolicy = 'origin';
    script.src = `https://busuanzi.ibruce.info/busuanzi?jsonpCallback=${callback}`;
    script.onerror = fail;
    document.head.appendChild(script);
  }
  if (retry) retry.addEventListener('click', update);
  update();
})();
