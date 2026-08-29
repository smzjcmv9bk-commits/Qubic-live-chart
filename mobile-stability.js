(()=>{
  const mobile=matchMedia('(max-width:800px)').matches||/iPhone|iPad|iPod/i.test(navigator.userAgent);
  const rawRender=typeof render==='function'?render:null,rawStats=typeof stats==='function'?stats:null;
  if(!rawRender||!rawStats)return;

  let renderQueued=false,statsQueued=false,lastRender=0,lastStats=0;
  const MIN_RENDER_MS=mobile?1400:300,MIN_STATS_MS=mobile?1800:600;

  render=function(){
    if(document.hidden||renderQueued)return;
    renderQueued=true;
    let wait=Math.max(0,MIN_RENDER_MS-(Date.now()-lastRender));
    setTimeout(()=>{
      renderQueued=false;
      if(document.hidden)return;
      lastRender=Date.now();
      requestAnimationFrame(()=>{try{rawRender()}catch(e){console.warn('render recovery',e)}});
    },wait);
  };

  stats=function(){
    if(document.hidden||statsQueued)return;
    statsQueued=true;
    let wait=Math.max(0,MIN_STATS_MS-(Date.now()-lastStats));
    setTimeout(()=>{
      statsQueued=false;
      if(document.hidden)return;
      lastStats=Date.now();
      try{rawStats()}catch(e){console.warn('stats recovery',e)};
    },wait);
  };

  /*
    iOS Safari was still receiving every websocket trade through add()->tick().
    Even though DOM rendering was throttled, LightweightCharts was therefore being
    updated on every Gate trade and the other exchange streams were still pushing
    work through add(). After several minutes Safari's main thread could stall.

    On mobile:
    - Gate remains the authoritative live chart source.
    - Non-Gate websocket trades are ignored here; multi-exchange flow continues to
      arrive through /api/live-trades in net-flow-v2, without touching the chart.
    - Gate chart updates are coalesced to at most one update every 1.2 seconds.
  */
  if(mobile){
    try{
      if(typeof add==='function'){
        const rawAdd=add;
        add=function(ex,p,q,side,ms=Date.now(),id=''){
          if(String(ex).toUpperCase()!=='GATE')return;
          return rawAdd(ex,p,q,side,ms,id);
        };
      }
    }catch(e){console.warn('mobile add throttle',e)}

    try{
      if(typeof tick==='function'){
        const rawTick=tick;
        let pending=null,timer=0,lastTick=0;
        tick=function(p,ms,usd,side){
          if(document.hidden)return;
          pending=[p,ms,usd,side];
          if(timer)return;
          const run=()=>{
            timer=0;
            if(document.hidden||!pending)return;
            const x=pending;pending=null;lastTick=Date.now();
            try{rawTick(...x)}catch(e){console.warn('chart tick recovery',e)}
          };
          const wait=Math.max(0,1200-(Date.now()-lastTick));
          timer=setTimeout(run,wait);
        };
      }
    }catch(e){console.warn('mobile tick throttle',e)}

    try{if(typeof mexc==='function')mexc=function(){}}catch{}
  }

  function trim(){
    if(!mobile)return;
    try{if(typeof T!=='undefined'&&T.length>450)T.length=450}catch{}
    try{if(typeof R!=='undefined'&&R.length>700)R.splice(0,R.length-700)}catch{}
    try{if(typeof seen!=='undefined'&&seen.size>1800){let n=seen.size-1200,i=0;for(const k of seen){seen.delete(k);if(++i>=n)break}}}catch{}
    try{if(typeof CVDM!=='undefined'&&CVDM.size>450){let n=CVDM.size-300,i=0;for(const k of CVDM.keys()){CVDM.delete(k);if(++i>=n)break}}}catch{}
    try{let rows=document.getElementById('rowLimit');if(rows&&+rows.value>30){rows.value='30';rawRender()}}catch{}
  }

  trim();
  setInterval(trim,15000);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){
      trim();
      setTimeout(()=>{try{rawStats();rawRender()}catch{}},300);
    }
  });
  window.addEventListener('pageshow',e=>{
    if(e.persisted){trim();setTimeout(()=>{try{rawStats();rawRender()}catch{}},350)}
  });
  window.QUBIC_MOBILE_STABILITY={active:true,mobile,renderMs:MIN_RENDER_MS,statsMs:MIN_STATS_MS,gateTickMs:mobile?1200:0,ts:Date.now()};
})();