// Retain a dated, genuine record if the existing Busuanzi service is unreachable.
(() => {
  const root = document.getElementById('visit-stats');
  if (!root) return;
  const pv = document.getElementById('busuanzi_value_site_pv');
  const uv = document.getElementById('busuanzi_value_site_uv');
  const status = document.getElementById('visit-stats-status');
  const retry = document.getElementById('visit-stats-retry');
  const key = 'zeta2-visitor-stats-v2';
  let record = {site_pv: Number(pv.textContent), site_uv: Number(uv.textContent), time: root.dataset.recordedAt};
  let pending = false;
  function valid(data) {
    return data && Number.isSafeInteger(data.site_pv) && Number.isSafeInteger(data.site_uv) && data.site_uv >= 0 && data.site_pv >= data.site_uv;
  }
  function show(data, live) {
    record = data;
    pv.textContent = data.site_pv.toLocaleString('zh-CN');
    uv.textContent = data.site_uv.toLocaleString('zh-CN');
    const date = new Date(data.time).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', hour12: false});
    status.textContent = `${live ? '更新于' : '最近记录：'} ${date}`;
    status.title = live ? '统计服务刚刚返回的数据。' : '最近一次成功取得的真实数据，暂未更新。';
  }
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (valid(saved) && Date.parse(saved.time) > Date.parse(record.time) && Date.parse(saved.time) <= Date.now()) record = saved;
  } catch (_) { /* Storage may be unavailable; the HTML record remains visible. */ }
  show(record, false);
  function update() {
    // Do not add local development traffic to the public site's totals.
    if (pending || location.hostname !== 'mathzeta2.github.io') return;
    pending = true;
    retry.hidden = true;
    const script = document.createElement('script');
    const callback = `ZetaStats_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let done = false;
    const timer = setTimeout(fail, 16000);
    function clean() {
      done = true;
      pending = false;
      clearTimeout(timer);
      script.remove();
      delete window[callback];
    }
    function fail() {
      if (done) return;
      clean();
      status.title = '统计服务暂时无法连接，目前显示最近的真实记录。可点击重新获取。';
      retry.hidden = false;
    }
    window[callback] = data => {
      if (done) return;
      if (!valid(data)) return fail();
      clean();
      show({...data, time: new Date().toISOString()}, true);
      try { localStorage.setItem(key, JSON.stringify(record)); } catch (_) {}
    };
    script.async = true;
    script.referrerPolicy = 'origin';
    script.src = `https://busuanzi.ibruce.info/busuanzi?jsonpCallback=${callback}`;
    script.onerror = fail;
    document.head.appendChild(script);
  }
  retry.addEventListener('click', update);
  update();
})();
