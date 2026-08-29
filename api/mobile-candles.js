export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin','*');
  const c=new AbortController(),t=setTimeout(()=>c.abort(),5000);
  try{
    const r=await fetch('https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=QUBIC_USDT&interval=15m&limit=160',{cache:'no-store',signal:c.signal,headers:{accept:'application/json','user-agent':'QubicIntelligence/1.0'}});
    if(!r.ok)throw Error(String(r.status));
    const a=await r.json();
    const candles=(Array.isArray(a)?a:[]).map(x=>({time:+x[0],open:+x[5],high:+x[3],low:+x[4],close:+x[2],volume:+x[1]||0})).filter(x=>Number.isFinite(x.time)&&x.open>0&&x.high>0&&x.low>0&&x.close>0).sort((x,y)=>x.time-y.time);
    if(!candles.length)return res.status(503).json({ok:false,error:'No candles'});
    res.status(200).json({ok:true,candles,ts:Date.now()});
  }catch(e){res.status(503).json({ok:false,error:String(e?.message||e),ts:Date.now()})}
  finally{clearTimeout(t)}
}
