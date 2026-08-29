export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin','*');
  const allowed=new Set(['1m','5m','15m','30m','1h','4h','1d']);
  const interval=allowed.has(String(req.query?.interval||''))?String(req.query.interval):'15m';
  const seconds={ '1m':60,'5m':300,'15m':900,'30m':1800,'1h':3600,'4h':14400,'1d':86400 }[interval]||900;
  const limit=Math.max(60,Math.min(1000,Number(req.query?.limit)||320));
  const c=new AbortController(),t=setTimeout(()=>c.abort(),6000);
  try{
    const url='https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=QUBIC_USDT&interval='+encodeURIComponent(interval)+'&limit='+limit;
    const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{accept:'application/json','user-agent':'QubicLiveChart/2.1'}});
    if(!r.ok)throw Error(String(r.status));
    const a=await r.json();
    const candles=(Array.isArray(a)?a:[]).map(x=>{const raw=+x[0];const time=Math.floor(raw/seconds)*seconds;return {time,open:+x[5],high:+x[3],low:+x[4],close:+x[2],volume:+x[1]||0}}).filter(x=>Number.isFinite(x.time)&&x.open>0&&x.high>0&&x.low>0&&x.close>0).sort((x,y)=>x.time-y.time);
    if(!candles.length)return res.status(503).json({ok:false,error:'No candles',interval,ts:Date.now()});
    res.status(200).json({ok:true,interval,aligned:true,boundarySeconds:seconds,candles,ts:Date.now()});
  }catch(e){res.status(503).json({ok:false,error:String(e?.message||e),interval,ts:Date.now()})}
  finally{clearTimeout(t)}
}
