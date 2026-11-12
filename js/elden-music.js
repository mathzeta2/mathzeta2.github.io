(() => {
  'use strict';
  const card = document.querySelector('.elden-music');
  if (!card || card.dataset.initialized) return;
  card.dataset.initialized = 'true';
  const find = (selector) => card.querySelector(selector);
  const player = find('.elden-native-player');
  const audio = find('.elden-audio');
  const status = find('.elden-music-status');
  const retry = find('.elden-music-retry');
  const list = find('.elden-track-list');
  const cover = find('.elden-track-cover');
  const api = 'https://api.injahow.cn/meting/';
  let tracks = [];
  let index = 0;
  let generation = 0;
  let loadTimer;
  let failed = false;
  let catalogLoading = false;

  function message(text) { status.textContent = text; }
  function stopTimer() { clearTimeout(loadTimer); }
  function unavailable() {
    stopTimer();
    failed = true;
    retry.hidden = false;
    retry.textContent = '重试播放';
    message('此曲暂时无法播放。可重试、选择其他曲目，或在网易云收听。');
  }
  function formatTime(seconds) {
    return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0');
  }
  function durationNote() {
    return Number.isFinite(audio.duration) ? ' · 本次音源 ' + formatTime(audio.duration) : '';
  }
  function play() {
    const attempt = generation;
    let result;
    try { result = audio.play(); } catch (_) { unavailable(); return; }
    if (result && typeof result.catch === 'function') result.catch((error) => {
      if (attempt !== generation || error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') {
        stopTimer();
        message('请点击播放器中的播放按钮继续。');
      } else unavailable();
    });
  }
  function selectTrack(nextIndex, autoplay = false) {
    if (!tracks.length) return;
    ++generation;
    audio.pause();
    stopTimer();
    index = (nextIndex + tracks.length) % tracks.length;
    failed = false;
    retry.hidden = true;
    const track = tracks[index];
    find('.elden-track-name').textContent = track.name;
    find('.elden-track-artist').textContent = track.artist;
    find('.elden-track-link').href = 'https://music.163.com/#/song?id=' + track.id;
    cover.hidden = false;
    cover.src = api + '?server=netease&type=pic&id=' + track.pic;
    for (const button of list.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.index) === index));
    }
    // Resolve expiring audio redirects only when the visitor plays a track.
    audio.src = api + '?server=netease&type=url&id=' + track.id + '&t=' + Date.now();
    audio.load();
    message('已载入 ' + tracks.length + ' 首曲目，点击播放。');
    if (autoplay) play();
  }
  async function loadCatalog() {
    if (catalogLoading) return;
    catalogLoading = true;
    retry.hidden = true;
    message('正在载入歌单…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('/music/netease-2990929899.json?v=1', {signal: controller.signal});
      if (!response.ok) throw new Error('playlist unavailable');
      const data = await response.json();
      const entries = Array.isArray(data.tracks) ? data.tracks : [];
      tracks = entries.filter((track) => track && /^\d+$/.test(track.id) && /^\d+$/.test(track.pic)
        && typeof track.name === 'string' && typeof track.artist === 'string');
      if (!tracks.length) throw new Error('playlist empty');
      list.replaceChildren();
      tracks.forEach((track, i) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.index = String(i);
        button.textContent = track.name + ' — ' + track.artist;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => selectTrack(i, true));
        item.appendChild(button);
        list.appendChild(item);
      });
      find('.elden-track-count').textContent = '（' + tracks.length + '）';
      player.hidden = false;
      selectTrack(0);
    } catch (_) {
      retry.hidden = false;
      retry.textContent = '重新加载歌单';
      message('歌单载入失败，请重试或直接在网易云打开。');
    } finally {
      clearTimeout(timeout);
      catalogLoading = false;
    }
  }

  cover.addEventListener('error', () => { cover.hidden = true; });
  find('[data-music-action="prev"]').addEventListener('click', () => selectTrack(index - 1, true));
  find('[data-music-action="next"]').addEventListener('click', () => selectTrack(index + 1, true));
  retry.addEventListener('click', () => tracks.length ? selectTrack(index, true) : loadCatalog());
  audio.addEventListener('error', unavailable);
  audio.addEventListener('play', () => {
    failed = false;
    retry.hidden = true;
    message('正在连接音频…');
    stopTimer();
    loadTimer = setTimeout(() => {
      retry.hidden = false;
      message('音频连接较慢，可重试或在网易云收听。');
    }, 15000);
  });
  audio.addEventListener('playing', () => {
    stopTimer();
    retry.hidden = true;
    message('正在播放：' + tracks[index].name + durationNote());
  });
  audio.addEventListener('pause', () => {
    stopTimer();
    if (!failed && tracks.length && !audio.ended) message('已暂停' + durationNote());
  });
  audio.addEventListener('ended', () => selectTrack(index + 1, true));
  loadCatalog();
})();
