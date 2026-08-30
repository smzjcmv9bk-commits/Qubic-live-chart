const TIMEOUT=6500;
const MAX_BARS=2600;
const SEC={ '1m':60,'5m':300,'15m':900,'30m':1800,'1h':3600,'4h':14400,'1d':86400 };
const ALLOWED=new Set(Object.keys(SEC));
async function get(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),TIMEOUT);try{const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{accept:'application/json','user-agent':'QubicLiveChart/SDCLRD'}});if(!r.ok)throw Error('Gate '+r.status);return await r.json()}finally{clearTimeout(t)}}
function parse(a,iv){const s=SEC[iv];return (Array.isArray(a)?a:[]).map(x=>{const raw=+x[0],time=Math.floor(raw/s)*s;return {time,open:+x[5],high:+x[3],low:+x[4],close:+x[2],volume:+x[1]||0}}).filter(x=>Number.isFinite(x.time)&&x.open>0&&x.high>0&&x.low>0&&x.close>0)}
module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Access-Control-Allow-Origin','*');
  const requested=String(req.query?.interval||'15m');
  if(!ALLOWED.has(requested))return res.status(400).json({ok:false,error:'Exact SDCLRD history unavailable for this timeframe',interval:requested,supported:[...ALLOWED],ts:Date.now()});
  const iv=requested;
  const wanted=Math.max(2200,Math.min(MAX_BARS,+req.query?.limit||2400));
  try{
    const all=new Map();let cursor=Math.floor(Date.now()/1000),pages=0;
    while(all.size<wanted&&pages<4){
      const take=Math.min(1000,wanted-all.size);
      const u=`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=QUBIC_USDT&interval=${encodeURIComponent(iv)}&limit=${take}&to=${cursor}`;
      const batch=parse(await get(u),iv);if(!batch.length)break;
      for(const x of batch)all.set(x.time,x);
      const earliest=Math.min(...batch.map(x=>x.time));if(!Number.isFinite(earliest)||earliest>=cursor)break;
      cursor=earliest-1;pages++;
    }
    const candles=[...all.values()].sort((a,b)=>a.time-b.time).slice(-wanted);
    if(candles.length<2200)return res.status(503).json({ok:false,error:'Not enough history for exact SDCLRD calculation',needed:2200,received:candles.length,interval:iv,pages,ts:Date.now()});
    return res.status(200).json({ok:true,interval:iv,source:'GATE',candles,pages,ts:Date.now()});
  }catch(e){return res.status(503).json({ok:false,error:String(e?.message||e),interval:iv,ts:Date.now()})}
}
