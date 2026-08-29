(()=>{
  const mobile=matchMedia('(max-width:800px)').matches||/iPhone|iPad|iPod/i.test(navigator.userAgent);
  const rawRender=typeof render==='function'?render:null,rawStats=typeof stats==='function'?stats:null;
  if(!rawRender||!rawStats)return;

  let renderQueued=false,statsQueued=false,lastRender=0,lastStats=0;
  const MIN_RENDER_MS=mobile?1800:300,MIN_STATS_MS=mobile?2200:600;

  render=function(){
    if(document.hidden||renderQueued)return;
    renderQueued=true;
    const wait=Math.max(0,MIN_RENDER_MS-(Date.now()-lastRender));
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
    const wait=Math.max(0,MIN_STATS_MS-(Date.now()-lastStats));
    setTimeout(()=>{
      statsQueued=false;
      if(document.hidden)return;
      lastStats=Date.now();
      try{rawStats()}catch(e){console.warn('stats recovery',e)};
    },wait);
  };

  if(mobile){
    /* Gate remains the direct chart source, but process only the newest Gate trade
       every 1.5s. This caps array writes, chart work, stats/render requests and
       sound generation at the source instead of merely throttling the UI later. */
    try{
      if(typeof add==='function'){
        const rawAdd=add;
        let pending=null,timer=0,lastAdd=0;
        add=function(ex,p,q,side,ms=Date.now(),id=''){
          if(String(ex).toUpperCase()!=='GATE')return;
          pending=[ex,p,q,side,ms,id];
          if(timer)return;
          const run=()=>{
            timer=0;
            if(document.hidden||!pending)return;
            const x=pending;pending=null;lastAdd=Date.now();
            try{rawAdd(...x)}catch(e){console.warn('mobile add recovery',e)}
          };
          timer=setTimeout(run,Math.max(0,1500-(Date.now()-lastAdd)));
        };
      }
    }catch(e){console.warn('mobile add throttle',e)}

    /* Extra guard for any direct chart tick path. */
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
          timer=setTimeout(run,Math.max(0,1500-(Date.now()-lastTick)));
        };
      }
    }catch(e){console.warn('mobile tick throttle',e)}

    /* Sound was a hidden hotspot: each qualifying trade created a new oscillator.
       Keep the feature, but never create more than one sound node per second. */
    try{
      if(typeof sound==='function'){
        const rawSound=sound;
        let lastSound=0;
        sound=function(side,usd){
          const now=Date.now();
          if(now-lastSound<1000)return;
          lastSound=now;
          try{return rawSound(side,usd)}catch(e){console.warn('sound recovery',e)}
        };
      }
    }catch(e){console.warn('mobile sound throttle',e)}

    try{if(typeof mexc==='function')mexc=function(){}}catch{}
  }

  function trim(){
    if(!mobile)return;
    try{if(typeof T!=='undefined'&&T.length>250)T.length=250}catch{}
    try{if(typeof R!=='undefined'&&R.length>400)R.splice(0,R.length-400)}catch{}
    try{if(typeof seen!=='undefined'&&seen.size>900){let n=seen.size-600,i=0;for(const k of seen){seen.delete(k);if(++i>=n)break}}}catch{}
    try{if(typeof CVDM!=='undefined'&&CVDM.size>220){let n=CVDM.size-150,i=0;for(const k of CVDM.keys()){CVDM.delete(k);if(++i>=n)break}}}catch{}
    try{let rows=document.getElementById('rowLimit');if(rows&&+rows.value>20){rows.value='20';rawRender()}}catch{}
  }

  trim();
  setInterval(trim,15000);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){
      trim();
      setTimeout(()=>{try{rawStats();rawRender()}catch{}},350);
    }
  });
  window.addEventListener('pageshow',e=>{
    if(e.persisted){trim();setTimeout(()=>{try{rawStats();rawRender()}catch{}},400)}
  });
  window.QUBIC_MOBILE_STABILITY={active:true,mobile,renderMs:MIN_RENDER_MS,statsMs:MIN_STATS_MS,gateIngestMs:mobile?1500:0,soundMs:mobile?1000:0,ts:Date.now()};
})();