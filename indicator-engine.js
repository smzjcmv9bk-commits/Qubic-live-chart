(()=>{
const $=id=>document.getElementById(id);
function save(id,v){try{localStorage.setItem('qIndicator:'+id,String(v))}catch{}}
function restore(id,d){try{const v=localStorage.getItem('qIndicator:'+id);return v==null?d:v==='true'}catch{return d}}
function clearLegacy(){try{['ema9','ema20','ema21','ema50','ema200','cvdToggle'].forEach(id=>localStorage.removeItem('qIndicator:'+id))}catch{}}
function apply(){try{window.__QubicVolumeSeries?.applyOptions({visible:!!$('volToggle')?.checked})}catch{}const ant=$('antStatus');if(ant)ant.style.display=$('antToggle')?.checked?'':'none';window.__QubicIndicatorStatus={ready:true,enabled:['volToggle','antToggle'].filter(id=>$(id)?.checked),updatedAt:Date.now()};return true}
function bind(){clearLegacy();for(const[id,d]of[['volToggle',true],['antToggle',true]]){const e=$(id);if(e){e.checked=restore(id,d);e.addEventListener('change',()=>{save(id,e.checked);apply()})}}let n=0;const ready=setInterval(()=>{n++;apply();if(window.__QubicVolumeSeries||n>100)clearInterval(ready)},100);setTimeout(apply,450)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
window.__QubicIndicators={refresh:apply,draw:apply,get status(){return window.__QubicIndicatorStatus||{ready:false}}};
})();