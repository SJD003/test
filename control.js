// control.js - V23 / 3.22 - نظام التحكم + إشعارات الأذان Adan.mp3
const LOCAL_VERSION = "3.22";
const MIN_VERSION = "3.0";
const CHECK_INTERVAL = 60000;

function getAdanAudio(){
  let el = document.getElementById('adanAudio');
  if(el) return el;
  el = new Audio('./icons/Adan.mp3');
  el.id = 'adanAudio';
  el.preload = 'auto';
  el.volume = 1.0;
  return el;
}

function playAdanSound(){
  try{
    const audio = document.getElementById('adanAudio') || getAdanAudio();
    audio.currentTime = 0;
    audio.volume = 1.0;
    audio.play().then(()=>{
      if(navigator.vibrate) navigator.vibrate([200,100,200,100,400,100,600]);
    }).catch(()=>{ window._pendingAdan = true; });
  }catch(e){}
}

function stopAdanSound(){
  try{
    const audio = document.getElementById('adanAudio');
    if(audio){ audio.pause(); audio.currentTime = 0; }
  }catch{}
}

document.addEventListener('click', ()=>{
  if(window._pendingAdan){
    window._pendingAdan = false;
    playAdanSound();
  }
});

if('serviceWorker' in navigator){
  navigator.serviceWorker.addEventListener('message', event => {
    if(event.data && event.data.type === 'PLAY_ADAN'){
      playAdanSound();
    }
  });
}

function testNotificationNow(){
  if(!('Notification' in window)){ alert('المتصفح لا يدعم الإشعارات'); return; }
  const doTest = () => {
    playAdanSound();
    try{
      const notif = new Notification('🕌 ميزان المحاسبة', {
        body: '✅ الإشعارات تعمل بنجاح حتى في الخلفية\n🔊 صوت الأذان Adan.mp3 يعمل لأن التطبيق مفتوح\n📍 موقع محفوظ فقط - V23',
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        vibrate: [200,100,200,100,400],
        tag: 'test-adan-v23',
        requireInteraction: false,
        renotify: true
      });
      notif.onclick = () => { playAdanSound(); window.focus(); notif.close(); };
    }catch(e){ console.error(e); }
  };
  if(Notification.permission === 'granted'){ doTest(); }
  else if(Notification.permission === 'default'){
    Notification.requestPermission().then(p=>{ if(p==='granted') doTest(); });
  } else { doTest(); }
}
window.testNotificationNow = testNotificationNow;

async function checkAppConfig(){
  try{
    let res = await fetch('./app-config.json?v='+Date.now(), {cache:'no-store'});
    if(!res.ok) return;
    let cfg = await res.json();
    if(cfg.maintenance){
      document.body.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#0f0f0f;color:#d6c7a1;text-align:center;padding:30px"><div style="font-size:64px">🛠️</div><h2>${cfg.maintenanceMessage||'جاري التحديث...'}</h2><button onclick="location.reload()" style="margin-top:10px;background:#d6c7a1;color:#000;border:none;padding:12px 24px;border-radius:12px;font-weight:800">تحديث</button></div>`;
      return true;
    }
    if(cfg.minVersion && LOCAL_VERSION < cfg.minVersion){ forceUpdateApp(cfg.version); return; }
    let lastSeen = localStorage.getItem('lastSeenVersion');
    let isNewVersion = cfg.version && cfg.version !== LOCAL_VERSION;
    let shouldShow = cfg.forceUpdate || (isNewVersion && lastSeen !== cfg.version && cfg.showWhatsNew);
    if(shouldShow){
      let old = document.getElementById('updateBanner'); if(old) old.remove();
      let banner = document.createElement('div');
      banner.id = 'updateBanner';
      banner.innerHTML = `<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#d6c7a1,#c7b07a);color:#000;padding:12px 16px;text-align:center;font-weight:800;display:flex;justify-content:space-between;align-items:center;gap:10px"><span style="flex:1;text-align:right;font-size:13px">🚀 ${cfg.whatsNew || 'V23 - أوفلاين + Adan.mp3'}</span><div style="display:flex;gap:8px"><button onclick="forceUpdateApp('${cfg.version}')" style="background:#000;color:#d6c7a1;border:none;padding:7px 14px;border-radius:9px;font-weight:800;font-size:12px">تحديث الآن</button><button onclick="dismissUpdate('${cfg.version}')" style="background:transparent;color:#000;border:1.5px solid #000;padding:6px 10px;border-radius:9px;font-weight:800">✕</button></div></div>`;
      document.body.prepend(banner);
      document.body.style.paddingTop = '52px';
    }
  }catch(e){}
}
function forceUpdateApp(ver){
  try{
    localStorage.setItem('lastSeenVersion', ver || LOCAL_VERSION);
    localStorage.removeItem('mizan_cached_timings');
    if('caches' in window){ caches.keys().then(keys=>keys.forEach(k=>{ if(k.startsWith('mizan-')) caches.delete(k); })); }
    if('serviceWorker' in navigator){ navigator.serviceWorker.getRegistrations().then(regs=>{ regs.forEach(r=>r.update()); }); }
  }catch{}
  location.reload(true);
}
function dismissUpdate(ver){
  try{
    localStorage.setItem('lastSeenVersion', ver || LOCAL_VERSION);
    let b=document.getElementById('updateBanner'); if(b) b.remove();
    document.body.style.paddingTop='0';
  }catch{}
}
checkAppConfig();
setInterval(checkAppConfig, 60000);
window.addEventListener('focus', checkAppConfig);
window.forceUpdateApp = forceUpdateApp;
window.dismissUpdate = dismissUpdate;