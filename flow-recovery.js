(()=>{
let busy=false,lastGood=0;
async function pull(){if(busy)return;busy=true;try{let r=await fetch('/api/live-trades?ts='+Date.now(),{cache:'no-store'}),x=await r.json();if(!r.ok||!x.ok)throw Error(r.status);let n=0;(x.trades||[]).forEach(t=>{try{add(t.ex,t.p,t.q,t.s,t.t,t.id||('proxy-'+t.t+'-'+t.p+'-'+t.q));n++}catch{}});if(n){lastGood=Date.now();try{Object.entries(x.status||{}).forEach(([k,v])=>{if(v&&feed&&k in feed)feed[k]=1;if(typeof exCard==='function'&&v)exCard(k,'LIVE')})}catch{}try{stats();render()}catch{}}window.QUBIC_FLOW_RECOVERY={ok:n>0,count:n,ts:Date.now(),status:x.status||{}}}catch(e){window.QUBIC_FLOW_RECOVERY={ok:false,count:0,ts:Date.now(),error:String(e)}}finally{busy=false}}
pull();setInterval(pull,3000);
})();