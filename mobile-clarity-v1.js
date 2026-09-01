(()=>{
'use strict';
const $=id=>document.getElementById(id);
function css(){if($('qMobileClarityCss'))return;const s=document.createElement('style');s.id='qMobileClarityCss';s.textContent=`
@media(max-width:800px){
#paperBotPanel,#v10Panel,#runtimeHealth{padding:14px 14px 12px!important}
#paperBotPanel .qCardHead,#v10Panel .qCardHead{align-items:flex-start!important;gap:10px!important}
#paperBotPanel .qCardHead small,#v10Panel .qCardHead small,#runtimeHealth small{font-size:7px!important;letter-spacing:.14em!important;color:#758694!important}
#paperBotPanel .qCardHead b,#v10Panel .qCardHead b,#runtimeHealth .qCardHead b{font-size:15px!important;line-height:1.15!important}
#paperBotPanel .qAction,#v10Panel .qAction{padding:10px 12px!important;border-radius:10px!important;font-size:13px!important;white-space:nowrap!important}
.qClarityLabel{display:block;margin:11px 0 6px;color:#718492;font:800 7px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em}
.qPositionGrid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:7px 0 10px}
.qPositionGrid>div{min-width:0;padding:10px 11px;border:1px solid #20313e;border-radius:9px;background:#08111a}
.qPositionGrid small{display:block;color:#728390;font:800 7px ui-monospace;letter-spacing:.08em}
.qPositionGrid b{display:block;margin-top:5px;color:#edf3f6;font:900 12px ui-monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qPositionGrid .tp b{color:#53e487}.qPositionGrid .sl b{color:#ff707b}.qPositionGrid .rr b{color:#64dbea}
#paperBotPanel .qCardNote.qClarityDone,#v10Panel .qCardNote.qClarityDone{padding:0!important;border:0!important;background:transparent!important}
#paperBotPanel .qMetrics,#v10Panel .qMetrics{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:7px!important;margin:8px 0 10px!important}
#paperBotPanel .qMetrics>div,#v10Panel .qMetrics>div{min-height:70px!important;padding:10px 9px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;text-align:left!important}
#paperBotPanel .qMetrics small,#v10Panel .qMetrics small{font-size:7px!important;line-height:1.25!important;color:#758694!important}
#paperBotPanel .qMetrics b,#v10Panel .qMetrics b{margin-top:5px!important;font-size:18px!important;line-height:1!important}
#paperBotPanel .qTradeRows{display:grid!important;gap:6px!important;margin-top:7px!important}
#paperBotPanel .qTradeRows>div{min-height:42px!important;padding:8px 9px!important;grid-template-columns:54px 1fr auto!important;gap:7px!important;border-radius:8px!important}
#paperBotPanel .qTradeRows>div:nth-child(n+3){display:none!important}
#paperBotPanel .qTradeRows span{font-size:7px!important;line-height:1.3!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#paperBotPanel .qTradeRows strong{font-size:10px!important}
#paperBotPanel .qCardFoot{font-size:6.5px!important;line-height:1.35!important;padding-top:8px!important;margin-top:9px!important;max-height:28px;overflow:hidden}
.qV10Summary{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:8px 0}
.qV10Summary>div{padding:10px;border:1px solid #20313e;border-radius:9px;background:#08111a}
.qV10Summary small{display:block;color:#728390;font:800 7px ui-monospace;letter-spacing:.08em}
.qV10Summary b{display:block;margin-top:4px;font:900 13px ui-monospace}
.qV10Summary span{display:block;margin-top:3px;color:#7e8c96;font:700 7px ui-monospace}
#v10Panel .qCardFoot{font-size:6.5px!important;line-height:1.35!important;padding-top:8px!important;margin-top:8px!important}
#runtimeHealth{padding-top:13px!important}
#runtimeHealth .healthGrid,#runtimeHealth .runtimeGrid{grid-template-columns:repeat(2,1fr)!important;gap:7px!important}
#runtimeHealth .healthGrid>*,#runtimeHealth .runtimeGrid>*{min-height:39px!important;padding:7px 8px!important}
#runtimeHealth [class*='health'] b,#runtimeHealth [class*='layer'] b{font-size:8px!important}
}
`;document.head.appendChild(s)}
function fmtPrice(v){const n=+v;if(!Number.isFinite(n))return v||'—';return n<.0001?n.toExponential(5):n.toPrecision(7)}
function bot(){const p=$('paperBotPanel');if(!p)return;const note=p.querySelector('.qCardNote');if(!note||note.dataset.clarity==='1')return;const t=(note.textContent||'').trim();const m=t.match(/(?:([A-Z0-9]+)\s+)?ENTRY\s+([0-9.eE+-]+)\s*·\s*TP\s+([0-9.eE+-]+)\s*·\s*SL\s+([0-9.eE+-]+)\s*·\s*3:1(?:\s*·\s*Q(\d+))?/i);if(!m)return;note.dataset.clarity='1';note.classList.add('qClarityDone');note.innerHTML=`<span class="qClarityLabel">CURRENT PAPER POSITION</span><div class="qPositionGrid"><div><small>ENTRY</small><b>${fmtPrice(m[2])}</b></div><div class="tp"><small>TAKE PROFIT · +2.1%</small><b>${fmtPrice(m[3])}</b></div><div class="sl"><small>STOP LOSS · -0.7%</small><b>${fmtPrice(m[4])}</b></div><div class="rr"><small>RISK / REWARD</small><b>1 : 3${m[5]?` · Q${m[5]}`:''}</b></div></div>`;const rows=p.querySelector('.qTradeRows');if(rows&&!rows.previousElementSibling?.classList?.contains('qClarityLabel'))rows.insertAdjacentHTML('beforebegin','<span class="qClarityLabel">RECENT RESULTS</span>')}
function v10(){const p=$('v10Panel');if(!p)return;const note=p.querySelector('.qCardNote');if(!note||note.dataset.clarity==='1')return;const t=(note.textContent||'').trim();const m=t.match(/Validation:\s*(\d+)\s*trades\s*·\s*([^·]+?)\s*3R wins\s*·\s*Test:\s*(\d+)\s*trades\s*·\s*directional\s*([^·]+?)\s*·\s*Brier\s*([0-9.]+)/i);if(!m)return;note.dataset.clarity='1';note.classList.add('qClarityDone');note.innerHTML=`<span class="qClarityLabel">UNSEEN TEST QUALITY</span><div class="qV10Summary"><div><small>VALIDATION</small><b>${m[1]} trades</b><span>${m[2].trim()} 3R wins</span></div><div><small>TEST SAMPLE</small><b>${m[3]} trades</b><span>${m[4].trim()} directional</span></div><div><small>BRIER SCORE</small><b>${m[5]}</b><span>Lower is better</span></div><div><small>STATUS</small><b>SHADOW ONLY</b><span>Does not control bot</span></div></div>`}
function run(){bot();v10()}
css();run();new MutationObserver(()=>queueMicrotask(run)).observe(document.body,{subtree:true,childList:true});setInterval(run,1200);window.QUBIC_MOBILE_CLARITY={run};
})();