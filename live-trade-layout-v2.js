(()=>{
'use strict';
const VERSION='live-trade-layout-v3-aggr-tape';
const $=id=>document.getElementById(id);
let initialized=false,known=new Set(),arrangeTimer=null;
function addCss(){if($('qLiveTradeLayoutCss'))$('qLiveTradeLayoutCss').remove();const s=document.createElement('style');s.id='qLiveTradeLayoutCss';s.textContent=`
#qp + .tape{margin-top:12px!important}
.tape{position:relative;overflow:hidden!important;background:#071018!important}
#trades{overflow:hidden!important}
.trade{position:relative;isolation:isolate;transition:background .16s ease,border-color .16s ease,transform .16s ease;min-height:31px;border-left:3px solid transparent!important}
.trade.buy{border-left-color:rgba(65,215,126,.38)!important}
.trade.sell{border-left-color:rgba(255,83,99,.38)!important}
.trade.buy>span:first-child,.trade.buy .usd{color:#68e99a!important}
.trade.sell>span:first-child,.trade.sell .usd{color:#ff7581!important}
.trade.qTapeNew{animation:qTapeFlowIn .28s cubic-bezier(.2,.75,.3,1)}
.trade.qPrintMedium.buy{background:rgba(30,180,96,.10)!important;border-left-color:#43dc88!important}
.trade.qPrintMedium.sell{background:rgba(226,59,75,.11)!important;border-left-color:#ff5d6d!important}
.trade.qPrintLarge.buy{background:linear-gradient(90deg,rgba(25,208,105,.27),rgba(25,208,105,.06) 72%,transparent)!important;border-left-color:#52f09a!important;animation:qBigBuy .72s ease-out}
.trade.qPrintLarge.sell{background:linear-gradient(90deg,rgba(242,65,83,.29),rgba(242,65,83,.06) 72%,transparent)!important;border-left-color:#ff6a78!important;animation:qBigSell .72s ease-out}
.trade.qPrintWhale{font-weight:900!important;min-height:36px;overflow:hidden}
.trade.qPrintWhale.buy{background:linear-gradient(90deg,rgba(26,222,112,.42),rgba(26,222,112,.13) 68%,rgba(26,222,112,.03))!important;border-left:4px solid #73ffad!important;animation:qWhaleBuy 1s cubic-bezier(.16,.8,.28,1)}
.trade.qPrintWhale.sell{background:linear-gradient(90deg,rgba(255,68,88,.44),rgba(255,68,88,.14) 68%,rgba(255,68,88,.03))!important;border-left:4px solid #ff8290!important;animation:qWhaleSell 1s cubic-bezier(.16,.8,.28,1)}
.trade.qPrintWhale:after{content:'';position:absolute;z-index:-1;inset:0 auto 0 -35%;width:28%;transform:skewX(-18deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.20),transparent);animation:qSweep .72s ease-out}
.trade .qSizeTag{display:inline-flex;align-items:center;margin-left:5px;padding:2px 5px;border-radius:4px;font:900 7px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;vertical-align:middle}
.trade.buy .qSizeTag{color:#8dffb8;background:rgba(35,190,102,.15);border:1px solid rgba(91,239,151,.28)}
.trade.sell .qSizeTag{color:#ff9aa4;background:rgba(220,55,71,.15);border:1px solid rgba(255,108,121,.28)}
@keyframes qTapeFlowIn{0%{opacity:.25;transform:translateY(-5px)}100%{opacity:1;transform:none}}
@keyframes qBigBuy{0%{background:rgba(39,244,130,.58);box-shadow:inset 0 0 0 1px rgba(104,255,169,.85)}45%{box-shadow:inset 0 0 0 1px rgba(104,255,169,.25)}100%{box-shadow:none}}
@keyframes qBigSell{0%{background:rgba(255,73,91,.62);box-shadow:inset 0 0 0 1px rgba(255,133,145,.88)}45%{box-shadow:inset 0 0 0 1px rgba(255,133,145,.25)}100%{box-shadow:none}}
@keyframes qWhaleBuy{0%{transform:scale(.985);filter:brightness(1.9)}28%{transform:scale(1.006);filter:brightness(1.28)}100%{transform:none;filter:none}}
@keyframes qWhaleSell{0%{transform:scale(.985);filter:brightness(1.85)}28%{transform:scale(1.006);filter:brightness(1.25)}100%{transform:none;filter:none}}
@keyframes qSweep{0%{left:-35%;opacity:0}18%{opacity:1}100%{left:115%;opacity:0}}
@media(max-width:700px){#qp + .tape{margin-top:10px!important}.trade{min-height:29px}.trade.qPrintWhale{min-height:33px}.trade .qSizeTag{font-size:6px;padding:2px 4px}}
@media(prefers-reduced-motion:reduce){.trade.qTapeNew,.trade.qPrintLarge,.trade.qPrintWhale,.trade.qPrintWhale:after{animation:none!important}}
`;document.head.appendChild(s)}
function arrange(){const qp=$('qp'),tape=document.querySelector('.tape');if(!qp||!tape)return;if(qp.nextElementSibling!==tape)qp.insertAdjacentElement('afterend',tape);let anchor=tape;const order=['predictionPanel','paperBotPanel','runtimeHealth','networkPanel','analytics'];for(const id of order){const el=$(id);if(!el||el===anchor)continue;if(anchor.nextElementSibling!==el)anchor.insertAdjacentElement('afterend',el);anchor=el}}
function sig(row){return (row.classList.contains('sell')?'S|':'B|')+(row.textContent||'').replace(/\s+/g,' ').trim()}
function parseUsdText(v){const s=String(v||'').replace(/[$,\s]/g,'').toUpperCase(),m=s.match(/^(-?[0-9]*\.?[0-9]+)([KMB])?$/);if(!m)return 0;let n=+m[1]||0;if(m[2]==='K')n*=1e3;else if(m[2]==='M')n*=1e6;else if(m[2]==='B')n*=1e9;return n}
function usd(row){return parseUsdText(row.querySelector('.usd')?.textContent)}
function thresholds(rows){const vals=rows.map(usd).filter(v=>v>0).sort((a,b)=>a-b);const pct=p=>vals.length?vals[Math.min(vals.length-1,Math.floor((vals.length-1)*p))]:0;return{medium:Math.max(25,pct(.75)),large:Math.max(100,pct(.92)),whale:Math.max(500,pct(.985))}}
function classify(row,th,fresh=false){const v=usd(row);row.classList.remove('qPrintMedium','qPrintLarge','qPrintWhale','qTapeNew');row.querySelector('.qSizeTag')?.remove();let cls='',label='';if(v>=th.whale){cls='qPrintWhale';label='WHALE'}else if(v>=th.large){cls='qPrintLarge';label='LARGE'}else if(v>=th.medium){cls='qPrintMedium';label='BIG'}if(cls)row.classList.add(cls);if(label){const target=row.querySelector('.usd');if(target){const tag=document.createElement('i');tag.className='qSizeTag';tag.textContent=label;target.appendChild(tag)}}if(fresh){row.classList.add('qTapeNew');if(cls==='qPrintLarge'||cls==='qPrintWhale'){row.classList.remove(cls);void row.offsetWidth;row.classList.add(cls)}setTimeout(()=>row.classList.remove('qTapeNew'),420)}row.dataset.usd=String(v)}
function scanTrades(){const box=$('trades');if(!box)return;const rows=[...box.querySelectorAll('.trade')];if(!rows.length)return;const th=thresholds(rows),current=rows.map(r=>[r,sig(r)]);if(!initialized){current.forEach(([r,k])=>{known.add(k);classify(r,th,false)});initialized=true;return}const freshKeys=new Set(current.filter(([,k])=>!known.has(k)).map(([,k])=>k));current.forEach(([r,k])=>{classify(r,th,freshKeys.has(k));known.add(k)});if(known.size>1200)known=new Set([...known].slice(-800))}
function observe(){const box=$('trades');if(!box||box.__qFlashObserver)return false;box.__qFlashObserver=true;new MutationObserver(()=>scanTrades()).observe(box,{childList:true});scanTrades();return true}
function start(){addCss();arrange();observe();const app=document.querySelector('.app');if(app&&!app.__qLayoutObserver){app.__qLayoutObserver=true;new MutationObserver(()=>{clearTimeout(arrangeTimer);arrangeTimer=setTimeout(()=>{arrange();observe()},20)}).observe(app,{childList:true})}setInterval(()=>{arrange();observe()},1500);window.QUBIC_LIVE_TRADE_LAYOUT={version:VERSION,arrange,scanTrades}}
start();
})();