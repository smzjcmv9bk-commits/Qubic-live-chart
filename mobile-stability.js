(()=>{
  // The trade tape used to rebuild up to 100 rows plus the volume board on every
  // individual trade. On active feeds this can create hundreds of DOM mutations
  // per minute and eventually overwhelm mobile Safari. Keep market ingestion live,
  // but batch visual rendering to a maximum of 4 frames/sec.
  const rawRender=typeof render==='function'?render:null;
  const rawStats=typeof stats==='function'?stats:null;
  if(!rawRender||!rawStats)return;

  let renderTimer=0, renderQueued=false, lastRender=0;
  let statsTimer=0, statsQueued=false, lastStats=0;
  const MIN_RENDER_MS=250;
  const MIN_STATS_MS=500;

  render=function(){
    if(document.hidden)return;
    if(renderQueued)return;
    renderQueued=true;
    const wait=Math.max(0,MIN_RENDER_MS-(Date.now()-lastRender));
    renderTimer=setTimeout(()=>{
      renderQueued=false;
      if(document.hidden)return;
      lastRender=Date.now();
      requestAnimationFrame(()=>{try{rawRender()}catch(e){console.warn('render recovery',e)}});
    },wait);
  };

  stats=function(){
    if(document.hidden)return;
    if(statsQueued)return;
    statsQueued=true;
    const wait=Math.max(0,MIN_STATS_MS-(Date.now()-lastStats));
    statsTimer=setTimeout(()=>{
      statsQueued=false;
      if(document.hidden)return;
      lastStats=Date.now();
      try{rawStats()}catch(e){console.warn('stats recovery',e)}
    },wait);
  };

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){
      try{rawStats()}catch{}
      try{rawRender()}catch{}
    }
  });

  // Self-heal the most important live panels if a transient DOM/data error occurs.
  setInterval(()=>{
    if(document.hidden)return;
    const app=document.querySelector('.app');
    const chart=document.getElementById('qchart');
    const trades=document.getElementById('trades');
    if(!app||!chart||!trades)return;
    if(!document.getElementById('predictionPanel')){
      const old=document.querySelector('script[data-pred-v9]');
      if(!old){
        const s=document.createElement('script');
        s.src='/prediction-v9.js?v=4';
        s.dataset.predV9='1';
        document.body.appendChild(s);
      }
    }
  },15000);
})();