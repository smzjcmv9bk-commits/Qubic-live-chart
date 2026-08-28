(()=>{
  const PERIOD=200, SD_BARS=2000, MULTI=2;
  let top,middle,bottom,enabled=true,lastSig='';
  function ensure(){
    if(top)return;
    const common={lineWidth:2,lastValueVisible:false,priceLineVisible:false,crosshairMarkerVisible:false};
    top=chart.addLineSeries({...common,color:'rgba(38,132,255,.78)'});
    middle=chart.addLineSeries({...common,lineWidth:1,color:'rgba(38,132,255,.35)'});
    bottom=chart.addLineSeries({...common,color:'rgba(38,132,255,.78)'});
  }
  function linregAt(vals,end,len){
    if(end-len+1<0)return NaN;
    const n=len,sx=(n-1)*n/2,sxx=(n-1)*n*(2*n-1)/6;
    let sy=0,sxy=0;
    for(let j=0;j<n;j++){const y=vals[end-len+1+j];sy+=y;sxy+=j*y}
    const den=n*sxx-sx*sx;
    const slope=den?(n*sxy-sx*sy)/den:0;
    const intercept=(sy-slope*sx)/n;
    return intercept+slope*(n-1);
  }
  function stdev(a){
    if(!a.length)return NaN;
    const mean=a.reduce((s,v)=>s+v,0)/a.length;
    return Math.sqrt(a.reduce((s,v)=>s+(v-mean)*(v-mean),0)/a.length);
  }
  function calculate(){
    ensure();
    const d=[...B.values()].sort((a,b)=>a.time-b.time);
    if(d.length<PERIOD+2){top.setData([]);middle.setData([]);bottom.setData([]);return}
    const vals=d.map(x=>(x.high+x.low+x.close)/3);
    const regs=new Array(d.length).fill(NaN),dist=new Array(d.length).fill(NaN);
    for(let i=PERIOD-1;i<d.length;i++){
      const r=linregAt(vals,i,PERIOD);regs[i]=r;
      if(Number.isFinite(r)&&r!==0)dist[i]=Math.abs(((vals[i]-r)/r)*100);
    }
    const T=[],M=[],L=[];
    for(let i=PERIOD;i<d.length;i++){
      const prior=regs[i-1];
      if(!Number.isFinite(prior))continue;
      const start=Math.max(PERIOD-1,i-SD_BARS+1);
      const sample=[];
      for(let j=start;j<=i;j++)if(Number.isFinite(dist[j]))sample.push(dist[j]);
      // TradingView's original uses 2000 bars. Until 2000 are loaded, use the
      // available rolling sample so the channel remains usable on shorter ranges.
      if(sample.length<20)continue;
      const sd=stdev(sample),pad=(sd*MULTI)/100;
      T.push({time:d[i].time,value:prior*(1+pad)});
      M.push({time:d[i].time,value:prior});
      L.push({time:d[i].time,value:prior*(1-pad)});
    }
    top.setData(T);middle.setData(M);bottom.setData(L);
    [top,middle,bottom].forEach(s=>s.applyOptions({visible:enabled}));
  }
  function refresh(force=false){
    const d=[...B.values()];
    const sig=(d.length?d[d.length-1].time:0)+'|'+d.length+'|'+tf;
    if(force||sig!==lastSig){lastSig=sig;calculate()}
  }
  function setVisible(v){enabled=!!v;ensure();[top,middle,bottom].forEach(s=>s.applyOptions({visible:enabled}));if(enabled)refresh(true)}
  function bind(){
    try{cvdLine.applyOptions({visible:false})}catch{}
    const box=document.getElementById('cvdToggle');
    if(box){
      box.checked=true;
      box.onchange=e=>setVisible(e.target.checked);
      const span=box.closest('span');
      if(span){[...span.childNodes].forEach(n=>{if(n.nodeType===3)n.remove()});span.append(' SD Linear Regression Channel')}
      const label=box.closest('label');
      if(label)label.title='SDCLRD V1 · Linear regression 200 · standard deviation window 2000 · multiplier 2';
    }
    refresh(true);
  }
  window.SDCLRD={refresh,setVisible,settings:{period:PERIOD,standardDeviationBars:SD_BARS,multiplier:MULTI}};
  setTimeout(bind,0);
  setInterval(()=>refresh(false),1500);
  ['tf','qtf'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>setTimeout(()=>refresh(true),700)));
})();