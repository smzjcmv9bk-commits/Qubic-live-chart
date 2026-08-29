(()=>{
  const mobile=matchMedia('(max-width:800px)').matches||/iPhone|iPad|iPod/i.test(navigator.userAgent);
  const rawRender=typeof render==='function'?render:null,rawStats=typeof stats==='function'?stats:null;
  if(!rawRender||!rawStats)return;
  let renderQueued=false,statsQueued=false,lastRender=0,lastStats=0;
  const MIN_RENDER_MS=mobile?900:300,MIN_STATS_MS=mobile?1200:600;
  render=function(){if(document.hidden||renderQueued)return;renderQueued=true;let wait=Math.max(0,MIN_RENDER_MS-(Date.now()-lastRender));setTimeout(()=>{renderQueued=false;if(document.hidden)return;lastRender=Date.now();requestAnimationFrame(()=>{try{rawRender()}catch(e){console.warn('render recovery',e)}})},wait)};
  stats=function(){if(document.hidden||statsQueued)return;statsQueued=true;let wait=Math.max(0,MIN_STATS_MS-(Date.now()-lastStats));setTimeout(()=>{statsQueued=false;if(document.hidden)return;lastStats=Date.now();try{rawStats()}catch(e){console.warn('stats recovery',e)}},wait)};
  function trim(){if(!mobile)return;try{if(typeof T!=='undefined'&&T.length>1000)T.length=1000}catch{}try{if(typeof R!=='undefined'&&R.length>1800)R.splice(0,R.length-1800)}catch{}try{if(typeof seen!=='undefined'&&seen.size>4000){let n=seen.size-3000,i=0;for(const k of seen){seen.delete(k);if(++i>=n)break}}}catch{}try{if(typeof CVDM!=='undefined'&&CVDM.size>1200){let n=CVDM.size-900,i=0;for(const k of CVDM.keys()){CVDM.delete(k);if(++i>=n)break}}}catch{}try{let rows=document.getElementById('rowLimit');if(rows&&+rows.value>50){rows.value='50';rawRender()}}catch{}}
  trim();setInterval(trim,10000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){trim();setTimeout(()=>{try{rawStats();rawRender()}catch{}},200)}});
  window.addEventListener('pageshow',e=>{if(e.persisted){trim();setTimeout(()=>{try{rawStats();rawRender()}catch{}},250)}});
  window.QUBIC_MOBILE_STABILITY={active:true,mobile,renderMs:MIN_RENDER_MS,statsMs:MIN_STATS_MS,ts:Date.now()};
})();