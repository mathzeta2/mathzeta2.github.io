// Keep the footer understandable when the statistics service is unreachable.
(() => {
  const fields = ['site_pv', 'site_uv'].map(key => document.getElementById(`busuanzi_value_${key}`));
  window.setTimeout(() => {
    fields.forEach(field => {
      if (field && field.textContent === '加载中…') {
        field.textContent = '暂不可用';
      }
    });
  }, 20000);
})();
