(()=>{
'use strict';
const VERSION='live-trade-layout-v2';
const $=id=>document.getElementById(id);
let initialized=false,known=new Set(),arrangeTimer=null;
function addCss(){if($('qLiveTradeLayoutCss'))return;const s=document.createElement('style');s.id='qLiveTradeLayoutCss';s.textContent=`
#qp + .tape{margin-top:12px!important}
.tape{position:relative;overflow:hidden}
.trade.qTradeFlashBuy{animation:qTradeBuyFlash 1.15s ease-out}
.trade.qTradeFlashSell{animation:qTradeSellFlash 1.15s ease-out}
.tape.qTapeBuyPulse{animation:qTapeBuyPulse .8s ease-out}
.tape.qTapeSellPulse{animation:qTapeSellPulse .8s ease-out}
@keyframes qTradeBuyFlash{0%{background:rgba(50,235,126,.38);box-shadow:inset 0 0 0 2px rgba(80,255,150,.95),0 0 20px rgba(45,230,125,.42)}35%{background:rgba(45,220,120,.16);box-shadow:inset 0 0 0 1px rgba(80,255,150,.55)}100%{background:rgba(45,220,120,0);box-shadow:inset 0 0 0 0 rgba(80,255,150,0)}}
@keyframes qTradeSellFlash{0%{background:rgba(255,70,85,.40);box-shadow:inset 0 0 0 2px rgba(255,95,105,.98),0 0 20px rgba(255,65,80,.40)}35%{background:rgba(245,60,75,.16);box-shadow:inset 0 0 0 1px rgba(255,100,110,.55)}100%{background:rgba(245,60,75,0);box-shadow:inset 0 0 0 0 rgba(255,100,110,0)}}
@keyframes qTapeBuyPulse{0%{box-shadow:0 0 0 1px rgba(70,240,135,.85),0 0 24px rgba(45,225,120,.28)}100%{box-shadow:none}}
@keyframes qTapeSellPulse{0%{box-shadow:0 0 0 1px rgba(255,90,100,.9),0 0 24px rgba(245,60,75,.28)}100%{box-shadow:none}}
@media(max-width:700px){#qp + .tape{margin-top:10px!important}.trade.qTradeFlashBuy,.trade.qTradeFlashSell{animation-duration:.95s}}
@media(prefers-reduced-motion:reduce){.trade.qTradeFlashBuy,.trade.qTradeFlashSell,.tape.qTapeBuyPulse,.tape.qTapeSellPulse{animation:none!important}}
`;document.head.appendChild(s)}
function arrange(){const qp=$('qp'),tape=document.querySelector('.tape');if(!qp||!tape)return;if(qp.nextElementSibling!==tape)qp.insertAdjacentElement('afterend',tape);let anchor=tape;const order=['predictionPanel','paperBotPanel','runtimeHealth','networkPanel','analytics'];for(const id of order){const el=$(id);if(!el||el===anchor)continue;if(anchor.nextElementSibling!==el)anchor.insertAdjacentElement('afterend',el);anchor=el}}
function sig(row){return (row.classList.contains('sell')?'S|':'B|')+(row.textContent||'').replace(/\s+/g,' ').trim()}
function pulseRow(row){const sell=row.classList.contains('sell'),cls=sell?'qTradeFlashSell':'qTradeFlashBuy';row.classList.remove('qTradeFlashBuy','qTradeFlashSell');void row.offsetWidth;row.classList.add(cls);setTimeout(()=>row.classList.remove(cls),1300)}
function pulseTape(sell){const tape=document.querySelector('.tape');if(!tape)return;const cls=sell?'qTapeSellPulse':'qTapeBuyPulse';tape.classList.remove('qTapeBuyPulse','qTapeSellPulse');void tape.offsetWidth;tape.classList.add(cls);setTimeout(()=>tape.classList.remove(cls),900)}
function scanTrades(){const box=$('trades');if(!box)return;const rows=[...box.querySelectorAll('.trade')];if(!rows.length)return;const current=rows.map(r=>[r,sig(r)]);if(!initialized){current.forEach(([,k])=>known.add(k));initialized=true;return}const fresh=current.filter(([,k])=>!known.has(k));current.forEach(([,k])=>known.add(k));if(known.size>800)known=new Set([...known].slice(-500));if(!fresh.length)return;fresh.slice(0,8).forEach(([r])=>pulseRow(r));pulseTape(fresh[0][0].classList.contains('sell'))}
function observe(){const box=$('trades');if(!box||box.__qFlashObserver)return false;box.__qFlashObserver=true;new MutationObserver(()=>scanTrades()).observe(box,{childList:true});scanTrades();return true}
function start(){addCss();arrange();observe();const app=document.querySelector('.app');if(app&&!app.__qLayoutObserver){app.__qLayoutObserver=true;new MutationObserver(()=>{clearTimeout(arrangeTimer);arrangeTimer=setTimeout(()=>{arrange();observe()},20)}).observe(app,{childList:true})}setInterval(()=>{arrange();observe()},1500);window.QUBIC_LIVE_TRADE_LAYOUT={version:VERSION,arrange,scanTrades}}
start();
})();