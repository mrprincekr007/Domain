// Cloudflare Worker — DNS Proxy for SubManga app
// Deploy: Cloudflare Workers → Create Worker → paste this → Save
// Token is stored in an environment variable (safe).

export default {
  async fetch(request, env) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const path = url.searchParams.get('path');
      const zoneId = url.searchParams.get('zoneId');

      if (!path || !zoneId) {
        return new Response(JSON.stringify({ success: false, error: 'Missing path or zoneId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Token from environment variable (set in Worker settings)
      const token = env.DNS_PROXY_TOKEN;
      if (!token) {
        return new Response(JSON.stringify({ success: false, error: 'Token not configured in Worker' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // Read body for POST/PUT/DELETE
      let body = null;
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
        body = await request.text();
      }

      // Proxy request to Cloudflare API
      const apiResp = await fetch('https://api.cloudflare.com/client/v4' + path, {
        method: request.method === 'OPTIONS' ? 'GET' : request.method,
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: body || undefined,
      });

      const data = await apiResp.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};
