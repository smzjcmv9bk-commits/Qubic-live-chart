(()=>{
  const mobile=matchMedia('(max-width:800px)').matches||/iPhone|iPad|iPod/i.test(navigator.userAgent);
  if(!mobile)return;
  window.QUBIC_MOBILE_SAFE_MODE=true;

  /* iOS safe mode: stop high-frequency exchange websocket message storms before app2 starts. */
  const NativeWS=window.WebSocket;
  const blockedHosts=['api.gateio.ws','socket.coinex.com','api.lbank.info','ws.bitget.com'];
  class QuietSocket{
    constructor(url){this.url=String(url||'');this.readyState=0;this.bufferedAmount=0;this.protocol='';this.extensions='';this.binaryType='blob';this.onopen=null;this.onmessage=null;this.onerror=null;this.onclose=null;}
    send(){}
    close(){this.readyState=3;}
    addEventListener(){}
    removeEventListener(){}
    dispatchEvent(){return true;}
  }
  window.WebSocket=function(url,protocols){
    const s=String(url||'');
    if(blockedHosts.some(h=>s.includes(h)))return new QuietSocket(s);
    return protocols===undefined?new NativeWS(url):new NativeWS(url,protocols);
  };
  window.WebSocket.prototype=NativeWS.prototype;
  try{window.WebSocket.CONNECTING=0;window.WebSocket.OPEN=1;window.WebSocket.CLOSING=2;window.WebSocket.CLOSED=3}catch{}

  /* MEXC's direct 3-second trade polling is redundant on mobile because /api/live-trades supplies consolidated flow. */
  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    const u=typeof input==='string'?input:(input&&input.url)||'';
    if(u.includes('api.mexc.com/api/v3/trades?symbol=QUBICUSDT')){
      return Promise.resolve(new Response('[]',{status:200,headers:{'Content-Type':'application/json'}}));
    }
    return nativeFetch(input,init);
  };

  /* Audio nodes were a major source of iOS main-thread/audio-context pressure during bursts. */
  try{audioOn=false}catch{}
  try{sound=function(){}}catch{}

  /* Direct websocket trades are intentionally disabled. Net-flow-v2 remains the lightweight consolidated flow source. */
  try{add=function(){}}catch{}

  /* Refresh canonical Gate candles at a calm cadence instead of per trade. */
  let chartBusy=false;
  async function refreshChart(){
    if(document.hidden||chartBusy||typeof hist!=='function')return;
    chartBusy=true;
    try{await hist()}catch{}finally{chartBusy=false}
  }
  setTimeout(refreshChart,2500);
  setInterval(refreshChart,15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(refreshChart,600)});

  /* Force sound UI off so Safari never creates trade-by-trade AudioNodes in safe mode. */
  setTimeout(()=>{
    const a=document.getElementById('audio'),b=document.getElementById('soundBtn');
    if(a){a.textContent='🔇 SOUND OFF · MOBILE SAFE';a.classList.remove('on')}
    if(b){b.textContent='🔇 Sound off · mobile safe';b.classList.remove('on')}
  },1000);

  window.QUBIC_MOBILE_SAFE_STATUS={active:true,websockets:'blocked',directTrades:'disabled',chartRefreshMs:15000,ts:Date.now()};
})();