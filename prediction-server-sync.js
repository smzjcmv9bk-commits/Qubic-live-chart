(()=>{
const RAW='https://raw.githubusercontent.com/smzjcmv9bk-commits/Qubic-live-chart/learning-data/learning/v9-state.json';
const finite=v=>Number.isFinite(+v)?+v:0;
function normalizeState(s){
  if(!s||typeof s!=='object')return null;
  const marketRegime=typeof s.marketRegime==='string'?s.marketRegime:(typeof s.regime==='string'?s.regime:'CALIBRATING');
  const trend=Math.max(-1,Math.min(1,finite(s.trend)));
  const momentum=Math.max(-1,Math.min(1,finite(s.momentum)));
  const flow=Math.max(-1,Math.min(1,finite(s.flow)));
  const book=Math.max(-1,Math.min(1,finite(s.book)));
  let regime=Number.isFinite(+s.regime)?Math.max(-1,Math.min(1,+s.regime)):0;
  if(typeof s.regime==='string') regime=(s.regime==='TRENDING'||s.regime==='BREAKOUT')?trend:0;
  return{t:finite(s.t)||Date.now(),marketRegime,trend,momentum,flow,book,regime};
}
function mergeRemote(x){if(!x||!Array.isArray(x.history))return false;try{
  const cleanState=(x.stateMem||[]).map(normalizeState).filter(Boolean).slice(-180);
  localStorage.setItem('qPredHistoryV9',JSON.stringify(x.history.slice(-600)));
  localStorage.setItem('qPredClustersV9',JSON.stringify(x.clusters||{}));
  localStorage.setItem('qPredStateV9',JSON.stringify(cleanState));
  localStorage.setItem('qPredServerMetaV9',JSON.stringify({updatedAt:x.updatedAt||null,runCount:x.runCount||0,global:x.global||{},latest:x.latest||null}));
  window.__qPredServerState={...x,stateMem:cleanState};return true;
}catch(e){console.warn('V9 server learning merge',e);return false}}
async function sync(){try{let r=await fetch(RAW+'?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('server learning '+r.status);return mergeRemote(await r.json())}catch(e){console.warn('V9 server learning sync',e);return false}}
window.__qServerLearningReady=sync();
setInterval(sync,5*60*1000);
})();