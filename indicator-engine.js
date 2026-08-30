(()=>{
const $=id=>document.getElementById(id);
const PERIODS=[9,20,50,200];
let rows=[],chart=null,candle=null,loading=false,hooked=false,lastTf='';
const series={};

function clean(a){
  const m=new Map();
  for(const x of Array.isArray(a)?a:[]){
    const t=+x.time,c=+x.close,o=+x.open,h=+x.high,l=+x.low,v=+x.volume||0;
    if(!Number.isFinite(t)||!(c>0))continue;
    m.set(t,{time:t,open:o>0?o:c,high:h>0?h:c,low:l>0?l:c,close:c,volume:v});
  }
  return [...m.values()].sort((a,b)=>a.time-b.time);
}
function ema(a,n){
  if(a.length<n)return[];
  const k=2/(n+1),out=[];
  let v=a.slice(0,n).reduce((s,x)=>s+x.close,0)/n;
  out.push({time:a[n-1].time,value:v});
  for(let i=n;i<a.length;i++){v=a[i].close*k+v*(1-k);out.push({time:a[i].time,value:v})}
  return out;
}
function reg(a){
  const n=Math.min(120,a.length);if(n<20)return{mid:[],up:[],dn:[]};
  const z=a.slice(-n),sx=n*(n-1)/2,sxx=(n-1)*n*(2*n-1)/6,sy=z.reduce((s,x)=>s+x.close,0),sxy=z.reduce((s,x,i)=>s+i*x.close,0),den=n*sxx-sx*sx;
  if(!den)return{mid:[],up:[],dn:[]};
  const slope=(n*sxy-sx*sy)/den,intercept=(sy-slope*sx)/n;
  const residual=z.map((x,i)=>x.close-(intercept+slope*i));
  const sd=Math.sqrt(residual.reduce((s,x)=>s+x*x,0)/Math.max(1,n-2));
  const mid=z.map((x,i)=>({time:x.time,value:intercept+slope*i}));
  return{mid,up:mid.map(x=>({time:x.time,value:x.value+2*sd})),dn:mid.map(x=>({time:x.time,value:x.value-2*sd}))};
}
function color(n){return document.querySelector(`.emaColor[data-ema="${n}"]`)?.value||'#ffffff'}
function addLine(opts){
  if(!chart?.addLineSeries)return null;
  return chart.addLineSeries({lastValueVisible:true,priceLineVisible:false,crosshairMarkerVisible:false,lineWidth:2,priceFormat:{type:'price',precision:10,minMove:.0000000001},...opts});
}
function ensureSeries(){
  const c=window.__QubicChart;
  if(!c)return false;
  if(chart!==c){chart=c;for(const k of Object.keys(series))delete series[k]}
  for(const n of PERIODS){if(!series[n])series[n]=addLine({color:color(n),lineWidth:n===200?3:2,visible:false,title:`EMA ${n}`})}
  if(!series.regMid){
    series.regMid=addLine({color:'#6fdff0',lineWidth:2,visible:false,title:'SD REG'});
    series.regUp=addLine({color:'#6fdff0',lineWidth:1,lineStyle:2,visible:false,title:'SD +2'});
    series.regDn=addLine({color:'#6fdff0',lineWidth:1,lineStyle:2,visible:false,title:'SD -2'});
  }
  return PERIODS.every(n=>!!series[n])&&!!series.regMid;
}
function draw(){
  if(!rows.length||!ensureSeries())return false;
  for(const n of PERIODS){
    const on=!!$(`ema${n}`)?.checked;
    try{series[n].setData(ema(rows,n));series[n].applyOptions({visible:on,color:color(n),lineWidth:n===200?3:2})}catch(e){console.warn('indicator EMA',n,e)}
  }
  const r=reg(rows),on=!!$('cvdToggle')?.checked;
  try{series.regMid.setData(r.mid);series.regUp.setData(r.up);series.regDn.setData(r.dn);series.regMid.applyOptions({visible:on});series.regUp.applyOptions({visible:on});series.regDn.applyOptions({visible:on})}catch(e){console.warn('indicator regression',e)}
  try{window.__QubicVolumeSeries?.applyOptions({visible:!!$('volToggle')?.checked})}catch{}
  const ant=$('antStatus');if(ant)ant.style.display=$('antToggle')?.checked?'':'none';
  window.__QubicIndicatorStatus={ready:true,timeframe:lastTf,rows:rows.length,enabled:PERIODS.filter(n=>$(`ema${n}`)?.checked),regression:on,updatedAt:Date.now()};
  return true;
}
function hookCandleSeries(){
  const s=window.__QubicCandleSeries;
  if(!s||s===candle||typeof s.setData!=='function')return false;
  candle=s;hooked=true;
  const native=s.setData.bind(s);
  s.setData=data=>{const out=native(data);const next=clean(data);if(next.length){rows=next;lastTf=window.__QubicChartCore?.timeframe||$('tf')?.value||'15m';setTimeout(draw,0)}return out};
  return true;
}
async function refresh(){
  if(loading)return;loading=true;
  try{
    hookCandleSeries();ensureSeries();
    const tf=window.__QubicChartCore?.timeframe||$('qtf')?.value||$('tf')?.value||'15m';
    lastTf=tf;
    const r=await fetch(`/api/active-candles?interval=${encodeURIComponent(tf)}&limit=1000&indicator=1&t=${Date.now()}`,{cache:'no-store'});
    const j=await r.json();
    if(r.ok&&j?.ok&&Array.isArray(j.candles)&&j.candles.length){rows=clean(j.candles);draw()}
  }catch(e){console.warn('indicator refresh',e)}finally{loading=false}
}
function save(id,v){try{localStorage.setItem('qIndicator:'+id,String(v))}catch{}}
function restore(id,d){try{const v=localStorage.getItem('qIndicator:'+id);return v==null?d:v==='true'}catch{return d}}
function bind(){
  try{const old=localStorage.getItem('qIndicator:ema21');if(localStorage.getItem('qIndicator:ema20')==null&&old!=null)localStorage.setItem('qIndicator:ema20',old);localStorage.removeItem('qIndicator:ema21')}catch{}
  for(const n of PERIODS){
    const box=$(`ema${n}`);if(box){box.checked=restore(`ema${n}`,false);box.addEventListener('change',()=>{save(`ema${n}`,box.checked);draw();if(!rows.length)refresh()})}
    document.querySelector(`.emaColor[data-ema="${n}"]`)?.addEventListener('input',draw);
  }
  for(const [id,d] of [['volToggle',true],['cvdToggle',true],['antToggle',true]]){const e=$(id);if(e){e.checked=restore(id,d);e.addEventListener('change',()=>{save(id,e.checked);draw()})}}
  window.addEventListener('qubic:timeframe',()=>setTimeout(refresh,80));
  ['tf','qtf'].forEach(id=>$(id)?.addEventListener('change',()=>setTimeout(refresh,100)));
  document.querySelectorAll('#quickTf [data-tf]').forEach(b=>b.addEventListener('click',()=>setTimeout(refresh,120)));
  let n=0;const ready=setInterval(()=>{n++;hookCandleSeries();if(ensureSeries()){clearInterval(ready);refresh()}else if(n>200)clearInterval(ready)},100);
  setTimeout(refresh,450);setInterval(()=>{if(!document.hidden)refresh()},15000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.__QubicIndicators={refresh,draw,get rows(){return rows.slice()},get status(){return window.__QubicIndicatorStatus||{ready:false}}};
})();