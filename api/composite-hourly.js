const timeout=(p,ms=6500)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))]);
const get=async u=>{const r=await timeout(fetch(u,{cache:'no-store',headers:{accept:'application/json','user-agent':'QubicBPPV2/2.0'}}));if(!r.ok)throw Error(`${r.status}`);return r.json()};
const hour=t=>Math.floor((+t<1e12?+t:+t/1000)/3600)*3600;
const med=a=>{const x=a.filter(Number.isFinite).sort((a,b)=>a-b);if(!x.length)return NaN;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2};
const parseGate=a=>a.map(x=>({time:hour(x[0]),open:+x[5],high:+x[3],low:+x[4],close:+x[2],volume:+x[1]||0,ex:'GATE'}));
const parseMexc=a=>a.map(x=>({time:hour(x[0]),open:+x[1],high:+x[2],low:+x[3],close:+x[4],volume:+x[5]||0,ex:'MEXC'}));
const parseBitget=x=>(x.data||[]).map(v=>({time:hour(v[0]),open:+v[1],high:+v[2],low:+v[3],close:+v[4],volume:+v[5]||0,ex:'BITGET'}));
const parseCoinex=x=>(x.data||[]).map(v=>({time:hour(v.created_at||v.createdAt),open:+v.open,high:+v.high,low:+v.low,close:+v.close,volume:+v.volume||0,ex:'COINEX'}));
module.exports=async function handler(req,res){res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('Access-Control-Allow-Origin','*');const limit=Math.max(300,Math.min(1000,+req.query?.limit||1000));const jobs=[
 ['GATE',get(`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=QUBIC_USDT&interval=1h&limit=${limit}`).then(parseGate)],
 ['MEXC',get(`https://api.mexc.com/api/v3/klines?symbol=QUBICUSDT&interval=60m&limit=${limit}`).then(parseMexc)],
 ['BITGET',get(`https://api.bitget.com/api/v2/spot/market/candles?symbol=QUBICUSDT&granularity=1h&limit=${limit}`).then(parseBitget)],
 ['COINEX',get(`https://api.coinex.com/v2/spot/kline?market=QUBICUSDT&period=1hour&limit=${limit}`).then(parseCoinex)]
];
const settled=await Promise.allSettled(jobs.map(x=>x[1]));const feeds={},errors={};settled.forEach((r,i)=>{const k=jobs[i][0];if(r.status==='fulfilled')feeds[k]=(r.value||[]).filter(c=>c.time&&c.open>0&&c.high>0&&c.low>0&&c.close>0);else errors[k]=String(r.reason?.message||r.reason)});
const by=new Map();for(const rows of Object.values(feeds))for(const c of rows){if(!by.has(c.time))by.set(c.time,[]);by.get(c.time).push(c)}
const candles=[];for(const [time,rows] of [...by.entries()].sort((a,b)=>a[0]-b[0])){if(rows.length<2)continue;const closes=rows.map(x=>x.close),m=med(closes);const dev=med(closes.map(x=>Math.abs(x-m)))/(m||1);candles.push({time,open:med(rows.map(x=>x.open)),high:med(rows.map(x=>x.high)),low:med(rows.map(x=>x.low)),close:m,volume:rows.reduce((s,x)=>s+x.volume,0),sources:rows.length,agreement:Math.max(0,1-Math.min(1,dev*250))})}
const out=candles.slice(-limit);if(out.length<250)return res.status(503).json({ok:false,error:'Not enough overlapping multi-exchange hourly history',counts:Object.fromEntries(Object.entries(feeds).map(([k,v])=>[k,v.length])),errors,ts:Date.now()});
const latest=out.at(-1);res.status(200).json({ok:true,source:'MULTI-EXCHANGE MEDIAN',exchanges:Object.keys(feeds),counts:Object.fromEntries(Object.entries(feeds).map(([k,v])=>[k,v.length])),errors,candles:out,latestAgreement:latest?.agreement??null,ts:Date.now()});}
