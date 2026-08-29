export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin','*');
  const c=new AbortController(),t=setTimeout(()=>c.abort(),6000),start=Date.now();
  try{
    const r=await fetch('https://rpc.qubic.org/v1/tick-info',{cache:'no-store',signal:c.signal,headers:{accept:'application/json','user-agent':'QubicLiveChart/2.0'}});
    if(!r.ok)throw Error(String(r.status));
    const d=await r.json(),x=d?.tickInfo||d||{};
    const tick=Number(x.tick??x.currentTick),epoch=Number(x.epoch),timestamp=x.timestamp||x.time||new Date().toISOString();
    res.status(200).json({ok:Number.isFinite(tick),tick:Number.isFinite(tick)?tick:null,epoch:Number.isFinite(epoch)?epoch:null,timestamp,latency:Date.now()-start,ts:Date.now()});
  }catch(e){res.status(503).json({ok:false,error:String(e?.message||e),latency:Date.now()-start,ts:Date.now()})}
  finally{clearTimeout(t)}
}
