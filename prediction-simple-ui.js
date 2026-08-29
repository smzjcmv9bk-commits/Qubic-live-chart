(()=>{
const $=id=>document.getElementById(id);
function reason(){
  const headline=$('predHeadline')?.textContent||'';
  const book=$('predBook')?.textContent||'';
  const flow=$('predFlow')?.textContent||'';
  const regime=$('predRegime')?.textContent||'';
  const tf=$('predTf')?.textContent||'';
  const dir=headline.includes('UP')?'up':headline.includes('DOWN')?'down':'neutral';
  const bits=[];
  if(/BUY BOOK/i.test(book)) bits.push('buy-side order-book pressure');
  if(/SELL BOOK/i.test(book)) bits.push('sell-side order-book pressure');
  const fm=flow.match(/^([+-]?\d+)%/); if(fm){const v=+fm[1]; if(v>=8)bits.push('positive trade flow'); else if(v<=-8)bits.push('negative trade flow')}
  if(/TRENDING|BREAKOUT/i.test(regime)) bits.push(regime.toLowerCase()+' regime');
  const plus=(tf.match(/\+1/g)||[]).length, minus=(tf.match(/−1|-1/g)||[]).length;
  if(plus>=3) bits.push('multi-signal bullish alignment');
  if(minus>=3) bits.push('multi-signal bearish alignment');
  if(!bits.length) return dir==='neutral'?'Signals are mixed, so there is no clear next-hour edge yet.':`Price evidence currently leans ${dir}, but confirmation is still limited.`;
  return (dir==='neutral'?'Mixed market evidence: ':'Main reason: ')+bits.slice(0,2).join(' + ')+'.';
}
function sync(){
  const headline=$('predHeadline')?.textContent||'CALCULATING';
  const conf=($('predStrength')?.textContent||'—').match(/(\d+)%/)?.[1];
  const close=$('predClose')?.textContent||'—';
  const current=$('predCurrent')?.textContent||'—';
  const regime=$('predRegime')?.textContent||'CALIBRATING';
  const action=$('predAction')?.textContent||'WAIT';
  if($('simpleDirection')) $('simpleDirection').textContent=headline.replace(/[▲▼◆]\s*/,'');
  if($('simpleConfidence')) $('simpleConfidence').textContent=conf?conf+'%':'—';
  if($('simpleRange')) $('simpleRange').textContent=close;
  if($('simpleCurrent')) $('simpleCurrent').textContent=current;
  if($('simpleRegime')) $('simpleRegime').textContent=regime;
  if($('simpleAction')) $('simpleAction').textContent=action;
  if($('simpleReason')) $('simpleReason').textContent=reason();
  const panel=$('predictionPanel'); if(panel){panel.classList.toggle('simpleUp',headline.includes('UP'));panel.classList.toggle('simpleDown',headline.includes('DOWN'));panel.classList.toggle('simpleNeutral',headline.includes('SIDEWAYS')||headline.includes('UNCLEAR'))}
}
function simplify(){
  const box=$('predictionPanel'); if(!box||box.dataset.simple==='1') return false;
  box.dataset.simple='1';
  const keep={}; ['predHeadline','predPlain','predAction','predStrength','predClose','predCurrent','predUp','predNeutral','predDown','predRegime','predTf','predBook','predLearn','predRange','predStop','predTargets','predAccuracy','predAgree','predFlow','predFresh','predCountdown'].forEach(id=>{keep[id]=$(id)?.textContent||'—'});
  box.innerHTML=`
    <div class="simpleHead"><div><small>NEXT 1 HOUR</small><b>QUBIC PRICE OUTLOOK</b></div><span id="predCountdown">${keep.predCountdown}</span></div>
    <div class="simpleHero">
      <div class="directionBlock"><small>DIRECTION</small><strong id="simpleDirection">CALCULATING</strong><em id="simpleAction">${keep.predAction}</em></div>
      <div class="confidenceBlock"><small>CONFIDENCE</small><strong id="simpleConfidence">—</strong><em>model confidence</em></div>
    </div>
    <div class="pricePath"><div><small>NOW</small><b id="simpleCurrent">${keep.predCurrent}</b></div><span class="pathArrow">→</span><div><small>LIKELY 1H CLOSE</small><b id="simpleRange">${keep.predClose}</b></div></div>
    <div class="simpleMeta"><div><small>TIME HORIZON</small><b>Next 1 hour</b></div><div><small>MARKET REGIME</small><b id="simpleRegime">${keep.predRegime}</b></div></div>
    <div class="simpleWhy"><small>WHY?</small><b id="simpleReason">Reading market evidence…</b></div>
    <div class="simpleChances"><span>UP <b id="predUp">${keep.predUp}</b></span><span>SIDEWAYS <b id="predNeutral">${keep.predNeutral}</b></span><span>DOWN <b id="predDown">${keep.predDown}</b></span></div>
    <button id="predDetailsBtn" class="predDetailsBtn" type="button">Advanced analysis ▾</button>
    <div id="predDetails" class="predDetails simpleDetails">
      <div><small>EXPECTED 1H RANGE</small><b id="predRange">${keep.predRange}</b></div>
      <div><small>INVALIDATION</small><b id="predStop">${keep.predStop}</b></div>
      <div><small>TARGET 1 / 2</small><b id="predTargets">${keep.predTargets}</b></div>
      <div><small>RECORDED HIT RATE</small><b id="predAccuracy">${keep.predAccuracy}</b></div>
      <div><small>SIGNAL STATE</small><b id="predTf">${keep.predTf}</b></div>
      <div><small>ACTIVE SIGNALS</small><b id="predAgree">${keep.predAgree}</b></div>
      <div><small>ORDER BOOK</small><b id="predBook">${keep.predBook}</b></div>
      <div><small>FLOW MOMENTUM</small><b id="predFlow">${keep.predFlow}</b></div>
      <div><small>MEMORY / AGREEMENT</small><b id="predLearn">${keep.predLearn}</b></div>
      <div><small>DATA</small><b id="predFresh">${keep.predFresh}</b></div>
    </div>
    <div class="hiddenCompat"><b id="predHeadline">${keep.predHeadline}</b><span id="predPlain">${keep.predPlain}</span><b id="predAction">${keep.predAction}</b><b id="predStrength">${keep.predStrength}</b><b id="predClose">${keep.predClose}</b><b id="predCurrent">${keep.predCurrent}</b><b id="predRegime">${keep.predRegime}</b></div>
    <p class="simpleNote">Confidence is a model estimate, not a guarantee. Use the recorded hit rate in Advanced analysis to judge how the model has performed on completed signals.</p>`;
  $('predDetailsBtn').onclick=()=>{const d=$('predDetails'),open=d.classList.toggle('open');$('predDetailsBtn').textContent=open?'Hide advanced analysis ▴':'Advanced analysis ▾'};
  const obs=new MutationObserver(sync); ['predHeadline','predStrength','predClose','predCurrent','predRegime','predAction','predTf','predBook','predFlow'].forEach(id=>{const el=$(id);if(el)obs.observe(el,{childList:true,subtree:true,characterData:true})});
  sync(); return true;
}
const s=document.createElement('style');s.textContent=`
.predictionPanel[data-simple="1"]{padding:14px!important;background:#080e16!important;border:1px solid #263747!important;border-radius:14px!important}
.simpleHead{display:flex;align-items:center;justify-content:space-between;gap:12px}.simpleHead small,.simpleHero small,.pricePath small,.simpleMeta small,.simpleWhy small,.simpleDetails small{display:block;color:#748697;font-size:7px;letter-spacing:.11em}.simpleHead b{display:block;margin-top:3px;color:#dce8ee;font-size:11px}.simpleHead>span{white-space:nowrap;color:#78dfff;border:1px solid #24475a;border-radius:7px;padding:7px;font-size:8px}
.simpleHero{display:grid;grid-template-columns:1.4fr .8fr;gap:8px;margin-top:12px}.simpleHero>div{padding:13px;border:1px solid #2a3a48;border-radius:10px;background:#0c141e}.simpleHero strong{display:block;margin-top:4px;font-size:23px;line-height:1.1}.simpleHero em{display:block;margin-top:5px;color:#7f91a0;font-size:8px;font-style:normal}.confidenceBlock strong{font-size:28px}.simpleUp #simpleDirection{color:#55ee7c}.simpleDown #simpleDirection{color:#ff626b}.simpleNeutral #simpleDirection{color:#ffd15c}
.pricePath{display:grid;grid-template-columns:1fr auto 1.35fr;align-items:center;gap:9px;margin-top:8px;padding:11px;border:1px solid #263746;border-radius:10px;background:#09121a}.pricePath b{display:block;margin-top:4px;color:#eef6f8;font-size:13px}.pathArrow{font-size:22px;color:#63dff0}.simpleUp .pathArrow{color:#55ee7c}.simpleDown .pathArrow{color:#ff626b}
.simpleMeta{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}.simpleMeta>div,.simpleWhy{padding:9px 10px;border:1px solid #20313f;border-radius:8px;background:#0a121b}.simpleMeta b,.simpleWhy b{display:block;margin-top:3px;color:#dce8ee;font-size:9px}.simpleWhy{margin-top:7px}.simpleWhy b{font-size:10px;line-height:1.45}.simpleChances{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:7px}.simpleChances span{padding:8px;border:1px solid #1d2c3a;border-radius:7px;background:#0a121b;text-align:center;color:#718395;font-size:7px}.simpleChances b{display:block;margin-top:3px;color:#dce8ee;font-size:13px}
.predictionPanel[data-simple="1"] .predDetailsBtn{width:100%;margin-top:8px;min-height:40px}.predictionPanel[data-simple="1"] .predDetails{display:none}.predictionPanel[data-simple="1"] .predDetails.open{display:grid}.simpleDetails{grid-template-columns:repeat(2,1fr)!important}.simpleDetails>div{padding:8px!important}.hiddenCompat{display:none!important}.simpleNote{margin:8px 0 0;color:#586a79;font-size:7px;line-height:1.45}
@media(max-width:700px){.simpleHero{grid-template-columns:1fr 1fr}.simpleHero strong{font-size:18px}.confidenceBlock strong{font-size:23px}.pricePath{grid-template-columns:1fr auto 1.15fr}.pricePath b{font-size:10px}.simpleMeta{grid-template-columns:1fr 1fr}.simpleDetails{grid-template-columns:1fr!important}}
`;document.head.appendChild(s);
let tries=0;const t=setInterval(()=>{tries++;if(simplify()||tries>20)clearInterval(t)},250);
})();