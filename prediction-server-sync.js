(()=>{
const RAW='https://raw.githubusercontent.com/smzjcmv9bk-commits/Qubic-live-chart/learning-data/learning/v9-state.json';
function mergeRemote(x){if(!x||!Array.isArray(x.history))return false;try{
  localStorage.setItem('qPredHistoryV9',JSON.stringify(x.history.slice(-600)));
  localStorage.setItem('qPredClustersV9',JSON.stringify(x.clusters||{}));
  localStorage.setItem('qPredStateV9',JSON.stringify((x.stateMem||[]).slice(-180)));
  localStorage.setItem('qPredServerMetaV9',JSON.stringify({updatedAt:x.updatedAt||null,runCount:x.runCount||0,global:x.global||{},latest:x.latest||null}));
  window.__qPredServerState=x;return true;
}catch{return false}}
async function sync(){try{let r=await fetch(RAW+'?ts='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('server learning '+r.status);return mergeRemote(await r.json())}catch(e){console.warn('V9 server learning sync',e);return false}}
window.__qServerLearningReady=sync();
setInterval(sync,5*60*1000);
})();