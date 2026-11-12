(() => {
  'use strict';
  if (window.zetaSpotifyInitialized) return;
  window.zetaSpotifyInitialized = true;
  const card = document.querySelector('.elden-music');
  if (!card) return;
  const mount = card.querySelector('.elden-music-mount');
  const button = card.querySelector('.elden-music-load');
  const status = card.querySelector('.elden-music-status');
  let timer;

  function loadPlayer() {
    clearTimeout(timer);
    // Keep the external album link usable even on unusually narrow screens.
    if (card.clientWidth < 280) {
      status.textContent = '当前显示区域较窄，请横屏后重试，或在 Spotify 打开。';
      return;
    }
    const frame = document.createElement('iframe');
    frame.className = 'elden-music-frame';
    frame.title = 'Spotify · 艾尔登法环原声专辑播放器';
    frame.width = '100%';
    frame.height = '352';
    // User-triggered loading must not wait on iframe lazy-load heuristics.
    frame.loading = 'eager';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = 'https://open.spotify.com/embed/album/6WWL32UxPnjrIWlgLdzoir?utm_source=generator&theme=0';
    frame.addEventListener('error', () => {
      clearTimeout(timer);
      status.textContent = '未能连接播放器，请重试，或在 Spotify 打开专辑。';
    });
    mount.replaceChildren(frame);
    button.textContent = '重新加载';
    status.textContent = '正在连接 Spotify；播放器出现后，点击其中的播放按钮。';
    // A cross-origin iframe load event does not prove that its player works.
    // Keep this conditional help available without declaring success/failure.
    timer = setTimeout(() => {
      status.textContent = '若播放器仍空白，请重新加载，或在 Spotify 打开；手机网络需能连接 Spotify。';
    }, 15000);
  }

  button.addEventListener('click', loadPlayer);
  if (window.matchMedia('(min-width: 960px)').matches) loadPlayer();
})();
