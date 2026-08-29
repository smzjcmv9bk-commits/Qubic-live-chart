(()=>{
/* Authoritative Gate QUBIC/USDT OHLC layer. Keeps multi-exchange trades for tape/flow only. */
const native={"10s":10,"15s":15,"30s":30,"45s":45,"1m":60,"2m":120,"3m":180,"5m":300,"10m":600,"15m":900,"30m":1800,"45m":2700,"1h":3600,"2h":7200,"3h":10800,"4h":14400,"6h":21600,"8h":28800,"12h":43200,"1d":86400,"3d":259200,"1w":604800};
const gateIntervals={60:'1m',300:'5m',900:'15m',1800:'30m',3600:'1h',14400:'4h',86400:'1d'};
let req=0,timer=null;
function selected(){return document.getElementById('qtf')?.value||document.getElementById('tf')?.value||'15m'}
function setLabels(v){let a=document.getElementById('qtf'),b=document.getElementById('tf'),w=document.getElementById('waterTf');if(a&&a.value!==v)a.value=v;if(b&&b.value!==v)b.value=v;if(w)w.textContent=v;document.querySelectorAll('#quickTf button').forEach(x=>x.classList.toggle('active',x.dataset.tf===v))}
function baseFor(sec){let keys=Object.keys(gateIntervals).map(Number).filter(x=>x<=sec&&sec%x===0).sort((a,b)=>b-a);return keys[0]||60}
function aggregate(rows,target){let m=new Map;rows.sort((a,b)=>a.time-b.time).forEach(x=>{let k=Math.floor(x.time/target)*target,b=m.get(k);if(!b)m.set(k,{...x,time:k});else{b.high=Math.max(b.high,x.high);b.low=Math.min(b.low,x.low);b.close=x.close;b.volume+=x.volume}});return [...m.values()].sort((a,b)=>a.time-b.time)}
async function load(){let my=++req,v=selected(),sec=native[v]||900;setLabels(v);if(v.endsWith('s'))return;let base=baseFor(sec),interval=gateIntervals[base],limit=Math.min(1000,Math.max(250,Math.ceil(604800/base)+10));try{let r=await fetch(`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=QUBIC_USDT&interval=${interval}&limit=${limit}`,{cache:'no-store'});if(!r.ok)throw Error(r.status);let raw=await r.json();if(my!==req||selected()!==v)return;let rows=raw.map(x=>({time:+x[0],open:+x[5],high:+x[3],low:+x[4],close:+x[2],volume:+x[1]||0}));let d=aggregate(rows,sec);if(!d.length)return;B.clear();d.forEach(x=>B.set(x.time,x));candles.setData(d);vol.setData(d.map(x=>({time:x.time,value:x.volume,color:x.close>=x.open?'rgba(88,223,120,.65)':'rgba(255,92,98,.65)'})));syncType();}catch(e){console.warn('authoritative candle refresh',e)}}
/* Prevent multi-exchange tape trades from mutating authoritative OHLC. */
const oldTick=tick;tick=function(p,ms,usd,side){if(selected().endsWith('s'))return oldTick(p,ms,usd,side)};
function bind(id){let e=document.getElementById(id);if(!e)return;e.addEventListener('change',()=>{setLabels(e.value);setTimeout(load,80)})}
bind('qtf');bind('tf');document.querySelectorAll('#quickTf button').forEach(b=>b.addEventListener('click',()=>{setLabels(b.dataset.tf);setTimeout(load,80)}));
/* Refresh current exchange candle; exchange OHLC remains the single source of truth. */
timer=setInterval(load,4000);setTimeout(load,700);
})();