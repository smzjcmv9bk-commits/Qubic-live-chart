(()=>{
'use strict';
const VERSION='chart-markers-v1';
const TF={
 '1m':60,'2m':120,'3m':180,'5m':300,'10m':600,'15m':900,'30m':1800,'45m':2700,
 '1h':3600,'2h':7200,'3h':10800,'4h':14400,'6h':21600,'8h':28800,'12h':43200,
 '1d':86400,'3d':259200,'1w':604800
};
const londonPartsFmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
let lastKey='';
function timeframe(){return String(window.__QubicChartCore?.timeframe||document.getElementById('qtf')?.value||document.getElementById('tf')?.value||'15m')}
function londonOffsetSec(ts){const d=new Date(+ts*1000),p=londonPartsFmt.formatToParts(d).reduce((o,x)=>(o[x.type]=x.value,o),{}),asUTC=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)/1000;return asUTC-(+ts)}
function bucket(ts,tf){const sec=TF[tf]||900,off=londonOffsetSec(ts),local=ts+off;if(tf==='1w'){const d=new Date(local*1000),dow=(d.getUTCDay()+6)%7,mid=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())/1000,start=mid-dow*86400;let g=start-off;for(let i=0;i<2;i++)g=start-londonOffsetSec(g);return g}const localBucket=Math.floor(local/sec)*sec;let g=localBucket-off;for(let i=0;i<2;i++)g=localBucket-londonOffsetSec(g);return g}
function read(){let history=[],open=null;try{if(window.QUBIC_PAPER_BOT){history=window.QUBIC_PAPER_BOT.history?.()||[];open=window.QUBIC_PAPER_BOT.open?.()||null}else{history=JSON.parse(localStorage.getItem('qPaperTradesV1')||'[]');open=JSON.parse(localStorage.getItem('qPaperOpenV1')||'null')}}catch{}return{history:Array.isArray(history)?history:[],open}}
function entryMarker(t,tf){const buy=t.side==='BUY';return{time:bucket((+t.openedAt||0)/1000,tf),position:buy?'belowBar':'aboveBar',color:buy?'#00d084':'#ff4d5e',shape:buy?'arrowUp':'arrowDown',text:`BOT ${buy?'BUY':'SELL'} ${Number.isFinite(+t.entry)?(+t.entry).toPrecision(6):''}`.trim(),size:2}}
function exitMarker(t,tf){if(!t.closedAt)return null;const good=(+t.resultPct||0)>=0;return{time:bucket((+t.closedAt||0)/1000,tf),position:t.side==='BUY'?'aboveBar':'belowBar',color:good?'#21c77a':'#ff6b78',shape:'circle',text:`EXIT ${good?'+':''}${(+t.resultPct||0).toFixed(2)}%`,size:1}}
function markers(){const s=window.__QubicCandleSeries;if(!s||typeof s.setMarkers!=='function')return false;const tf=timeframe(),{history,open}=read(),events=[];history.slice(-80).forEach(t=>{if(t?.openedAt)events.push({...entryMarker(t,tf),_o:0,_id:String(t.id||t.openedAt)});const x=exitMarker(t,tf);if(x)events.push({...x,_o:1,_id:String(t.id||t.openedAt)})});if(open?.openedAt)events.push({...entryMarker(open,tf),text:`OPEN ${open.side} ${Number.isFinite(+open.entry)?(+open.entry).toPrecision(6):''}`.trim(),_o:0,_id:String(open.id||open.openedAt)});events.sort((a,b)=>a.time-b.time||a._o-b._o||a._id.localeCompare(b._id));const clean=events.map(({_o,_id,...m})=>m),key=tf+'|'+JSON.stringify(clean);if(key===lastKey)return true;try{s.setMarkers(clean);lastKey=key;window.__QubicPaperChartMarkers={version:VERSION,timeframe:tf,count:clean.length,updatedAt:Date.now()};return true}catch(e){console.warn('paper chart markers',e);return false}}
function tick(){markers()}
window.addEventListener('qubic:timeframe',()=>{lastKey='';setTimeout(tick,350)});
setInterval(tick,2500);setTimeout(tick,2200);
window.QUBIC_PAPER_MARKERS={version:VERSION,refresh:()=>{lastKey='';return markers()}};
})();