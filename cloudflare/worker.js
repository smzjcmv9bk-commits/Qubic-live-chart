const VERCEL_FALLBACK = 'https://qubic-intelligence-competition.vercel.app';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, max-age=0',
    'access-control-allow-origin': '*'
  }
});

async function proxyLegacyApi(request, url) {
  const upstream = new URL(url.pathname + url.search, VERCEL_FALLBACK);
  const headers = new Headers(request.headers);
  headers.set('host', upstream.host);
  const init = {
    method: request.method,
    headers,
    redirect: 'follow'
  };
  if (!['GET', 'HEAD'].includes(request.method)) init.body = request.body;
  const response = await fetch(upstream, init);
  const out = new Headers(response.headers);
  out.set('x-qubic-cloudflare-stage', 'legacy-api-bridge');
  out.set('cache-control', 'no-store, max-age=0');
  return new Response(response.body, { status: response.status, headers: out });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return json({
        ok: true,
        platform: 'cloudflare-workers',
        project: 'Qubic Live Chart',
        stage: 'rebuild',
        ts: Date.now()
      });
    }

    if (url.pathname.startsWith('/api/')) {
      // Phase 1 safety bridge: keep the current dashboard functional while each
      // API is rebuilt natively for Workers. Remove this bridge once parity is complete.
      try {
        return await proxyLegacyApi(request, url);
      } catch (error) {
        return json({ ok: false, error: String(error?.message || error), ts: Date.now() }, 502);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
