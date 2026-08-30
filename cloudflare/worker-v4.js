import core from './worker-v2.js';

const RAW='https://raw.githubusercontent.com/smzjcmv9bk-commits/Qubic-live-chart/learning-data/learning';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','access-control-allow-origin':'*','access-control-allow-methods':'GET,HEAD,OPTIONS'}});
const timeout=(p,ms=5500)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))]);
async function getJson(url,ms=5500){const r=await timeout(fetch(url,{cache:'no-store',headers:{accept:'application/json','user-agent':'QubicLiveChart-Cloudflare/4.0'}}),ms);if(!r.ok)throw new Error(String(r.status));return r.json()}

export class QubicState {
  constructor(state,env){this.state=state;this.env=env}
  async fetch(request){
    const u=new URL(request.url),key=u.searchParams.get('key');
    if(!key)return json({ok:false,error:'missing key'},400);
    if(request.method==='GET'){
      const value=await this.state.storage.get(key);
      return json({ok:true,key,value:value??null});
    }
    if(request.method==='PUT'){
      const body=await request.json();
      await this.state.storage.put(key,body?.value??null);
      return json({ok:true,key});
    }
    if(request.method==='DELETE'){
      await this.state.storage.delete(key);
      return json({ok:true,key});
    }
    return json({ok:false,error:'method not allowed'},405);
  }
}

function stateStub(env){if(!env?.QUBIC_STATE_DO)return null;const id=env.QUBIC_STATE_DO.idFromName('qubic-global-state-v1');return env.QUBIC_STATE_DO.get(id)}
async function stateGet(env,key){const stub=stateStub(env);if(!stub)return null;const r=await stub.fetch(`https://state.local/?key=${encodeURIComponent(key)}`);if(!r.ok)return null;return (await r.json()).value??null}
async function statePut(env,key,value){const stub=stateStub(env);if(!stub)return false;const r=await stub.fetch(`https://state.local/?key=${encodeURIComponent(key)}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({value})});return r.ok}

async function marketSummary(){const x=(await getJson('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=QUBIC_USDT'))?.[0]||{};const data={price:+x.last||null,change24:+x.change_percentage||null,high24:+x.high_24h||null,low24:+x.low_24h||null,baseVolume:+x.base_volume||null,quoteVolume:+x.quote_volume||null};return{ok:!!data.price,platform:'cloudflare-native',...data,ts:Date.now()}}
async function networkStatus(){const start=Date.now();const d=await getJson('https://rpc.qubic.org/v1/tick-info',6000);const x=d?.tickInfo||d||{};const tick=Number(x.tick??x.currentTick),epoch=Number(x.epoch);return{ok:Number.isFinite(tick),platform:'cloudflare-native',tick:Number.isFinite(tick)?tick:null,epoch:Number.isFinite(epoch)?epoch:null,timestamp:x.timestamp||x.time||new Date().toISOString(),latency:Date.now()-start,ts:Date.now()}}

async function learningState(kind,env){
  const file=kind==='early'?'early-structure.json':'v9-state.json',cacheKey=`learning:${kind}`;
  try{
    const state=await getJson(`${RAW}/${file}?t=${Date.now()}`,5000);
    await statePut(env,cacheKey,{savedAt:Date.now(),state}).catch(()=>false);
    return{ok:true,platform:'cloudflare-native',storage:stateStub(env)?'durable-object+github':'github',...state};
  }catch(error){
    const saved=await stateGet(env,cacheKey).catch(()=>null);
    if(saved?.state)return{ok:true,platform:'cloudflare-native',storage:'durable-object-fallback',stale:true,savedAt:saved.savedAt,...saved.state};
    throw error;
  }
}

async function predictionState(env){
  let v9=null,early=null;
  try{[v9,early]=await Promise.all([learningState('v9',env),learningState('early',env)])}catch{}
  const now=Date.now(),previous=await stateGet(env,'prediction:last').catch(()=>null);
  const current={ts:now,v9:v9?.state??v9?.direction??null,early:early?.direction??early?.state??null};
  await statePut(env,'prediction:last',current).catch(()=>false);
  const history=(await stateGet(env,'prediction:history').catch(()=>null))||[];
  const next=[...history,current].slice(-240);
  await statePut(env,'prediction:history',next).catch(()=>false);
  return{ok:true,platform:'cloudflare-native',storage:stateStub(env)?'cloudflare-durable-object':'unbound',v9:v9?.ok?v9:null,early:early?.ok?early:null,previous:previous||null,historySize:next.length,ts:now};
}

async function predictionHistory(env){const history=(await stateGet(env,'prediction:history').catch(()=>null))||[];return{ok:true,platform:'cloudflare-native',storage:stateStub(env)?'cloudflare-durable-object':'unbound',history,ts:Date.now()}}

export default{async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,HEAD,OPTIONS','access-control-allow-headers':'*'}});
  try{
    if(url.pathname==='/api/market-summary')return json(await marketSummary());
    if(url.pathname==='/api/network-status')return json(await networkStatus());
    if(url.pathname==='/api/mobile-learning')return json(await learningState('v9',env));
    if(url.pathname==='/api/early-learning')return json(await learningState('early',env));
    if(url.pathname==='/api/prediction-state')return json(await predictionState(env));
    if(url.pathname==='/api/prediction-history')return json(await predictionHistory(env));
    if(url.pathname==='/api/health/v4')return json({ok:true,platform:'cloudflare-workers',stage:'native-v4',durableStateBound:!!env?.QUBIC_STATE_DO,ts:Date.now()});
    return core.fetch(request,env,ctx);
  }catch(error){return json({ok:false,platform:'cloudflare-native',error:String(error?.message||error),ts:Date.now()},503)}
}};
