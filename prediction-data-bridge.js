(()=>{
const baseFetch=window.fetch.bind(window);
const gateNeedle='api.gateio.ws/api/v4/spot/candlesticks';
window.fetch=async(input,init)=>{
  const raw=typeof input==='string'?input:(input?.url||'');
  if(!raw.includes(gateNeedle)) return baseFetch(input,init);
  try{
    const u=new URL(raw,location.origin);
    const interval=u.searchParams.get('interval')||'15m';
    const limit=Math.min(1000,Math.max(60,+u.searchParams.get('limit')||300));
    const local=`/api/active-candles?interval=${encodeURIComponent(interval)}&limit=${limit}&prediction=1&t=${Date.now()}`;
    const r=await baseFetch(local,{...(init||{}),cache:'no-store'});
    if(!r.ok) throw new Error('internal candles '+r.status);
    const j=await r.json();
    if(!j?.ok||!Array.isArray(j.candles)||j.candles.length<60) throw new Error('internal candle history unavailable');
    const gateShape=j.candles.map(x=>[
      +x.time,
      +x.volume||0,
      +x.close,
      +x.high,
      +x.low,
      +x.open
    ]);
    window.__QubicPredictionSource={source:String(j.source||'MULTI').toUpperCase(),interval,updatedAt:Date.now()};
    return new Response(JSON.stringify(gateShape),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }catch(e){
    console.warn('prediction data bridge fallback',e);
    return baseFetch(input,init);
  }
};
})();