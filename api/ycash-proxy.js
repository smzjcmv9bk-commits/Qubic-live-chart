export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=5, stale-while-revalidate=15');
  const kind=String(req.query.kind||'');
  const period=Math.max(1,Math.min(10080,Number(req.query.period)||15));
  const limit=Math.max(1,Math.min(500,Number(req.query.limit)||100));
  const days=String(req.query.days||'1');
  const safe='https://safe.trade/api/v2/peatio/public/markets/yecusdt';
  const cg='https://api.coingecko.com/api/v3';
  let url='';
  if(kind==='candles') url=`${safe}/k-line?period=${period}&limit=${limit}`;
  else if(kind==='trades') url=`${safe}/trades?limit=${limit}`;
  else if(kind==='book') url=`${safe}/order-book?asks_limit=${limit}&bids_limit=${limit}`;
  else if(kind==='coin') url=`${cg}/coins/ycash?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
  else if(kind==='tickers') url=`${cg}/coins/ycash/tickers?include_exchange_logo=true`;
  else if(kind==='chart') url=`${cg}/coins/ycash/market_chart?vs_currency=usd&days=${encodeURIComponent(days)}`;
  else return res.status(400).json({error:'bad kind'});
  try{
    const r=await fetch(url,{headers:{'accept':'application/json','user-agent':'YcashDashboard/1.0'}});
    const text=await r.text();
    res.status(r.status);
    res.setHeader('Content-Type',r.headers.get('content-type')||'application/json');
    return res.send(text);
  }catch(e){return res.status(502).json({error:'upstream unavailable',detail:String(e?.message||e)});}
}