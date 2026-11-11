(() => {
  const root=document.getElementById('elden-companion');
  if(!root || root.dataset.ready) return;
  root.dataset.ready='true';
  const actor=root.querySelector('.ranni-actor'), speech=root.querySelector('.ranni-speech'), stage=root.querySelector('.ranni-stage'), restore=root.querySelector('.ranni-restore'), pupil=root.querySelector('.ranni-pupil');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speechTimer, motionTimer, drag=null, moved=false, phrase=0, frame=0;
  const lines=['褪色者，今天也来寻找知识了吗？','愿月光照亮你的证明。','休息片刻，再继续这段求知旅途吧。'];
  function respond(kind){
    clearTimeout(speechTimer);clearTimeout(motionTimer);
    root.classList.remove('ranni-waving','ranni-casting');
    void actor.offsetWidth;
    root.classList.add(kind==='magic'?'ranni-casting':'ranni-waving');
    speech.textContent=kind==='magic'?'赠你一缕月光。愿难题也有清晰的解。':lines[phrase++%lines.length];
    speech.hidden=false;
    motionTimer=setTimeout(()=>root.classList.remove('ranni-waving','ranni-casting'),2200);
    speechTimer=setTimeout(()=>speech.hidden=true,5000);
  }
  function collapse(value){stage.hidden=value;restore.hidden=!value;speech.hidden=true;root.classList.toggle('is-collapsed',value);root.style.left='';root.style.top='';root.style.right='';root.style.bottom='';try{localStorage.setItem('zeta-ranni-collapsed',String(value));}catch(_){} }
  actor.addEventListener('click',()=>{if(moved){moved=false;return;}respond('wave');});
  root.querySelector('[data-action="wave"]').addEventListener('click',()=>respond('wave'));
  root.querySelector('[data-action="magic"]').addEventListener('click',()=>respond('magic'));
  root.querySelector('[data-action="hide"]').addEventListener('click',()=>{collapse(true);restore.focus();});
  restore.addEventListener('click',()=>{collapse(false);respond('wave');actor.focus();});
  try{if(localStorage.getItem('zeta-ranni-collapsed')==='true')collapse(true);}catch(_){}
  function place(x,y){root.style.left=Math.max(0,Math.min(innerWidth-root.offsetWidth,x))+'px';root.style.top=Math.max(0,Math.min(innerHeight-root.offsetHeight,y))+'px';root.style.right='auto';root.style.bottom='auto';}
  actor.addEventListener('pointerdown',e=>{if(e.button!==0)return;const r=root.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top};moved=false;actor.setPointerCapture(e.pointerId);});
  actor.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)moved=true;if(moved)place(drag.left+dx,drag.top+dy);});
  actor.addEventListener('pointerup',()=>drag=null);
  actor.addEventListener('pointercancel',()=>{drag=null;moved=false;});
  window.addEventListener('resize',()=>{if(root.style.left){const r=root.getBoundingClientRect();place(r.left,r.top);}});
  if(!reduced)document.addEventListener('pointermove',e=>{if(frame||drag||stage.hidden)return;frame=requestAnimationFrame(()=>{const r=actor.getBoundingClientRect();const x=Math.max(-3,Math.min(3,(e.clientX-r.left-r.width/2)/80)),y=Math.max(-2,Math.min(2,(e.clientY-r.top-r.height/2)/100));pupil.setAttribute('transform',`translate(${x} ${y})`);frame=0;});},{passive:true});
})();
