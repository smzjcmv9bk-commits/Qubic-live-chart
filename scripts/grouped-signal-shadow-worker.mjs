const OWNER='smzjcmv9bk-commits',REPO='Qubic-live-chart',BRANCH='learning-data';
const SOURCE_PATH='learning/v9-state.json',OUT_PATH='learning/v9-grouped-shadow.json';
const token=process.env.GITHUB_TOKEN;if(!token)throw new Error('GITHUB_TOKEN missing');
const H={Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
async function read(path){const u=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,r=await fetch(u,{headers:H});if(r.status===404)return{data:null,sha:null};if(!r.ok)throw new Error(`read ${path} ${r.status}`);const x=await r.json();return{data:JSON.parse(Buffer.from(x.content,'base64').toString('utf8')),sha:x.sha}}
async function write(path,data,sha){const u=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,body={message:'Update grouped V9 shadow evaluation',content:Buffer.from(JSON.stringify(data)).toString('base64'),branch:BRANCH};if(sha)body.sha=sha;const r=await fetch(u,{method:'PUT',headers:{...H,'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(`write ${path} ${r.status} ${await r.text()}`)}
function sign(v,t=.15){return v>t?1:v<-t?-1:0}
function grouped(p){const s=p?.systems||{};
  const structure=+s.structure||0;
  const orderFlow=(()=>{const vals=[];if(s.book)vals.push([+s.book,.56]);if(s.flow)vals.push([+s.flow,.44]);const w=vals.reduce((a,x)=>a+x[1],0);return w?vals.reduce((a,x)=>a+x[0]*x[1],0)/w:0})();
  const timing=(()=>{const vals=[];if(s.avwap)vals.push([+s.avwap,.45]);if(s.momentum)vals.push([+s.momentum,.25]);if(s.pattern)vals.push([+s.pattern,.30]);const w=vals.reduce((a,x)=>a+x[1],0);return w?vals.reduce((a,x)=>a+x[0]*x[1],0)/w:0})();
  const g={structure:sign(structure,.1),orderFlow:sign(orderFlow,.12),timing:sign(timing,.16)};
  const rg=String(p.regime||'TRANSITION').toUpperCase();let w={structure:.30,orderFlow:.50,timing:.20};
  if(rg==='TRENDING')w={structure:.40,orderFlow:.40,timing:.20};
  else if(rg==='BREAKOUT')w={structure:.28,orderFlow:.52,timing:.20};
  else if(rg==='RANGING')w={structure:.22,orderFlow:.58,timing:.20};
  else if(rg==='LOW VOLATILITY')w={structure:.25,orderFlow:.55,timing:.20};
  let score=g.structure*w.structure+g.orderFlow*w.orderFlow+g.timing*w.timing;
  const available=Object.values(g).filter(Boolean).length;
  const pos=Object.values(g).filter(x=>x>0).length,neg=Object.values(g).filter(x=>x<0).length;
  const consensus=Math.max(pos,neg),threshold=rg==='LOW VOLATILITY'?.34:rg==='TRANSITION'?.28:.22;
  let dir=Math.abs(score)>=threshold&&consensus>=2?(score>0?'BULLISH':'BEARISH'):'NEUTRAL';
  if(available<2)dir='NEUTRAL';
  return{dir,score:+score.toFixed(4),groups:g,weights:w,available,consensus};
}
function correct(dir,move){return dir==='BULLISH'?move>.001:dir==='BEARISH'?move<-.001:Math.abs(move)<=.001}
function stats(rows,key='shadowDir'){const directional=rows.filter(x=>x[key]!=='NEUTRAL');const ok=directional.filter(x=>correct(x[key],x.move)).length;return{n:directional.length,ok,rate:directional.length?ok/directional.length:null,coverage:rows.length?directional.length/rows.length:0}}
const src=(await read(SOURCE_PATH)).data;if(!src)throw new Error('V9 source state missing');const prior=await read(OUT_PATH);
const completed=(src.history||[]).filter(x=>x.done&&Number.isFinite(+x.move)&&x.systems).slice(-400);
const replay=completed.map(p=>{const m=grouped(p);return{createdAt:p.createdAt,regime:p.regime,move:+p.move,baselineDir:p.dir,shadowDir:m.dir,score:m.score,groups:m.groups,consensus:m.consensus}});
const cut=Math.max(1,Math.floor(replay.length*.7)),train=replay.slice(0,cut),test=replay.slice(cut);
const latestModel=grouped(src.latest||{});
const baselineAll=stats(replay,'baselineDir'),shadowAll=stats(replay),baselineTest=stats(test,'baselineDir'),shadowTest=stats(test);
const deltaTest=(shadowTest.rate??0)-(baselineTest.rate??0);
const promotionReady=shadowTest.n>=30&&deltaTest>=.06&&shadowTest.rate>=.52&&shadowTest.coverage>=.18;
const out={version:1,mode:'SHADOW_ONLY',updatedAt:new Date().toISOString(),sourceUpdatedAt:src.updatedAt||null,design:{groups:{marketStructure:['structure'],orderBookTradeFlow:['book','flow'],timingEntry:['avwap','momentum','pattern']},principle:'Each raw indicator gets one primary vote group. Price-derived indicators no longer stack as independent full votes.',promotionGate:'At least 30 unseen directional samples, >=52% accuracy, >=6 percentage-point improvement over baseline, >=18% coverage.'},replay:{total:replay.length,trainN:train.length,testN:test.length,baselineAll,shadowAll,baselineTest,shadowTest,deltaTest:+deltaTest.toFixed(4)},latest:{price:src.latest?.price||null,regime:src.latest?.regime||null,baselineDir:src.latest?.dir||'NEUTRAL',shadowDir:latestModel.dir,score:latestModel.score,groups:latestModel.groups,weights:latestModel.weights,consensus:latestModel.consensus,available:latestModel.available},promotionReady,rows:replay.slice(-180)};
await write(OUT_PATH,out,prior.sha);console.log(`Grouped shadow: test=${shadowTest.n} rate=${shadowTest.rate===null?'n/a':(shadowTest.rate*100).toFixed(1)+'%'} baseline=${baselineTest.rate===null?'n/a':(baselineTest.rate*100).toFixed(1)+'%'} delta=${(deltaTest*100).toFixed(1)}pp promote=${promotionReady}`);