(() => {
  const root=document.getElementById('elden-companion');
  if(!root || root.dataset.ready) return;
  root.dataset.ready='true';
  const actor=root.querySelector('.ranni-actor'), speech=root.querySelector('.ranni-speech'), stage=root.querySelector('.ranni-stage'), restore=root.querySelector('.ranni-restore'), depth=root.querySelector('.ranni-depth');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let speechTimer, motionTimer, drag=null, moved=false, phrase=0, frame=0;
  const lines=['褪色者，今天也来寻找知识了吗？','愿月光照亮你的证明。','休息片刻，再继续这段求知旅途吧。'];
  // Create audio only inside a gesture; no autoplay or external audio requests.
  const soundButton=root.querySelector('[data-action="sound"]');
  let soundEnabled=true, audioContext=null, soundGeneration=0;
  const voices=new Set();
  try{soundEnabled=localStorage.getItem('zeta-ranni-sound')!=='muted';}catch(_){}
  function updateSoundButton(){
    soundButton.setAttribute('aria-pressed',String(soundEnabled));
    soundButton.textContent=soundEnabled?'音效开':'音效关';
    soundButton.title=soundEnabled?'关闭互动音效':'开启互动音效';
  }
  function stopSound(){
    soundGeneration++;
    for(const voice of voices){
      try{voice.osc.stop();}catch(_){}
      voice.osc.disconnect();voice.gain.disconnect();
    }
    voices.clear();
  }
  async function playSound(kind){
    stopSound();
    if(!soundEnabled)return;
    const generation=soundGeneration;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)return;
      if(!audioContext)audioContext=new Audio();
      if(audioContext.state==='suspended')await audioContext.resume();
      if(!soundEnabled||generation!==soundGeneration||audioContext.state!=='running')return;
      const notes=kind==='magic'?[523.25,783.99,1046.5,1567.98]:[659.25,987.77];
      const now=audioContext.currentTime+.015;
      notes.forEach((frequency,index)=>{
        const start=now+index*(kind==='magic'?.13:.11);
        const duration=kind==='magic'?1.3:.85;
        // Two quiet sine partials create a soft crystalline chime.
        [1,2.002].forEach((partial,harmonic)=>{
          const osc=audioContext.createOscillator(),gain=audioContext.createGain();
          const voice={osc,gain};voices.add(voice);
          osc.type='sine';osc.frequency.setValueAtTime(frequency*partial,start);
          gain.gain.setValueAtTime(0,start);
          gain.gain.linearRampToValueAtTime(harmonic?.009:.035,start+.025);
          gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
          gain.gain.linearRampToValueAtTime(0,start+duration+.04);
          osc.connect(gain);gain.connect(audioContext.destination);
          osc.onended=()=>{osc.disconnect();gain.disconnect();voices.delete(voice);};
          osc.start(start);osc.stop(start+duration+.06);
        });
      });
    }catch(_){/* Audio failure must never block the character controls. */}
  }
  soundButton.addEventListener('click',()=>{
    soundEnabled=!soundEnabled;updateSoundButton();
    try{localStorage.setItem('zeta-ranni-sound',soundEnabled?'enabled':'muted');}catch(_){}
    if(soundEnabled)playSound('wave');else stopSound();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSound();});
  window.addEventListener('pagehide',stopSound);
  updateSoundButton();
  function respond(kind,customText){
    playSound(kind);
    clearTimeout(speechTimer);clearTimeout(motionTimer);
    root.classList.remove('ranni-waving','ranni-casting');
    void actor.offsetWidth;
    root.classList.add(kind==='magic'?'ranni-casting':'ranni-waving');
    speech.textContent=customText || (kind==='magic'?'赠你一缕月光。愿难题也有清晰的解。':lines[phrase++%lines.length]);
    speech.hidden=false;
    motionTimer=setTimeout(()=>root.classList.remove('ranni-waving','ranni-casting'),2200);
    speechTimer=setTimeout(()=>speech.hidden=true,5000);
  }
  document.addEventListener('zeta:reading-message',event=>{if(!stage.hidden && typeof event.detail?.text==='string')respond('magic',event.detail.text);});
  function collapse(value){if(value)stopSound();stage.hidden=value;restore.hidden=!value;speech.hidden=true;root.classList.toggle('is-collapsed',value);root.style.left='';root.style.top='';root.style.right='';root.style.bottom='';try{localStorage.setItem('zeta-ranni-collapsed',String(value));}catch(_){} }
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
  if(!reduced)document.addEventListener('pointermove',e=>{if(frame||drag||stage.hidden)return;frame=requestAnimationFrame(()=>{const r=actor.getBoundingClientRect();const x=Math.max(-3,Math.min(3,(e.clientX-r.left-r.width/2)/80)),y=Math.max(-2,Math.min(2,(e.clientY-r.top-r.height/2)/100));depth.style.setProperty('--ranni-look-x',`${x*.5}deg`);depth.style.setProperty('--ranni-look-y',`${-y*.4}deg`);frame=0;});},{passive:true});
})();
