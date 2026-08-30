import core from './worker-v2.js';

const RAW='https://raw.githubusercontent.com/smzjcmv9bk-commits/Qubic-live-chart/learning-data/learning';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','access-control-allow-origin':'*','access-control-allow-methods':'GET,HEAD,OPTIONS'}});
const timeout=(p,ms=5500)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout')),ms))]);
async function getJson(url,ms=5500){const r=await timeout(fetch(url,{cache:'no-store',headers:{accept:'application/json','user-agent':'QubicLiveChart-Cloudflare/3.0'}}),ms);if(!r.ok)throw new Error(String(r.status));return r.json()}

async function marketSummary(){const x=(await getJson('https://api.gateio.ws/api/v4/spot/tickers?currency_pair=QUBIC_USDT'))?.[0]||{};const data={price:+x.last||null,change24:+x.change_percentage||null,high24:+x.high_24h||null,low24:+x.low_24h||null,baseVolume:+x.base_volume||null,quoteVolume:+x.quote_volume||null};return{ok:!!data.price,platform:'cloudflare-native',...data,ts:Date.now()}}

async function networkStatus(){const start=Date.now();const d=await getJson('https://rpc.qubic.org/v1/tick-info',6000);const x=d?.tickInfo||d||{};const tick=Number(x.tick??x.currentTick),epoch=Number(x.epoch);return{ok:Number.isFinite(tick),platform:'cloudflare-native',tick:Number.isFinite(tick)?tick:null,epoch:Number.isFinite(epoch)?epoch:null,timestamp:x.timestamp||x.time||new Date().toISOString(),latency:Date.now()-start,ts:Date.now()}}

async function learningState(kind,env){const file=kind==='early'?'early-structure.json':'v9-state.json';const cacheKey=`learning:${kind}`;try{const state=await getJson(`${RAW}/${file}?t=${Date.now()}`,5000);if(env?.QUBIC_STATE?.put){await env.QUBIC_STATE.put(cacheKey,JSON.stringify(state),{expirationTtl:86400}).catch(()=>{})}return{ok:true,platform:'cloudflare-native',storage:env?.QUBIC_STATE?'kv+github':'github',...state}}catch(error){if(env?.QUBIC_STATE?.get){const saved=await env.QUBIC_STATE.get(cacheKey,'json').catch(()=>null);if(saved)return{ok:true,platform:'cloudflare-native',storage:'kv-fallback',stale:true,...saved}}throw error}}

async function predictionState(env){let v9=null,early=null;try{[v9,early]=await Promise.all([learningState('v9',env),learningState('early',env)])}catch{}const now=Date.now();const previous=env?.QUBIC_STATE?.get?await env.QUBIC_STATE.get('prediction:last','json').catch(()=>null):null;const state={ok:true,platform:'cloudflare-native',storage:env?.QUBIC_STATE?'cloudflare-kv':'ephemeral-until-kv-bound',v9:v9?.ok?v9:null,early:early?.ok?early:null,previous:previous||null,ts:now};if(env?.QUBIC_STATE?.put)await env.QUBIC_STATE.put('prediction:last',JSON.stringify({ts:now,v9:v9?.state??v9?.direction??null,early:early?.direction??early?.state??null}),{expirationTtl:604800}).catch(()=>{});return state}

export default{async fetch(request,env,ctx){const url=new URL(request.url);if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,HEAD,OPTIONS','access-control-allow-headers':'*'}});try{
if(url.pathname==='/api/market-summary')return json(await marketSummary());
if(url.pathname==='/api/network-status')return json(await networkStatus());
if(url.pathname==='/api/mobile-learning')return json(await learningState('v9',env));
if(url.pathname==='/api/early-learning')return json(await learningState('early',env));
if(url.pathname==='/api/prediction-state')return json(await predictionState(env));
if(url.pathname==='/api/health/v3')return json({ok:true,platform:'cloudflare-workers',stage:'native-v3',kvBound:!!env?.QUBIC_STATE,ts:Date.now()});
return core.fetch(request,env,ctx)
}catch(error){return json({ok:false,platform:'cloudflare-native',error:String(error?.message||error),ts:Date.now()},503)}}};
