module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  const timeout=(p,ms=3500)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
  const get=async u=>{let r=await timeout(fetch(u,{headers:{'user-agent':'QubicLiveChart/1.0'}}));if(!r.ok)throw new Error(String(r.status));return r.json()};
  const out=[]; const status={}; const now=Date.now();
  const push=(ex,p,q,s,t,id)=>{p=+p;q=+q;t=+t||now;if(t<1e12)t*=1000;if(p>0&&q>0&&t>now-10*60*1000&&t<now+60000)out.push({ex,p,q,s:String(s).toLowerCase().includes('sell')?'sell':'buy',t,id:String(id||'')})};
  const jobs=[
    ['GATE',async()=>{let a=await get('https://api.gateio.ws/api/v4/spot/trades?currency_pair=QUBIC_USDT&limit=100');a.forEach(x=>push('GATE',x.price,x.amount,x.side,x.create_time_ms||x.create_time,x.id));}],
    ['MEXC',async()=>{let a=await get('https://api.mexc.com/api/v3/trades?symbol=QUBICUSDT&limit=100');a.forEach(x=>push('MEXC',x.price,x.qty,x.isBuyerMaker?'sell':'buy',x.time,x.id));}],
    ['BITGET',async()=>{let x=await get('https://api.bitget.com/api/v2/spot/market/fills?symbol=QUBICUSDT&limit=100');let a=x.data||[];a.forEach(v=>push('BITGET',v.price||v.px,v.size||v.sz,v.side,v.ts||v.time,v.tradeId||v.id));}],
    ['COINEX',async()=>{let x=await get('https://api.coinex.com/v2/spot/deals?market=QUBICUSDT&limit=100');let a=x.data||[];a.forEach(v=>push('COINEX',v.price,v.amount,v.side,v.created_at||v.createdAt||v.time,v.deal_id||v.id));}],
    ['LBANK',async()=>{let x=await get('https://api.lbkex.com/v2/trades.do?symbol=qubic_usdt&size=100');let a=x.data||[];a.forEach(v=>push('LBANK',v.price,v.amount||v.volume,v.type==='sell'||v.direction==='sell'?'sell':'buy',v.date_ms||v.date||v.time,v.tid||v.id));}]
  ];
  await Promise.all(jobs.map(async([n,fn])=>{try{await fn();status[n]=true}catch(e){status[n]=false}}));
  out.sort((a,b)=>a.t-b.t);
  res.status(200).json({ok:true,ts:now,status,trades:out.slice(-350)});
}