(() => {
  'use strict';
  if (window.zetaMusicInitialized) return;
  window.zetaMusicInitialized = true;
  const card = document.querySelector('.elden-music');
  if (!card) return;
  const mount = card.querySelector('.elden-music-mount');
  const button = card.querySelector('.elden-music-load');
  const status = card.querySelector('.elden-music-status');
  let timer;

  function loadPlayer() {
    clearTimeout(timer);
    // Keep the external playlist link usable even on unusually narrow screens.
    if (card.clientWidth < 280) {
      status.textContent = '当前显示区域较窄，请横屏后重试，或在网易云打开歌单。';
      return;
    }
    const frame = document.createElement('iframe');
    frame.className = 'elden-music-frame';
    frame.title = '网易云音乐 · 歌单播放器';
    frame.width = '100%';
    frame.height = '450';
    // User-triggered loading must not wait on iframe lazy-load heuristics.
    frame.loading = 'eager';
    frame.allow = 'autoplay';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = 'https://music.163.com/outchain/player?type=0&id=2990929899&auto=0&height=430';
    frame.addEventListener('error', () => {
      clearTimeout(timer);
      status.textContent = '未能连接播放器，请重试，或在网易云打开歌单。';
    });
    mount.replaceChildren(frame);
    button.textContent = '重新加载';
    status.textContent = '正在连接网易云；播放器出现后，点击其中的播放按钮。';
    // A cross-origin iframe load event does not prove that its player works.
    // Keep this conditional help available without declaring success/failure.
    timer = setTimeout(() => {
      status.textContent = '若播放器仍空白，请重新加载，或在网易云打开歌单；也可切换网络后重试。';
    }, 15000);
  }

  button.addEventListener('click', loadPlayer);
  if (window.matchMedia('(min-width: 960px)').matches) loadPlayer();
})();
