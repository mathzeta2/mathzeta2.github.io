/* Small shared model: only published catalog paths may enter saved records. */
(function (host, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else host.ZetaReadingStore = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SAVES = 'zeta-grace-saves-v1', HISTORY = 'zeta-reading-history-v1';
  const finite = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : lo;
  function create(catalog, storage, now = Date.now) {
    const posts = new Map(catalog.filter(p => typeof p.path === 'string' && p.path.startsWith('/') && !p.path.startsWith('//') && typeof p.title === 'string').map(p => [p.path, p]));
    const memory = {}, dirty = new Set();
    function read(key) {
      if (dirty.has(key)) return memory[key];
      try {
        const raw = storage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (_) { return memory[key] || null; }
    }
    function write(key, value) {
      memory[key] = value;
      try { storage.setItem(key, JSON.stringify(value)); dirty.delete(key); return true; } catch (_) { dirty.add(key); return false; }
    }
    function saved() {
      const value = read(SAVES);
      return Array.isArray(value) ? [...new Set(value.filter(p => posts.has(p)))] : [];
    }
    function history() {
      const value = read(HISTORY), result = {};
      if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
      for (const [path, entry] of Object.entries(value)) {
        if (!posts.has(path) || !entry || typeof entry !== 'object' || !Number.isFinite(entry.updatedAt)) continue;
        result[path] = {path, anchor: typeof entry.anchor === 'string' ? entry.anchor.slice(0, 1000) : '', offset: finite(entry.offset, -10000000, 10000000), progress: finite(entry.progress, 0, 1), updatedAt: finite(entry.updatedAt, 0, now() + 1000)};
      }
      return result;
    }
    return {
      posts, saved, history,
      toggle(path) {
        if (!posts.has(path)) return {saved:false, persisted:false};
        const values = saved(), active = !values.includes(path);
        const next = active ? [path, ...values] : values.filter(p => p !== path);
        return {saved:active, persisted:write(SAVES, next)};
      },
      remember(path, entry) {
        if (!posts.has(path)) return false;
        const data = history();
        data[path] = {path, anchor:typeof entry.anchor === 'string' ? entry.anchor.slice(0,1000) : '', offset:finite(entry.offset,-10000000,10000000), progress:finite(entry.progress,0,1), updatedAt:now()};
        return write(HISTORY, data);
      },
      latest() { return Object.values(history()).sort((a,b) => b.updatedAt-a.updatedAt)[0] || null; },
      random(exclude, rng = Math.random) {
        const candidates = [...posts.values()].filter(p => p.path !== exclude);
        return candidates.length ? candidates[Math.min(candidates.length-1, Math.floor(finite(rng(),0,1)*candidates.length))] : null;
      }
    };
  }
  return {create, SAVES, HISTORY};
});
