(()=>{
const $=id=>document.getElementById(id);let busy=false,timer=null;
function ensure(){
  if($('earlyStructurePanel'))return;
  const p=$('predictionPanel'); if(!p)return;
  const sec=document.createElement('section');
  sec.id='earlyStructurePanel'; sec.className='earlyStructurePanel waiting';
  sec.innerHTML=`
    <div class="esTitle"><div><small>EARLY STRUCTURE</small><b>FIRST WARNING</b></div><span>24/7</span></div>
    <div id="esMain" class="esMain waiting">
      <div class="esIcon">⚡</div>
      <div class="esText">
        <small>EARLIEST SIGN</small>
        <strong id="esSignal">NO EARLY STRUCTURE YET</strong>
        <b id="esExplain">Waiting for a structure to start forming.</b>
      </div>
      <div class="esRight">
        <small>FIRST TIMEFRAME</small>
        <strong id="esTf">—</strong>
        <b id="esScore">WAIT</b>
      </div>
    </div>
    <div class="esConfirmRow">
      <span>V9 <b id="esV9">—</b></span>
      <span>ALIGNMENT <b id="esAlign">—</b></span>
      <span>24/7 HIT RATE <b id="esHit">LEARNING</b></span>
    </div>
    <button id="esDetailsBtn" class="esDetailsBtn" type="button">Show all timeframes ▾</button>
    <div id="esDetails" class="esDetails">
      <div id="esGrid" class="esGrid"></div>
      <p id="esWhy">The earliest signal appears before pressure building and before the breakout starts.</p>
    </div>`;
  p.insertAdjacentElement('afterend',sec);
  $('esDetailsBtn').onclick=()=>{const d=$('esDetails'),o=d.classList.toggle('open');$('esDetailsBtn').textContent=o?'Hide details ▴':'Show all timeframes ▾'};
  if(!$('esSimpleCss')){const s=document.createElement('style');s.id='esSimpleCss';s.textContent=`
  .earlyStructurePanel{margin-top:10px;padding:14px;border:1px solid #2b3e49;border-radius:13px;background:#071018}.esTitle{display:flex;justify-content:space-between;align-items:center}.esTitle small,.esMain small{display:block;color:#71838f;font:800 7px ui-monospace;letter-spacing:.13em}.esTitle b{display:block;margin-top:2px;font:1000 14px ui-monospace}.esTitle>span{color:#68e77d;border:1px solid #2b623b;border-radius:7px;padding:6px 8px;font:900 8px ui-monospace}.esMain{display:grid;grid-template-columns:48px 1fr auto;gap:11px;align-items:center;margin-top:10px;padding:15px;border:1px solid #344651;border-radius:11px;background:#09131b}.esIcon{font-size:30px;text-align:center}.esText strong{display:block;margin-top:4px;font:1000 21px ui-monospace}.esText b{display:block;margin-top:5px;color:#8da0ab;font:800 9px/1.35 ui-monospace}.esRight{text-align:right;min-width:92px}.esRight strong{display:block;margin-top:3px;font:1000 20px ui-monospace}.esRight b{display:inline-block;margin-top:5px;padding:4px 7px;border-radius:6px;background:#101a22;font:1000 10px ui-monospace}.esMain.up{border-color:#2f7d47;background:#0a1d11}.esMain.up .esText strong,.esMain.up .esRight strong,.esMain.up .esRight b{color:#65ed81}.esMain.down{border-color:#7d3940;background:#211014}.esMain.down .esText strong,.esMain.down .esRight strong,.esMain.down .esRight b{color:#ff6b74}.esMain.pressure{border-color:#4d8290;background:#0a2028}.esMain.pressure .esText strong{color:#80e7f4}.esMain.started{border-color:#8a6b2b;background:#241b0a}.esMain.started .esText strong{color:#ffd15c}.esConfirmRow{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}.esConfirmRow span{padding:8px;border:1px solid #1e3039;border-radius:7px;color:#71828d;font:800 7px ui-monospace;text-align:center}.esConfirmRow b{display:block;margin-top:3px;color:#d8e4e8;font-size:10px}.esDetailsBtn{width:100%;margin-top:8px;min-height:40px}.esDetails{display:none;margin-top:7px}.esDetails.open{display:block}.esGrid{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.esCell{padding:8px 3px;border:1px solid #1c2d36;border-radius:7px;text-align:center;color:#74858f;font:800 7px ui-monospace}.esCell b{display:block;margin:3px 0;color:#dce7ea;font-size:11px}.esCell.early{border-color:#2d7040;background:#0b1d11}.esCell.early b{color:#65ed81}.esCell.build{border-color:#3d7180;background:#0a1e25}.esCell.start{border-color:#7f662e;background:#221b0c}.esDetails p{margin:7px 0 0;color:#687b87;font:700 8px/1.45 ui-monospace}@media(max-width:700px){.esMain{grid-template-columns:40px 1fr}.esRight{grid-column:2;text-align:left;display:flex;gap:8px;align-items:center}.esRight small{display:none}.esRight strong{font-size:16px}.esText strong{font-size:16px}.esConfirmRow{grid-template-columns:1fr 1fr}.esConfirmRow span:last-child{grid-column:1/-1}.esGrid{grid-template-columns:repeat(4,1fr)}}`;
  document.head.appendChild(s)}
}
function chooseEarly(scan){
  const a=(scan.timeframes||[]).filter(x=>x.status==='EARLY SETUP').sort((x,y)=>y.score-x.score); return a[0]||null;
}
function paint(scan,learn){
  ensure(); if(!$('earlyStructurePanel'))return;
  const earliest=chooseEarly(scan), strong=scan.strongest||{}, dir=scan.direction||'NEUTRAL', main=$('esMain');
  if(earliest){
    main.className='esMain '+(earliest.direction==='UP'?'up':'down');
    $('esSignal').textContent=`EARLY ${earliest.direction} STRUCTURE FORMING`;
    $('esExplain').textContent='This is the first warning — structure is forming before the move starts.';
    $('esTf').textContent=earliest.tf.toUpperCase(); $('esScore').textContent=Math.round(earliest.score)+'%';
  }else if(strong.status==='BUILDING PRESSURE'){
    main.className='esMain pressure'; $('esSignal').textContent='PRESSURE BUILDING'; $('esExplain').textContent='The earliest stage has passed; the setup is strengthening now.'; $('esTf').textContent=(strong.tf||'—').toUpperCase(); $('esScore').textContent=Math.round(strong.score||0)+'%';
  }else if(strong.status==='BREAKOUT STARTING'){
    main.className='esMain started'; $('esSignal').textContent='MOVE STARTING'; $('esExplain').textContent='The breakout is already beginning — this is no longer the earliest stage.'; $('esTf').textContent=(strong.tf||'—').toUpperCase(); $('esScore').textContent=Math.round(strong.score||0)+'%';
  }else{
    main.className='esMain waiting'; $('esSignal').textContent='NO EARLY STRUCTURE YET'; $('esExplain').textContent='Waiting for a structure to start forming.'; $('esTf').textContent='—'; $('esScore').textContent='WAIT';
  }
  const v=learn?.latest?.v9||{}, vDir=v.direction==='BULLISH'?'UP':v.direction==='BEARISH'?'DOWN':'NEUTRAL';
  const eDir=earliest?.direction||dir; const agree=eDir!=='NEUTRAL'&&vDir===eDir;
  $('esV9').textContent=vDir==='NEUTRAL'?'NEUTRAL':`${agree?'AGREES':'DISAGREES'} · ${vDir}`;
  $('esAlign').textContent=(scan.alignment||0)+'%';
  const st=learn?.stats||{}; $('esHit').textContent=st.completed?Math.round((+st.hitRate||0)*100)+'%':'LEARNING';
  $('esGrid').innerHTML=(scan.timeframes||[]).map(x=>{let c=x.status==='EARLY SETUP'?'early':x.status==='BUILDING PRESSURE'?'build':x.status==='BREAKOUT STARTING'?'start':'';let label=x.status==='EARLY SETUP'?'EARLY':x.status==='BUILDING PRESSURE'?'BUILD':x.status==='BREAKOUT STARTING'?'START':'—';return `<div class="esCell ${c}"><span>${x.tf.toUpperCase()}</span><b>${x.score||0}%</b><span>${label}</span></div>`}).join('');
  $('esWhy').textContent=earliest?`${earliest.tf.toUpperCase()} is currently the earliest warning. Watch this card first; the rest are secondary confirmation.`:'No timeframe is in the EARLY SETUP stage right now.';
}
async function refresh(){if(busy||document.hidden)return;busy=true;try{const [a,b]=await Promise.all([fetch('/api/pattern-scan?t='+Date.now(),{cache:'no-store'}),fetch('/api/early-learning?t='+Date.now(),{cache:'no-store'}).catch(()=>null)]);if(!a.ok)return;const scan=await a.json(),learn=b&&b.ok?await b.json():null;if(scan?.ok)paint(scan,learn)}catch{}finally{busy=false}}
function start(){ensure();refresh();clearInterval(timer);timer=setInterval(refresh,45000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,1200),{once:true});else setTimeout(start,1200);
})();
