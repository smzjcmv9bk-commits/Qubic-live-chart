(()=>{
const $=id=>document.getElementById(id);
const SEC={'1m':60,'2m':120,'3m':180,'5m':300,'10m':600,'15m':900,'30m':1800,'45m':2700,'1h':3600,'2h':7200,'3h':10800,'4h':14400,'6h':21600,'8h':28800,'12h':43200,'1d':86400,'3d':259200,'1w':604800};
function londonOffset(ts){const d=new Date(ts*1000),p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d).reduce((o,x)=>(o[x.type]=x.value,o),{});return Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)/1000-ts}
function nextBoundary(tf,now=Math.floor(Date.now()/1000)){
  const sec=SEC[tf]||900,off=londonOffset(now),local=now+off;
  let nextLocal;
  if(tf==='1w'){
    const d=new Date(local*1000),dow=(d.getUTCDay()+6)%7;
    const midnight=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())/1000;
    nextLocal=midnight-dow*86400+7*86400;
  }else nextLocal=Math.floor(local/sec)*sec+sec;
  let utc=nextLocal-off;for(let i=0;i<3;i++)utc=nextLocal-londonOffset(utc);return utc;
}
function fmtLeft(s){s=Math.max(0,Math.floor(s));const d=Math.floor(s/86400);s%=86400;const h=Math.floor(s/3600);s%=3600;const m=Math.floor(s/60),q=s%60;return d?`${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(q).padStart(2,'0')}`:`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(q).padStart(2,'0')}`}
function fmtUK(ts){return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(ts*1000))}
function ensureCountdown(){let host=document.querySelector('.chartHeader');if(!host)return null;let el=$('candleCountdown');if(!el){el=document.createElement('div');el.id='candleCountdown';el.style.cssText='margin-left:auto;margin-right:8px;min-width:116px;padding:7px 9px;border:1px solid #29404d;border-radius:8px;background:#08111a;color:#dce8ee;text-align:center;font:800 8px ui-monospace;line-height:1.35';const actions=host.querySelector('.chartActions');host.insertBefore(el,actions||null)}return el}
function tick(){const tf=window.__QubicChartCore?.timeframe||$('qtf')?.value||$('tf')?.value||'15m',n=Math.floor(Date.now()/1000),end=nextBoundary(tf,n),el=ensureCountdown();if(el)el.innerHTML=`<span style="color:#79dff0">${tf.toUpperCase()} CANDLE</span><br><b style="font-size:11px">${fmtLeft(end-n)}</b><br><span style="color:#7d909d">closes ${fmtUK(end)} UK</span>`}
function repairIndicatorLabels(){document.querySelectorAll('label').forEach(l=>{if(/EMA\s*21/i.test(l.textContent||''))l.childNodes.forEach(n=>{if(n.nodeType===3)n.textContent=n.textContent.replace(/EMA\s*21/ig,'EMA 20')})})}
function init(){repairIndicatorLabels();tick();setInterval(tick,1000);window.addEventListener('qubic:timeframe',tick);['tf','qtf'].forEach(id=>$(id)?.addEventListener('change',tick));}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();