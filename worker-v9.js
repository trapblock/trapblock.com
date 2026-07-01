// TrapBlock DNS Worker v18 — whitelist Braze + broader Yandex/monitoring coverage

const SUSPICIOUS_TLDS = [
  '.fun', '.space', '.top', '.shop', '.online', '.icu', '.xyz',
  '.click', '.live', '.vip', '.win', '.bet', '.casino', '.slots',
  '.games', '.quest', '.info', '.life', '.world', '.site', '.club',
  '.finance', '.investments', '.trading', '.exchange', '.market',
  '.website',
];

// Strict gambling-only keywords — no generic finance/tech terms that hit legitimate services
const GAMBLING_KEYWORDS = [
  'casino', 'slots', 'slot', 'poker', 'bingo', 'lotto', 'lottery',
  'jackpot', 'roulette', 'blackjack', 'betway', 'betfair',
  'wager', 'wagering', 'gambling', 'gamble',
  'topwin', 'bigwin', 'megawin', 'hotwin', 'fastwin', 'easywin',
  // Crypto scam terms — only explicit scam phrases, not generic finance words
  'bitcoin', 'btc', 'airdrop', 'defi', 'nft',
];

// Domains that must never be blocked — applies to both KV and pattern checks
const WHITELIST = [
  // Social / ad platforms
  'tiktok.com', 'tiktokv.com', 'tiktokcdn.com', 'tiktokw.us',
  'bytedance.com', 'pstatp.com', 'byteimg.com', 'ibytedtos.com',
  'facebook.com', 'fbcdn.net', 'instagram.com', 'threads.net',
  'google.com', 'googleapis.com', 'googletagmanager.com', 'googlesyndication.com', 'doubleclick.net', 'gstatic.com',
  'youtube.com', 'ytimg.com',
  'snapchat.com', 'snap.com',
  'twitter.com', 'x.com', 'twimg.com',
  'reddit.com', 'redd.it',
  'pinterest.com',
  // Apple / Microsoft / Amazon
  'apple.com', 'icloud.com', 'mzstatic.com',
  'microsoft.com', 'azure.com', 'msftconnecttest.com',
  'amazon.com', 'amazonaws.com', 'cloudfront.net',
  // CDN / infra
  'cloudflare.com', 'akamai.com', 'akamaized.net', 'fastly.com', 'fastly.net',
  'akamaihd.net', 'edgekey.net',
  // Commerce / payments
  'shopify.com', 'stripe.com', 'paypal.com', 'ebay.com',
  'etsy.com', 'aliexpress.com', 'wordpress.com', 'wix.com', 'squarespace.com',
  // Ad attribution & measurement (legitimate app tracking platforms)
  'adjust.com', 'app.adjust.com',
  'appsflyer.com', 'app.appsflyer.com',
  'branch.io',
  'kochava.com',
  'app-measurement.com',
  'googleadservices.com', 'googleads.g.doubleclick.net',
  'mixpanel.com',
  'outbrain.com', 'taboola.com', 'criteo.com',
  // Shared analytics/crash/monitoring infrastructure.
  // Gambling sites use all of these, so they end up in gambling blocklists.
  // Blocking them breaks every legitimate app that uses the same services.
  'google-analytics.com', 'ssl.google-analytics.com',
  'googletagmanager.com',
  'firebase.google.com', 'firebaseapp.com', 'firebaseio.com',
  'crashlytics.com', 'fabric.io',
  'segment.io', 'segment.com',
  'amplitude.com',
  'mixpanel.com', 'mxpnl.com',        // mxpnl.com is Mixpanel's CDN domain
  // Error reporting
  'sentry.io', 'ingest.sentry.io',
  'bugsnag.com',
  'rollbar.com',
  // Performance monitoring
  'newrelic.com', 'nr-data.net',
  'datadoghq.com', 'datadoghq.eu',
  // Session recording (used widely, including by Slack and Google)
  'hotjar.com',
  'fullstory.com',
  'heapanalytics.com',
  'logrocket.io', 'lr-in.com', 'lr-ingest.io',
  // Customer messaging
  'intercom.io', 'intercomcdn.com',
  // Product analytics
  'pendo.io',
  // Yandex infrastructure — all *.yandex.* subdomains must pass through
  'yandex.ru', 'yandex.com', 'yandex.net',
  'mc.yandex.ru', 'mc.yandex.com', 'metrika.yandex.ru',
  'ymetrica1.com', 'counter.yadro.ru',
  // Other legit
  'netflix.com', 'spotify.com', 'github.com', 'linkedin.com',
  'zendesk.com', 'zdassets.com',
  'twilio.com',
  'cloudinary.com',
  'gravatar.com',
  // Push notification and customer engagement platforms
  'braze.com', 'brazesdk.com', 'iad-01.braze.com', 'fra-01.braze.com',
  'onesignal.com', 'airship.com', 'leanplum.com', 'iterable.com',
  // Telemetry & tracing
  'honeycomb.io', 'lightstep.com',
];

const domainCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedBlock(domain) {
  const entry = domainCache.get(domain);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    domainCache.delete(domain);
    return null;
  }
  return entry.blocked;
}

function setCachedBlock(domain, blocked) {
  if (domainCache.size > 5000) domainCache.clear();
  domainCache.set(domain, { blocked, ts: Date.now() });
}

function isPatternBlocked(domain) {
  domain = domain.toLowerCase();

  // Never block whitelisted domains
  for (const safe of WHITELIST) {
    if (domain === safe || domain.endsWith('.' + safe)) return false;
  }

  // Must have a suspicious TLD
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some(tld => domain.endsWith(tld));
  if (!hasSuspiciousTLD) return false;

  // Must have a gambling keyword in the hostname (not TLD)
  const hostname = domain.split('.').slice(0, -1).join('.');
  const hasGamblingKeyword = GAMBLING_KEYWORDS.some(kw => hostname.includes(kw));
  if (!hasGamblingKeyword) return false;

  return true;
}

export default {
  async fetch(request, env, ctx) {// v9
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(request.url);

    if (url.pathname === '/debug') {
      const has = !!env.BLOCKLIST;
      const val = has ? await env.BLOCKLIST.get('bwin.com', { cacheTtl: 3600 }) : null;
      const patternTest = isPatternBlocked('topwininkow.shop');
      return new Response(JSON.stringify({
        version: 'v18',
        BLOCKLIST_defined: has,
        bwin_com_value: val,
        pattern_test_topwininkow_shop: patternTest,
        cache_size: domainCache.size
      }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (url.pathname !== '/dns-query') {
      return new Response('TrapBlock DNS Resolver', { headers: cors });
    }

    try {
      const dnsParam = url.searchParams.get('dns');
      if (dnsParam) return await handleRFC8484Get(dnsParam, env, cors);
      if (request.method === 'GET') return await handleJsonGet(request, env, cors);
      if (request.method === 'POST') return await handlePost(request, env, cors);
      return new Response('Method not allowed', { status: 405, headers: cors });
    } catch (e) {
      try {
        const name = url.searchParams.get('name') || 'cloudflare.com';
        const type = url.searchParams.get('type') || 'A';
        const r = await fetch(`https://1.1.1.1/dns-query?name=${name}&type=${type}`, {
          headers: { Accept: 'application/dns-json' }
        });
        return new Response(await r.text(), { headers: { ...cors, 'Content-Type': 'application/dns-json' } });
      } catch (e2) {
        return new Response('{}', { headers: { ...cors, 'Content-Type': 'application/dns-json' } });
      }
    }
  }
};

function isWhitelisted(domain) {
  domain = domain.toLowerCase().replace(/\.$/, '');
  return WHITELIST.some(safe => domain === safe || domain.endsWith('.' + safe));
}

async function shouldBlock(domain, env) {
  // 0. Whitelist always wins — applies to both KV and pattern checks
  if (isWhitelisted(domain)) return { blocked: false };
  // 1. Check KV blocklist
  if (await isDomainBlocked(domain, env)) return { blocked: true, reason: 'blocklist' };
  // 2. Check pattern matching
  if (isPatternBlocked(domain)) {
    // Only write to KV if not already logged (prevents burning write quota)
    if (env.BLOCKLIST) {
      const key = 'pattern:' + domain;
      env.BLOCKLIST.get(key, { cacheTtl: 3600 }).then(existing => {
        if (!existing) env.BLOCKLIST.put(key, '1').catch(() => {});
      }).catch(() => {});
    }
    return { blocked: true, reason: 'pattern' };
  }
  return { blocked: false };
}

async function handleRFC8484Get(dnsParam, env, cors) {
  try {
    const binary = base64urlDecode(dnsParam);
    const domain = parseDomain(binary);
    if (domain) {
      const { blocked } = await shouldBlock(domain, env);
      if (blocked) {
        return new Response(nxdomain(binary), {
          headers: { ...cors, 'Content-Type': 'application/dns-message' }
        });
      }
    }
    const r = await fetch(`https://1.1.1.1/dns-query?dns=${dnsParam}`, {
      headers: { Accept: 'application/dns-message' }
    });
    return new Response(await r.arrayBuffer(), {
      headers: { ...cors, 'Content-Type': 'application/dns-message' }
    });
  } catch (e) {
    const r = await fetch(`https://1.1.1.1/dns-query?dns=${dnsParam}`, {
      headers: { Accept: 'application/dns-message' }
    });
    return new Response(await r.arrayBuffer(), {
      headers: { ...cors, 'Content-Type': 'application/dns-message' }
    });
  }
}

async function handleJsonGet(request, env, cors) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const type = url.searchParams.get('type') || 'A';
    if (!name) return new Response('Missing name', { status: 400, headers: cors });

    const { blocked } = await shouldBlock(name, env);
    if (blocked) {
      return new Response(JSON.stringify({
        Status: 0, TC: false, RD: true, RA: true, AD: false, CD: false,
        Question: [{ name: name + '.', type: 1 }],
        Answer: [{ name: name + '.', type: 1, TTL: 3600, data: '0.0.0.0' }],
        Comment: 'Blocked by TrapBlock'
      }), { headers: { ...cors, 'Content-Type': 'application/dns-json' } });
    }

    const r = await fetch(
      `https://1.1.1.1/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
      { headers: { Accept: 'application/dns-json' } }
    );
    return new Response(await r.text(), { headers: { ...cors, 'Content-Type': 'application/dns-json' } });
  } catch (e) {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') || '';
    const type = url.searchParams.get('type') || 'A';
    const r = await fetch(`https://1.1.1.1/dns-query?name=${name}&type=${type}`, { headers: { Accept: 'application/dns-json' } });
    return new Response(await r.text(), { headers: { ...cors, 'Content-Type': 'application/dns-json' } });
  }
}

async function handlePost(request, env, cors) {
  const cloned = request.clone();
  try {
    const ct = request.headers.get('Content-Type') || '';
    if (!ct.includes('application/dns-message')) {
      return new Response('Invalid content type', { status: 400, headers: cors });
    }
    const body = await request.arrayBuffer();
    const domain = parseDomain(body);

    if (domain) {
      const { blocked } = await shouldBlock(domain, env);
      if (blocked) {
        return new Response(nxdomain(body), {
          headers: { ...cors, 'Content-Type': 'application/dns-message' }
        });
      }
    }

    const r = await fetch('https://1.1.1.1/dns-query', {
      method: 'POST', headers: { 'Content-Type': 'application/dns-message' }, body
    });
    return new Response(await r.arrayBuffer(), {
      headers: { ...cors, 'Content-Type': 'application/dns-message' }
    });
  } catch (e) {
    try {
      const body = await cloned.arrayBuffer();
      const r = await fetch('https://1.1.1.1/dns-query', {
        method: 'POST', headers: { 'Content-Type': 'application/dns-message' }, body
      });
      return new Response(await r.arrayBuffer(), {
        headers: { ...cors, 'Content-Type': 'application/dns-message' }
      });
    } catch (e2) {
      return new Response(new ArrayBuffer(12), {
        headers: { ...cors, 'Content-Type': 'application/dns-message' }
      });
    }
  }
}

async function isDomainBlocked(domain, env) {
  try {
    if (!env.BLOCKLIST) return false;
    domain = domain.toLowerCase().replace(/\.$/, '');
    const parts = domain.split('.');
    if (parts.length < 2) return false;

    const cached = getCachedBlock(domain);
    if (cached !== null) return cached;

    const checks = [domain];
    if (parts.length > 2) checks.push(parts.slice(1).join('.'));
    for (const check of checks) {
      if (await env.BLOCKLIST.get(check, { cacheTtl: 3600 }) !== null) {
        setCachedBlock(domain, true);
        return true;
      }
    }
    setCachedBlock(domain, false);
    return false;
  } catch (e) {
    return false;
  }
}

function parseDomain(buffer) {
  try {
    const b = new Uint8Array(buffer);
    let i = 12, d = '';
    while (i < b.length) {
      const len = b[i];
      if (len === 0 || len > 63) break;
      if (d) d += '.';
      d += String.fromCharCode(...b.slice(i + 1, i + 1 + len));
      i += len + 1;
    }
    return d.toLowerCase() || null;
  } catch (e) { return null; }
}

function nxdomain(query) {
  const r = new Uint8Array(new Uint8Array(query));
  r[2] = 0x81; r[3] = 0x83; r[6] = 0; r[7] = 0;
  return r.buffer;
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}
