export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin','*');
  const c=new AbortController(),t=setTimeout(()=>c.abort(),5500);
  try{
    const r=await fetch('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=QUBIC_USDT',{cache:'no-store',signal:c.signal,headers:{accept:'application/json','user-agent':'QubicLiveChart/2.0'}});
    if(!r.ok)throw Error(String(r.status));
    const x=(await r.json())?.[0]||{};
    const out={price:+x.last||null,change24:+x.change_percentage||null,high24:+x.high_24h||null,low24:+x.low_24h||null,baseVolume:+x.base_volume||null,quoteVolume:+x.quote_volume||null};
    res.status(200).json({ok:!!out.price,...out,ts:Date.now()});
  }catch(e){res.status(503).json({ok:false,error:String(e?.message||e),ts:Date.now()})}
  finally{clearTimeout(t)}
}
