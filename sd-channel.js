(()=>{
  let cfg={mode:'auto',period:200,sdBars:2000,multi:2};
  try{cfg={...cfg,...JSON.parse(localStorage.getItem('sdclrdSettings')||'{}')}}catch{}
  let top,middle,bottom,enabled=true,lastSig='';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function autoSettings(){
    const sec=(typeof TF!=='undefined'&&TF[tf])||900,available=B?.size||0;
    let period,sdBars,multi;
    if(sec<=30)[period,sdBars,multi]=[120,720,2.4];
    else if(sec<=60)[period,sdBars,multi]=[150,1000,2.3];
    else if(sec<=300)[period,sdBars,multi]=[180,1400,2.2];
    else if(sec<=900)[period,sdBars,multi]=[200,1800,2.1];
    else if(sec<=3600)[period,sdBars,multi]=[200,2000,2];
    else if(sec<=14400)[period,sdBars,multi]=[160,1400,1.9];
    else if(sec<=86400)[period,sdBars,multi]=[120,900,1.8];
    else [period,sdBars,multi]=[80,600,1.7];
    if(available){period=clamp(Math.min(period,Math.max(20,Math.floor(available*.32))),20,500);const usable=Math.max(20,available-period);sdBars=Math.max(20,Math.min(sdBars,usable))}
    return{period,sdBars,multi};
  }
  function active(){return cfg.mode==='auto'?autoSettings():{period:clamp(Math.round(+cfg.period||200),20,500),sdBars:clamp(Math.round(+cfg.sdBars||2000),20,5000),multi:clamp(+cfg.multi||2,.1,10)}}
  function ensure(){if(top)return;const common={lineWidth:2,lastValueVisible:false,priceLineVisible:false,crosshairMarkerVisible:false};top=chart.addLineSeries({...common,color:'rgba(38,132,255,.9)'});middle=chart.addLineSeries({...common,lineWidth:1,color:'rgba(38,132,255,.44)'});bottom=chart.addLineSeries({...common,color:'rgba(38,132,255,.9)'})}
  function regression(vals,len){const out=new Array(vals.length).fill(NaN),n=len,sx=(n-1)*n/2,sxx=(n-1)*n*(2*n-1)/6,den=n*sxx-sx*sx;let sy=0,sxy=0;for(let i=0;i<vals.length;i++){const y=vals[i];if(i<n){sy+=y;sxy+=i*y;if(i===n-1){const slope=den?(n*sxy-sx*sy)/den:0;out[i]=(sy-slope*sx)/n+slope*(n-1)}}else{const old=vals[i-n],oldSy=sy;sy=oldSy-old+y;sxy=sxy-(oldSy-old)+(n-1)*y;const slope=den?(n*sxy-sx*sy)/den:0;out[i]=(sy-slope*sx)/n+slope*(n-1)}}return out}
  function calculate(){
    ensure();const S=active(),d=[...B.values()].sort((a,b)=>a.time-b.time);updateStatus(S,d.length);
    if(d.length<S.period+2){top.setData([]);middle.setData([]);bottom.setData([]);return}
    const vals=d.map(x=>(x.high+x.low+x.close)/3),regs=regression(vals,S.period),dist=new Array(d.length).fill(NaN);
    for(let i=S.period-1;i<d.length;i++){const r=regs[i];if(Number.isFinite(r)&&r!==0)dist[i]=Math.abs((vals[i]-r)/r*100)}
    const T=[],M=[],L=[];let sum=0,sumSq=0,count=0;const queue=[];
    for(let i=S.period-1;i<d.length;i++){
      const v=dist[i];if(Number.isFinite(v)){queue.push(v);sum+=v;sumSq+=v*v;count++}else queue.push(null);
      if(queue.length>S.sdBars){const old=queue.shift();if(old!=null){sum-=old;sumSq-=old*old;count--}}
      if(i<S.period||count<Math.min(20,S.sdBars))continue;
      const prior=regs[i-1];if(!Number.isFinite(prior))continue;
      const mean=sum/count,variance=Math.max(0,sumSq/count-mean*mean),sd=Math.sqrt(variance),pad=sd*S.multi/100;
      T.push({time:d[i].time,value:prior*(1+pad)});M.push({time:d[i].time,value:prior});L.push({time:d[i].time,value:prior*(1-pad)});
    }
    top.setData(T);middle.setData(M);bottom.setData(L);[top,middle,bottom].forEach(s=>s.applyOptions({visible:enabled}));
  }
  function refresh(force=false){const d=[...B.values()],S=active(),last=d.length?Math.max(...d.slice(-3).map(x=>+x.time||0)):0,sig=last+'|'+d.length+'|'+tf+'|'+cfg.mode+'|'+S.period+'|'+S.sdBars+'|'+S.multi;if(force||sig!==lastSig){lastSig=sig;calculate()}}
  function setVisible(v){enabled=!!v;ensure();[top,middle,bottom].forEach(s=>s.applyOptions({visible:enabled}));if(enabled)refresh(true)}
  function save(){try{localStorage.setItem('sdclrdSettings',JSON.stringify(cfg))}catch{}refresh(true)}
  function updateStatus(S,n){const e=document.getElementById('sdStatus');if(e)e.textContent=(cfg.mode==='auto'?'AUTO':'MANUAL')+' · REG '+S.period+' · SD '+S.sdBars+' · ×'+(+S.multi).toFixed(2)+' · '+n+' bars'}
  function addControls(label){if(document.getElementById('sdControls'))return;const wrap=document.createElement('div');wrap.id='sdControls';wrap.style.cssText='border-top:1px solid #ffffff14;margin-top:7px;padding-top:8px;display:grid;gap:7px;font:800 8px ui-monospace';wrap.innerHTML='<div style="display:flex;gap:5px"><button id="sdAuto" type="button" style="flex:1;min-height:30px">AUTO DYNAMIC</button><button id="sdManual" type="button" style="flex:1;min-height:30px">MANUAL</button></div><small id="sdStatus" style="color:#58d8ff;letter-spacing:.04em"></small><label style="display:grid;grid-template-columns:1fr 85px;gap:6px;align-items:center">REGRESSION PERIOD<input id="sdPeriod" type="number" min="20" max="500" step="1"></label><label style="display:grid;grid-template-columns:1fr 85px;gap:6px;align-items:center">STD DEV BARS<input id="sdBars" type="number" min="20" max="5000" step="10"></label><label style="display:grid;grid-template-columns:1fr 85px;gap:6px;align-items:center">MULTIPLIER<input id="sdMulti" type="number" min="0.1" max="10" step="0.1"></label><button id="sdReset" type="button" style="min-height:29px">RESET 200 / 2000 / 2</button>';label.parentNode.insertBefore(wrap,label.nextSibling);const P=document.getElementById('sdPeriod'),D=document.getElementById('sdBars'),M=document.getElementById('sdMulti');P.value=cfg.period;D.value=cfg.sdBars;M.value=cfg.multi;function paintMode(){const auto=cfg.mode==='auto';document.getElementById('sdAuto').style.borderColor=auto?'#39c655':'#263640';document.getElementById('sdAuto').style.color=auto?'#6bec81':'#eaf0f2';document.getElementById('sdManual').style.borderColor=!auto?'#39c655':'#263640';document.getElementById('sdManual').style.color=!auto?'#6bec81':'#eaf0f2';[P,D,M].forEach(x=>{x.disabled=auto;x.style.opacity=auto?.48:1})}paintMode();document.getElementById('sdAuto').onclick=()=>{cfg.mode='auto';paintMode();save()};document.getElementById('sdManual').onclick=()=>{cfg.mode='manual';paintMode();save()};P.onchange=()=>{cfg.period=clamp(+P.value||200,20,500);P.value=cfg.period;save()};D.onchange=()=>{cfg.sdBars=clamp(+D.value||2000,20,5000);D.value=cfg.sdBars;save()};M.onchange=()=>{cfg.multi=clamp(+M.value||2,.1,10);M.value=cfg.multi;save()};document.getElementById('sdReset').onclick=()=>{cfg={mode:'manual',period:200,sdBars:2000,multi:2};P.value=200;D.value=2000;M.value=2;paintMode();save()}}
  function bind(){try{cvdLine.applyOptions({visible:false})}catch{}const box=document.getElementById('cvdToggle');if(box){box.checked=true;box.onchange=e=>setVisible(e.target.checked);const span=box.closest('span');if(span){[...span.childNodes].forEach(n=>{if(n.nodeType===3)n.remove()});span.append(' SD Linear Regression Channel')}const label=box.closest('label');if(label){label.title='SDCLRD V1 · manual or timeframe-adaptive dynamic mode';addControls(label)}}refresh(true)}
  window.SDCLRD={refresh,setVisible,get settings(){return{...cfg,...active()}},setMode:m=>{cfg.mode=m==='manual'?'manual':'auto';save()}};
  setTimeout(bind,0);setInterval(()=>refresh(false),1800);['tf','qtf'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>setTimeout(()=>refresh(true),450)));
})();