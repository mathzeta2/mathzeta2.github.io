(() => {
  if (window.zetaReadingReady) return;
  const catalogElement = document.getElementById('grace-catalog');
  if (!catalogElement || !window.ZetaReadingStore) return;
  let catalog;
  try { catalog = JSON.parse(catalogElement.textContent); } catch (_) { return; }
  let storage;
  try { storage = window.localStorage; } catch (_) { storage = {getItem(){throw Error();},setItem(){throw Error();}}; }
  const store = window.ZetaReadingStore.create(catalog, storage);
  window.zetaReadingReady = true;
  const dialog = document.getElementById('grace-dialog');
  const content = document.getElementById('grace-dialog-content');
  const title = document.getElementById('grace-dialog-title');
  const toast = document.getElementById('grace-toast');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = null, body = null, headings = [], view = '', toastTimer, scrollTimer;
  let userReading = false, suppressUntil = 0, lastOffset = null, opener = null;
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  function button(text, action, cls = '') {
    const node = el('button', cls, text);node.type = 'button';node.dataset.readingAction = action;return node;
  }
  function message(text) {
    clearTimeout(toastTimer);toast.textContent = text;toast.hidden = false;
    toastTimer = setTimeout(() => {toast.hidden = true;}, 4200);
  }
  function updateButtons() {
    const saved = store.saved();
    document.querySelectorAll('[data-grace-count]').forEach(node => {node.textContent = String(saved.length);});
    document.querySelectorAll('[data-reading-action="save"]').forEach(node => {
      const active = !!current && saved.includes(current.path);
      node.setAttribute('aria-pressed', String(active));node.disabled = !current;
      const label = node.querySelector('[data-save-label]');
      if (label) label.textContent = active ? '赐福已点亮' : '点亮赐福';
      else node.textContent = active ? '赐福已点亮 · 取消收藏' : '为本文点亮赐福';
    });
  }
  function close() {
    dialog.close();view = '';
    if (opener?.isConnected) opener.focus({preventScroll:true});
  }
  function open(mode, trigger) {
    const wasOpen = dialog.open;
    if (!wasOpen) opener = trigger || document.activeElement;
    view = mode;
    if (mode === 'assistant') document.dispatchEvent(new CustomEvent('zeta:reading-message',{detail:{text:'褪色者，让我为你指引下一段求知之路。'}}));
    render();
    if (!dialog.open) dialog.showModal();
    else if(wasOpen){title.setAttribute('tabindex','-1');title.focus({preventScroll:true});}
  }
  function render() {
    content.replaceChildren();
    title.textContent = view === 'shelf' ? '赐福收藏夹' : view === 'toc' ? '文章目录' : '菈妮的阅读指引';
    dialog.querySelectorAll('.grace-tabs button').forEach(node => {
      node.setAttribute('aria-pressed', String(node.dataset.readingAction === view));
    });
    if (view === 'shelf') renderShelf();
    else if (view === 'toc') renderToc();
    else renderAssistant();
    updateButtons();
  }
  function renderShelf() {
    const paths = store.saved(), records = store.history();
    content.append(el('p', 'grace-intro', paths.length ? `已点亮 ${paths.length} 处赐福。沿着留下的光，回到想读的文章。` : '这里还没有点亮的赐福。进入一篇文章，点击“点亮赐福”，就能把它留在这里。'));
    if (!paths.length) {content.append(button('随缘读一篇', 'random', 'grace-primary'));return;}
    const list = el('ul', 'grace-saved-list');
    for (const path of paths) {
      const post = store.posts.get(path), record = records[path];
      const row = el('li', 'grace-saved-row'), link = el('a', 'grace-post-title', post.title);
      link.href = path;row.append(link);
      row.append(el('p', 'grace-progress', record ? `读至 ${Math.round(record.progress*100)}% · ${new Date(record.updatedAt).toLocaleDateString('zh-CN')}` : '这处赐福正等你启程'));
      const actions = el('div', 'grace-row-actions');
      const read = button(record ? '继续阅读' : '开始阅读', record ? 'resume-post' : 'read-post');read.dataset.path = path;
      const remove = button('取消收藏', 'remove', 'grace-subtle');remove.dataset.path = path;remove.setAttribute('aria-label', '取消收藏：'+post.title);
      actions.append(read, remove);row.append(actions);list.append(row);
    }
    content.append(list);
  }
  function renderAssistant() {
    const greeting = el('div', 'grace-ranni-greeting');
    const portrait = el('img');portrait.src='/images/elden-ring/icons/snow-witch-hat.png';portrait.alt='';
    greeting.append(portrait, el('p', '', '褪色者，要从何处继续求知？让我为你指引下一段路。'));content.append(greeting);
    if (current) {
      const card = el('div', 'grace-current');card.append(el('p', 'grace-eyebrow', '正在阅读'), el('p','',current.title), button('', 'save', 'grace-primary'));content.append(card);
    }
    const last = store.latest(), grid = el('div','grace-assistant-grid');
    function action(label, detail, command, disabled=false) {
      const node=button('',command,'grace-action-card');node.disabled=disabled;
      node.append(el('strong','',label),el('span','',detail));grid.append(node);
    }
    action('继续上次阅读', last ? `${store.posts.get(last.path).title} · ${Math.round(last.progress*100)}%` : '阅读文章后，会在这里记下你的脚步。', 'resume', !last);
    action('打开文章目录', current ? '选择章节，直接前往想读的地方。' : '进入文章后，可以查看章节目录。', 'toc', !current || !headings.length);
    action('随缘阅读', '让月光带你前往另一篇文章。', 'random', !store.random(current?.path));
    action('前往赐福收藏', `已点亮 ${store.saved().length} 处赐福。`, 'shelf');
    content.append(grid);
  }
  function renderToc() {
    if (!current || !headings.length) {content.append(el('p','grace-intro','这页没有文章目录。先随缘读一篇，再让我带你寻找章节吧。'),button('随缘读一篇','random','grace-primary'));return;}
    content.append(el('p','grace-intro',current.title));
    const list = el('ol','grace-toc-list');
    headings.forEach((heading,index) => {
      const row=el('li',heading.tagName==='H3'?'grace-toc-child':'');
      const node=button(heading.textContent.replace(/[\uE000-\uF8FF]/g,'').trim(),'chapter');node.dataset.heading=String(index);
      row.append(node);list.append(row);
    });content.append(list);
  }
  function gotoPost(path, resume=false) {
    if (!store.posts.has(path)) return;
    if (resume && current?.path === path) {const record=store.history()[path];if(record)restoreRecord(record);close();return;}
    saveProgress();
    window.location.assign(path+(resume?'?reading=resume':''));
  }
  function restoreRecord(record) {
    if (!body) return;
    suppressUntil=Date.now()+1400;userReading=false;
    const anchor=record.anchor && document.getElementById(record.anchor);
    const top=body.getBoundingClientRect().top+window.scrollY;
    const target=anchor && body.contains(anchor) ? anchor.getBoundingClientRect().top+window.scrollY+record.offset : top+record.progress*Math.max(1,body.offsetHeight-innerHeight);
    window.scrollTo({top:Math.max(0,target),behavior:reduced?'instant':'smooth'});
    message('已回到上次阅读的位置。愿月光照亮你的思路。');
  }
  function saveProgress(force=false) {
    if (!current || !body || !userReading || Date.now()<suppressUntil || (document.hidden && !force)) return;
    const top=body.getBoundingClientRect().top+window.scrollY;
    const offset=window.scrollY-top;
    if (offset < -innerHeight*.7 || offset === lastOffset) return;
    let anchor=null;
    for(const heading of headings) {if(heading.getBoundingClientRect().top<=125)anchor=heading;else break;}
    store.remember(current.path,{anchor:anchor?.id || '',offset:anchor?window.scrollY-(anchor.getBoundingClientRect().top+window.scrollY):offset,progress:Math.max(0,Math.min(1,offset/Math.max(1,body.offsetHeight-innerHeight)))});
    lastOffset=offset;
  }
  function initPage() {
    const marker=document.querySelector('[data-reading-post]');
    current=marker?store.posts.get(marker.dataset.readingPost):null;
    body=current?marker.closest('article').querySelector('.e-content.article-entry'):null;
    headings=body?[...body.querySelectorAll('h2[id],h3[id]')]:[];
    userReading=false;lastOffset=null;updateButtons();
    const url=new URL(location.href);
    if(url.searchParams.get('reading')==='resume' && current) {
      const record=store.history()[current.path];
      url.searchParams.delete('reading');history.replaceState(history.state,'',url.pathname+url.search+url.hash);
      const run=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{if(record)restoreRecord(record);else message('还没有这篇文章的阅读记录，从开头出发吧。');}));
      run(); // The deferred script runs after the article and styles; third-party embeds must not delay reading.
    }
  }
  document.addEventListener('click',event=>{
    const node=event.target.closest('[data-reading-action]');if(!node || node.disabled)return;
    const action=node.dataset.readingAction;
    if(!['save','shelf','assistant','toc','close','resume','resume-post','read-post','remove','random','chapter'].includes(action))return;
    event.preventDefault();
    if(action==='close') {close();return;}
    if(['shelf','assistant','toc'].includes(action)) {open(action,node);return;}
    if(action==='save' && current) {
      const result=store.toggle(current.path);updateButtons();
      message((result.saved?'已记录这处赐福。':'已取消这处赐福收藏。')+(!result.persisted?' 浏览器暂不允许保存，仅在本页暂存。':''));
      if(result.saved)document.dispatchEvent(new CustomEvent('zeta:reading-message',{detail:{text:'已记录这处赐福。下次，沿着光回来吧。'}}));
      if(dialog.open){render();content.querySelector('[data-reading-action=save]')?.focus();}
    } else if(action==='remove' && store.saved().includes(node.dataset.path)) {
      store.toggle(node.dataset.path);render();message('已取消收藏，随时可以重新点亮。');dialog.querySelector('.grace-close').focus();
    } else if(action==='random') {
      const post=store.random(current?.path);if(post)gotoPost(post.path);else message('暂时没有其他文章，稍后再来探索吧。');
    } else if(action==='resume') {
      const last=store.latest();if(last)gotoPost(last.path,true);else message('还没有阅读记录，先读一篇文章吧。');
    } else if(action==='resume-post'||action==='read-post')gotoPost(node.dataset.path,action==='resume-post');
    else if(action==='chapter') {
      const heading=headings[Number(node.dataset.heading)];if(!heading)return;
      close();userReading=true;suppressUntil=0;
      heading.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});
      history.replaceState(history.state,'',location.pathname+location.search+'#'+encodeURIComponent(heading.id));
      heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
      clearTimeout(scrollTimer);scrollTimer=setTimeout(saveProgress,900);
    }
  });
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();}});
  dialog.addEventListener('cancel',()=>{view='';});
  document.addEventListener('wheel',()=>{if(!dialog.open)userReading=true;},{passive:true});
  document.addEventListener('touchmove',()=>{if(!dialog.open)userReading=true;},{passive:true});
  document.addEventListener('pointerdown',event=>{if(!dialog.open && event.clientX>=document.documentElement.clientWidth-20)userReading=true;},{passive:true});
  document.addEventListener('keydown',event=>{if(!dialog.open && ['ArrowDown','ArrowUp','PageDown','PageUp',' ','End','Home'].includes(event.key) && !/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))userReading=true;});
  window.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(saveProgress,250);},{passive:true});
  window.addEventListener('pagehide',()=>saveProgress(true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveProgress(true);else updateButtons();});
  window.addEventListener('storage',event=>{if([window.ZetaReadingStore.SAVES,window.ZetaReadingStore.HISTORY].includes(event.key)){updateButtons();if(dialog.open)render();}});
  window.addEventListener('pjax:send',()=>{saveProgress();if(dialog.open)close();});
  window.addEventListener('pjax:success',initPage);
  initPage();
})();
