const VERCEL_FALLBACK = 'https://qubic-intelligence-competition.vercel.app';

const json = (data, status = 200, extra = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,HEAD,OPTIONS',
    ...extra
  }
});

const timeout = (p, ms = 4500) => Promise.race([
  p,
  new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
]);

async function getJson(url) {
  const r = await timeout(fetch(url, {
    cache: 'no-store',
    headers: { accept: 'application/json', 'user-agent': 'QubicLiveChart-Cloudflare/1.0' }
  }));
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

const normTs = t => {
  const n = Number(t) || 0;
  return n < 1e12 ? n * 1000 : n;
};

function scoreRows(rows, now) {
  let usd = 0, n = 0, last = 0;
  for (const x of rows) {
    const t = normTs(x.t), p = Number(x.p), q = Number(x.q);
    if (t >= now - 120000 && p > 0 && q > 0) {
      usd += p * q;
      n++;
      last = Math.max(last, t);
    }
  }
  return { usd, n, last, score: usd * (1 + Math.min(n, 80) / 80) * (last > now - 20000 ? 1.15 : 1) };
}

let activityCache = { ts: 0, chosen: null, scores: {} };

async function exchangeActivity() {
  const now = Date.now();
  if (now - activityCache.ts < 15000 && activityCache.chosen) return activityCache;

  const rows = { GATE: [], MEXC: [], BITGET: [], COINEX: [], LBANK: [] };
  const push = (ex, p, q, t) => rows[ex].push({ p: +p, q: +q, t: normTs(t) });

  await Promise.allSettled([
    getJson('https://api.gateio.ws/api/v4/spot/trades?currency_pair=QUBIC_USDT&limit=100')
      .then(a => a.forEach(x => push('GATE', x.price, x.amount, x.create_time_ms || x.create_time))),
    getJson('https://api.mexc.com/api/v3/trades?symbol=QUBICUSDT&limit=100')
      .then(a => a.forEach(x => push('MEXC', x.price, x.qty, x.time))),
    getJson('https://api.bitget.com/api/v2/spot/market/fills?symbol=QUBICUSDT&limit=100')
      .then(x => (x.data || []).forEach(v => push('BITGET', v.price || v.px, v.size || v.sz, v.ts || v.time))),
    getJson('https://api.coinex.com/v2/spot/deals?market=QUBICUSDT&limit=100')
      .then(x => (x.data || []).forEach(v => push('COINEX', v.price, v.amount, v.created_at || v.createdAt || v.time))),
    getJson('https://api.lbkex.com/v2/trades.do?symbol=qubic_usdt&size=100')
      .then(x => (x.data || []).forEach(v => push('LBANK', v.price, v.amount || v.volume, v.date_ms || v.date || v.time)))
  ]);

  const scores = {};
  for (const [k, v] of Object.entries(rows)) scores[k] = scoreRows(v, now);
  const ranked = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
  activityCache = { ts: now, chosen: ranked[0]?.[0] || 'GATE', scores };
  return activityCache;
}

const maps = {
  GATE: { '1m':'1m','5m':'5m','15m':'15m','30m':'30m','1h':'1h','4h':'4h','1d':'1d' },
  MEXC: { '1m':'1m','5m':'5m','15m':'15m','30m':'30m','1h':'60m','4h':'4h','1d':'1d' },
  BITGET: { '1m':'1min','5m':'5min','15m':'15min','30m':'30min','1h':'1h','4h':'4h','1d':'1day' },
  COINEX: { '1m':'1min','5m':'5min','15m':'15min','30m':'30min','1h':'1hour','4h':'4hour','1d':'1day' },
  LBANK: { '1m':'minute1','5m':'minute5','15m':'minute15','30m':'minute30','1h':'hour1','4h':'hour4','1d':'day1' }
};
const seconds = { '1m':60,'5m':300,'15m':900,'30m':1800,'1h':3600,'4h':14400,'1d':86400 };

async function exchangeCandles(ex, iv, limit) {
  if (ex === 'GATE') {
    const a = await getJson(`https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=QUBIC_USDT&interval=${maps.GATE[iv]}&limit=${limit}`);
    return a.map(x => ({ time:+x[0], open:+x[5], high:+x[3], low:+x[4], close:+x[2], volume:+x[1] || 0 }));
  }
  if (ex === 'MEXC') {
    const a = await getJson(`https://api.mexc.com/api/v3/klines?symbol=QUBICUSDT&interval=${maps.MEXC[iv]}&limit=${limit}`);
    return a.map(x => ({ time:Math.floor(+x[0]/1000), open:+x[1], high:+x[2], low:+x[3], close:+x[4], volume:+x[5] || 0 }));
  }
  if (ex === 'BITGET') {
    const x = await getJson(`https://api.bitget.com/api/v2/spot/market/candles?symbol=QUBICUSDT&granularity=${maps.BITGET[iv]}&limit=${Math.min(limit,1000)}`);
    return (x.data || []).map(v => ({ time:Math.floor(+v[0]/1000), open:+v[1], high:+v[2], low:+v[3], close:+v[4], volume:+v[5] || 0 }));
  }
  if (ex === 'COINEX') {
    const x = await getJson(`https://api.coinex.com/v2/spot/kline?market=QUBICUSDT&period=${maps.COINEX[iv]}&limit=${Math.min(limit,1000)}`);
    return (x.data || []).map(v => ({ time:Math.floor(+(v.created_at || v.createdAt)/1000), open:+v.open, high:+v.high, low:+v.low, close:+v.close, volume:+v.volume || 0 }));
  }
  if (ex === 'LBANK') {
    const start = Math.floor(Date.now()/1000) - Math.min(limit,2000) * seconds[iv];
    const x = await getJson(`https://api.lbank.info/v2/kline.do?symbol=qubic_usdt&size=${Math.min(limit,2000)}&type=${maps.LBANK[iv]}&time=${start}`);
    return (x.data || []).map(v => ({ time:+v[0], open:+v[1], high:+v[2], low:+v[3], close:+v[4], volume:+v[5] || 0 }));
  }
  return [];
}

async function activeCandles(url) {
  const allowed = ['1m','5m','15m','30m','1h','4h','1d'];
  const iv = allowed.includes(url.searchParams.get('interval')) ? url.searchParams.get('interval') : '15m';
  const limit = Math.max(60, Math.min(1000, +(url.searchParams.get('limit') || 480)));
  const prefer = String(url.searchParams.get('prefer') || '').toUpperCase();
  const a = await exchangeActivity();
  const ranked = Object.entries(a.scores).sort((x,y) => y[1].score - x[1].score);
  let chosen = a.chosen;
  const top = ranked[0]?.[1]?.score || 0;
  if (prefer && a.scores[prefer] && a.scores[prefer].score >= top * 0.65) chosen = prefer;
  const order = [chosen, ...ranked.map(x => x[0]), 'GATE'].filter((v,i,s) => v && s.indexOf(v) === i);
  let data = [], source = null;
  const minHistory = Math.min(80, Math.max(40, Math.floor(limit * 0.15)));
  const rejected = {};
  for (const ex of order) {
    try {
      const d = (await exchangeCandles(ex, iv, limit))
        .filter(x => Number.isFinite(x.time) && x.open > 0 && x.high > 0 && x.low > 0 && x.close > 0)
        .sort((x,y) => x.time - y.time);
      if (d.length >= minHistory) { data = d; source = ex; break; }
      rejected[ex] = d.length;
    } catch (e) {
      rejected[ex] = String(e?.message || e);
    }
  }
  if (!data.length) return { status:503, body:{ ok:false, error:'No active exchange has enough candle history', interval:iv, minHistory, rejected, ts:Date.now() } };
  return { status:200, body:{ ok:true, platform:'cloudflare-native', interval:iv, source, activity:a.scores, minHistory, rejected, candles:data, ts:Date.now() } };
}

const TFS = ['5m','15m','1h','4h'];
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
const avg = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : 0;
function avwap(rows,start){let pv=0,v=0,out=[];for(let i=start;i<rows.length;i++){const c=rows[i],tp=(c.high+c.low+c.close)/3,vol=Math.max(0,+c.volume||0);pv+=tp*vol;v+=vol;out.push({time:c.time,value:v?pv/v:tp})}return out}
function slope(a){if(a.length<4)return 0;const x=a.slice(-4);return (x.at(-1).value-x[0].value)/Math.max(Math.abs(x[0].value),1e-15)}
function swing(rows,type,look=80){let best=null;for(let i=Math.max(2,rows.length-look);i<rows.length-2;i++){const c=rows[i];if(type==='low'&&c.low<=rows[i-1].low&&c.low<=rows[i+1].low){if(!best||c.low<best.v)best={i,v:c.low,time:c.time}}if(type==='high'&&c.high>=rows[i-1].high&&c.high>=rows[i+1].high){if(!best||c.high>best.v)best={i,v:c.high,time:c.time}}}return best}
function analyzeAvwap(rows,tf,source){rows=(rows||[]).filter(x=>+x.close>0&&+x.high>0&&+x.low>0&&+x.open>0).sort((a,b)=>a.time-b.time);if(rows.length<60)return null;const last=rows.at(-1),vols=rows.slice(-40).map(x=>+x.volume||0),v20=avg(vols.slice(-20));let hv=null;for(let i=Math.max(1,rows.length-80);i<rows.length;i++){const ratio=v20?((+rows[i].volume||0)/v20):0;if(ratio>=1.5&&(!hv||ratio>hv.ratio))hv={i,ratio,time:rows[i].time}}const lo=swing(rows,'low'),hi=swing(rows,'high');const anchors=[];if(hv)anchors.push({type:'HIGH VOLUME',i:hv.i});if(lo)anchors.push({type:'SWING LOW',i:lo.i});if(hi)anchors.push({type:'SWING HIGH',i:hi.i});if(!anchors.length)anchors.push({type:'RECENT',i:Math.max(0,rows.length-40)});const lines=anchors.map(a=>{const z=avwap(rows,a.i),now=z.at(-1)?.value||last.close;return{type:a.type,time:rows[a.i].time,value:now,slope:slope(z),distancePct:(last.close/now-1)*100}});let bull=0,bear=0;for(const l of lines){if(last.close>l.value&&l.slope>=0)bull++;else if(last.close<l.value&&l.slope<=0)bear++}const dir=bull>bear?'UP':bear>bull?'DOWN':'NEUTRAL';const score=Math.round(clamp(50+Math.abs(bull-bear)*12+Math.min(18,Math.max(...lines.map(x=>Math.abs(x.distancePct)))),50,92));let pinch=null;if(lo&&hi){const a=avwap(rows,lo.i),b=avwap(rows,hi.i),va=a.at(-1)?.value,vb=b.at(-1)?.value;if(va&&vb){const spread=Math.abs(va-vb)/last.close*100;pinch={active:spread<1.1,spreadPct:+spread.toFixed(3),upper:Math.max(va,vb),lower:Math.min(va,vb)}}}return{tf,source,price:last.close,direction:dir,score,bull,bear,anchors:lines,pinch,highVolumeRatio:hv?+hv.ratio.toFixed(2):null}}

async function avwapSignal() {
  const settled = await Promise.allSettled(TFS.map(async tf => {
    const u = new URL('https://internal.invalid/api/active-candles');
    u.searchParams.set('interval', tf); u.searchParams.set('limit','320');
    const result = await activeCandles(u);
    if (result.status !== 200 || !result.body.ok) throw new Error(`${tf}:candles`);
    return analyzeAvwap(result.body.candles, tf, result.body.source || '—');
  }));
  const frames = settled.filter(x => x.status === 'fulfilled' && x.value).map(x => x.value);
  if (!frames.length) return { status:503, body:{ ok:false, error:'No AVWAP frames', ts:Date.now() } };
  const up=frames.filter(x=>x.direction==='UP').length, down=frames.filter(x=>x.direction==='DOWN').length, neutral=frames.length-up-down;
  const direction=up>down?'UP':down>up?'DOWN':'NEUTRAL';
  const alignment=Math.round(Math.max(up,down,neutral)/frames.length*100);
  const strength=Math.round(avg(frames.filter(x=>x.direction===direction).map(x=>x.score))||50);
  const pinchFrames=frames.filter(x=>x.pinch?.active).map(x=>x.tf);
  const state=direction==='UP'?1:direction==='DOWN'?-1:0;
  return { status:200, body:{ ok:true, platform:'cloudflare-native', engine:'AVWAP CONFLUENCE', state, direction, alignment, strength, pinchFrames, frames, ts:Date.now() } };
}

async function proxyLegacyApi(request, url) {
  const upstream = new URL(url.pathname + url.search, VERCEL_FALLBACK);
  const headers = new Headers(request.headers);
  headers.delete('host');
  const init = { method: request.method, headers, redirect: 'follow' };
  if (!['GET','HEAD'].includes(request.method)) init.body = request.body;
  const response = await fetch(upstream, init);
  const out = new Headers(response.headers);
  out.set('x-qubic-cloudflare-stage','legacy-api-bridge');
  out.set('cache-control','no-store, max-age=0');
  out.set('access-control-allow-origin','*');
  return new Response(response.body,{status:response.status,headers:out});
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,HEAD,OPTIONS','access-control-allow-headers':'*'}});

    if (url.pathname === '/api/health') {
      return json({ ok:true, platform:'cloudflare-workers', project:'Qubic Live Chart', stage:'native-core', nativeApis:['/api/active-candles','/api/avwap-signal'], ts:Date.now() });
    }

    try {
      if (url.pathname === '/api/active-candles') {
        const r = await activeCandles(url);
        return json(r.body, r.status, {'x-qubic-cloudflare-stage':'native-active-candles'});
      }
      if (url.pathname === '/api/avwap-signal') {
        const r = await avwapSignal();
        return json(r.body, r.status, {'x-qubic-cloudflare-stage':'native-avwap'});
      }
      if (url.pathname.startsWith('/api/')) return await proxyLegacyApi(request,url);
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ ok:false, platform:'cloudflare-workers', error:String(error?.message||error), ts:Date.now() },503);
    }
  }
};
