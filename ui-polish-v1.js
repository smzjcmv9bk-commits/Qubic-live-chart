(()=>{'use strict';
const ID='qUiPolishV1';
if(document.getElementById(ID))return;
const s=document.createElement('style');s.id=ID;s.textContent=`
#paperBotPanel,#runtimeHealth{overflow:hidden!important}
#paperBotPanel .qCardHead,#runtimeHealth .qCardHead{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;margin-bottom:10px!important}
#paperBotPanel .qCardHead small,#runtimeHealth .qCardHead small{display:block!important;font-size:9px!important;line-height:1.2!important;letter-spacing:.11em!important;color:#718694!important;font-weight:800!important;text-transform:uppercase!important}
#paperBotPanel .qCardHead b,#runtimeHealth .qCardHead b{display:block!important;margin-top:5px!important;font-size:17px!important;line-height:1.1!important;letter-spacing:.01em!important;color:#eef6fa!important}
#paperBotPanel .qAction{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-width:74px!important;min-height:34px!important;padding:0 12px!important;border-radius:10px!important;font-size:13px!important;line-height:1!important;font-weight:900!important;letter-spacing:.05em!important;border:1px solid #324653!important;background:#0b151e!important;color:#dbe7ec!important;white-space:nowrap!important}
#paperBotPanel .qAction.buy{color:#75f0a7!important;border-color:#246842!important;background:#0a1b12!important}
#paperBotPanel .qAction.sell{color:#ff818a!important;border-color:#6b3038!important;background:#210f13!important}
#paperBotPanel .qAction.wait{color:#ffd36c!important;border-color:#65512a!important;background:#1e180b!important}
#paperBotPanel .qCardNote{margin:0 0 12px!important;padding:10px 11px!important;border:1px solid #1f3340!important;border-radius:10px!important;background:#08111a!important;color:#b9c9d1!important;font-size:12px!important;line-height:1.45!important;letter-spacing:0!important;overflow-wrap:anywhere!important}
#paperBotPanel .qMetrics{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;margin:0 0 12px!important}
#paperBotPanel .qMetrics>div{min-width:0!important;padding:10px!important;border:1px solid #233744!important;border-radius:10px!important;background:#0a141d!important}
#paperBotPanel .qMetrics small{display:block!important;color:#718694!important;font-size:8px!important;line-height:1!important;font-weight:800!important;letter-spacing:.09em!important;margin-bottom:5px!important}
#paperBotPanel .qMetrics b{display:block!important;color:#eef6fa!important;font-size:18px!important;line-height:1!important;font-weight:900!important;white-space:nowrap!important}
#paperBotPanel .qTradeRows{display:grid!important;gap:6px!important;margin-top:2px!important}
#paperBotPanel .qTradeRows>div{display:grid!important;grid-template-columns:44px minmax(0,1fr) auto!important;align-items:center!important;gap:8px!important;padding:8px 9px!important;border:1px solid #1d303c!important;border-radius:9px!important;background:#08111a!important;font-size:10px!important;line-height:1.25!important}
#paperBotPanel .qTradeRows>div b{font-size:10px!important;line-height:1!important}
#paperBotPanel .qTradeRows>div span{min-width:0!important;color:#9fb0b9!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
#paperBotPanel .qTradeRows>div strong{font-size:10px!important;line-height:1!important;color:#eef6fa!important;white-space:nowrap!important}
#paperBotPanel .qEmpty{display:block!important;padding:10px!important;color:#738894!important;font-size:10px!important;text-align:center!important}
#paperBotPanel .qCardFoot{margin-top:10px!important;padding-top:9px!important;border-top:1px solid #172a35!important;color:#667c88!important;font-size:8px!important;line-height:1.5!important;letter-spacing:.02em!important}
#runtimeHealth{padding:11px 12px!important}
#runtimeHealth .qCardHead{margin-bottom:7px!important}
#runtimeHealth .qCardHead b{font-size:14px!important}
#runtimeHealth .qCardFoot{font-size:7px!important;line-height:1.35!important}
#runtimeHealth .qHealthGrid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}
#runtimeHealth .qHealthCell{padding:7px 3px!important;font-size:7px!important;line-height:1!important;min-width:0!important}
@media(max-width:700px){
 #paperBotPanel,#runtimeHealth{margin-top:9px!important;padding:11px!important;border-radius:13px!important}
 #paperBotPanel .qCardHead b{font-size:15px!important}
 #paperBotPanel .qAction{min-width:66px!important;min-height:31px!important;font-size:11px!important;padding:0 9px!important}
 #paperBotPanel .qCardNote{font-size:11px!important;padding:9px!important}
 #paperBotPanel .qMetrics{gap:6px!important}
 #paperBotPanel .qMetrics>div{padding:8px!important}
 #paperBotPanel .qMetrics b{font-size:16px!important}
 #paperBotPanel .qTradeRows>div{grid-template-columns:40px minmax(0,1fr) auto!important;gap:6px!important;padding:7px 8px!important;font-size:9px!important}
 #runtimeHealth .qHealthGrid{grid-template-columns:repeat(4,minmax(0,1fr))!important}
}
`;document.head.appendChild(s);
function makeSoundDirect(){const btn=document.getElementById('soundBtn');if(!btn)return;btn.onclick=e=>{e.preventDefault();e.stopPropagation();const audio=document.getElementById('audio');if(audio){audio.click();return}window.QUBIC_RUNTIME?.beep?.('buy',true)};}
function tidy(){const p=document.getElementById('paperBotPanel');if(p){p.setAttribute('aria-label','V9 paper trading bot');const rows=p.querySelector('.qTradeRows');if(rows&&rows.children.length>4){[...rows.children].slice(4).forEach(x=>x.style.display='none')}}makeSoundDirect()}
setInterval(tidy,1200);setTimeout(tidy,250);
})();