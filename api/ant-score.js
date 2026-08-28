const BASE='https://qubic.jetskipool.ai';
const UA='Mozilla/5.0 (compatible; QubicIntelligence/1.0)';

function scoreFromObject(x){
  const vals=[];
  const walk=(v,key='')=>{
    if(v==null)return;
    if(typeof v==='object'){
      if(Array.isArray(v))v.forEach(z=>walk(z,key));
      else Object.entries(v).forEach(([k,z])=>walk(z,k));
      return;
    }
    const n=Number(v);
    if(Number.isFinite(n)&&n>=100&&n<100000&&/score/i.test(key)&&!/total|projected|average/i.test(key))vals.push(n);
  };
  walk(x);
  return vals.length?Math.min(...vals):null;
}
function scoreFromText(t){
  const vals=[];
  const patterns=[
    /(?:"|')?score(?:"|')?\s*[:=]\s*(?:"|')?([0-9]{3,5})/gi,
    /<[^>]*>\s*score\s*<[^>]*>[\s\S]{0,120}?([0-9]{3,5})/gi,
    /\bscore\b[\s\S]{0,40}?\b([0-9]{3,5})\b/gi
  ];
  for(const re of patterns)for(const m of t.matchAll(re)){const n=+m[1];if(n>=100&&n<100000)vals.push(n)}
  return vals.length?Math.min(...vals):null;
}
async function get(url){
  const r=await fetch(url,{headers:{'user-agent':UA,'accept':'application/json,text/plain,text/html,*/*'},redirect:'follow',cache:'no-store'});
  if(!r.ok)throw new Error(`${r.status} ${url}`);
  const ct=r.headers.get('content-type')||'';
  const text=await r.text();
  return {ct,text,url:r.url};
}
function endpointCandidates(html){
  const out=new Set([
    '/api/identities','/api/tracker','/api/stats','/api/data','/api/registry','/api/scores','/api/leaderboard','/api/identity','/api/network'
  ]);
  for(const m of html.matchAll(/["'`](\/api\/[A-Za-z0-9_?=&./:-]+)["'`]/g))out.add(m[1]);
  return [...out];
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin','*');
  try{
    const root=await get(BASE+'/');
    let s=scoreFromText(root.text);
    if(Number.isFinite(s))return res.status(200).json({score:s,source:'jetskipool-root',ts:Date.now()});

    const scripts=[...root.text.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]).slice(0,20);
    let combined=root.text;
    for(const src of scripts){
      try{
        const u=new URL(src,BASE).href;
        const js=await get(u);
        combined+='\n'+js.text;
        s=scoreFromText(js.text);
        if(Number.isFinite(s))return res.status(200).json({score:s,source:'jetskipool-script',ts:Date.now()});
      }catch{}
    }

    const candidates=endpointCandidates(combined);
    for(const p of candidates){
      try{
        const u=new URL(p,BASE).href;
        const r=await get(u);
        let score=null;
        if(/json/i.test(r.ct)){
          try{score=scoreFromObject(JSON.parse(r.text))}catch{}
        }
        if(!Number.isFinite(score))score=scoreFromText(r.text);
        if(Number.isFinite(score))return res.status(200).json({score,source:u,ts:Date.now()});
      }catch{}
    }
    return res.status(503).json({score:null,error:'Jetski tracker reachable but no live individual score endpoint was detected',checked:candidates.length,ts:Date.now()});
  }catch(e){
    return res.status(502).json({score:null,error:String(e?.message||e),ts:Date.now()});
  }
}
