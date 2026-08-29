(()=>{
const $=id=>document.getElementById(id);
const nativeFetch=window.fetch.bind(window);
const D={
  '2m':120,'3m':180,'10m':600,'45m':2700,
  '2h':7200,'3h':10800,'6h':21600,'8h':28800,'12h':43200,
  '3d':259200,'1w':604800
};
const SRC={
  '2m':'1m','3m':'1m','10m':'5m','45m':'15m',
  '2h':'1h','3h':'1h','6h':'1h','8h':'1h','12h':'1h',
  '3d':'1d','1w':'1d'
};
function selectedTf(){return $('tf')?.value||$('qtf')?.value||'15m'}
function bucketStart(t,sec,tf){
  t=+t;
  if(tf==='1w'){
    const monday=345600;
    return Math.floor((t-monday)/sec)*sec+monday;
  }
  return Math.floor(t/sec)*sec;
}
function aggregate(a,tf){
  const sec=D[tf];if(!sec||!Array.isArray(a))return a;
  const out=[];let cur=null;
  for(const x of a){
    const b=bucketStart(+x.time,sec,tf);
    if(!cur||cur.time!==b){
      if(cur)out.push(cur);
      cur={time:b,open:+x.open,high:+x.high,low:+x.low,close:+x.close,volume:+x.volume||0};
    }else{
      cur.high=Math.max(cur.high,+x.high);cur.low=Math.min(cur.low,+x.low);cur.close=+x.close;cur.volume+=(+x.volume||0);
    }
  }
  if(cur)out.push(cur);return out;
}
window.fetch=async function(input,init){
  let url=typeof input==='string'?input:(input?.url||'');
  if(!url.includes('/api/mobile-candles'))return nativeFetch(input,init);
  const tf=selectedTf();
  if(!D[tf])return nativeFetch(input,init);
  try{
    const u=new URL(url,location.origin);u.searchParams.set('interval',SRC[tf]);u.searchParams.set('limit','1000');u.searchParams.set('requested',tf);
    const r=await nativeFetch(u.pathname+u.search,init);if(!r.ok)return r;
    const j=await r.clone().json();
    if(!j?.ok||!Array.isArray(j.candles))return r;
    const candles=aggregate(j.candles,tf);
    return new Response(JSON.stringify({...j,interval:tf,sourceInterval:SRC[tf],aligned:true,candles}),{status:r.status,statusText:r.statusText,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }catch{return nativeFetch(input,init)}
};
function officialBrand(){
  document.querySelectorAll('.officialBrand').forEach((b,i)=>{
    b.innerHTML=`<img class="officialQubicLogo" src="/qubic-logo-white.svg" alt="Qubic"><small class="officialSub">${i===0?'LIVE CHART':'LIVE CHART · unofficial analytics interface'}</small>`;
  });
}
function cleanUnsupportedSeconds(){
  ['tf','qtf'].forEach(id=>{const s=$(id);if(!s)return;[...s.options].forEach(o=>{if(/^(10|15|30|45)s$/.test(o.value||o.text))o.remove()})});
}
function markAligned(){
  const tf=selectedTf();const w=$('waterTf');if(w)w.textContent=tf;
  const toast=$('chartToast');if(toast)toast.textContent='EXCHANGE-ALIGNED · '+tf.toUpperCase();
}
const css=document.createElement('style');css.textContent=`.officialBrand{display:flex!important;align-items:center!important;gap:10px!important}.officialQubicLogo{width:126px!important;height:auto!important;display:block!important;object-fit:contain!important}.officialBrand.mini .officialQubicLogo{width:104px!important}.officialSub{display:block!important;color:#8b989f!important;font:800 7px ui-monospace!important;letter-spacing:.18em!important;white-space:nowrap!important}.restoredQubicMark,.restoredBrandText{display:none!important}@media(max-width:800px){.officialQubicLogo{width:118px!important}.officialBrand.mini .officialQubicLogo{width:96px!important}}`;document.head.appendChild(css);
function init(){officialBrand();cleanUnsupportedSeconds();markAligned();document.addEventListener('change',e=>{if(e.target?.id==='tf'||e.target?.id==='qtf')setTimeout(markAligned,50)});document.querySelectorAll('[data-tf]').forEach(b=>b.addEventListener('click',()=>setTimeout(markAligned,50)));setTimeout(officialBrand,50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();