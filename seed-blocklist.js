// TrapBlock — Seed Blocklist v2
// Uploads gambling, crypto scam, and fake trading domains to Cloudflare KV

const ACCOUNT_ID = '0d1a05978a042e8ca512959e7c68ad54';
const NAMESPACE_ID = '10f19c30a6d44cc2bcbdd6a61f3502ca';
const API_TOKEN = process.env.CF_API_TOKEN;

const SOURCES = [
  // --- Gambling ---
  {
    url: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling/hosts',
    format: 'hosts',
    label: 'StevenBlack gambling',
  },
  {
    url: 'https://raw.githubusercontent.com/nicehash/NiceHashQuickMiner/master/blocking_lists/gambling.txt',
    format: 'plain',
    label: 'NiceHash gambling',
  },
  {
    url: 'https://raw.githubusercontent.com/blocklistproject/Lists/main/gambling.txt',
    format: 'plain',
    label: 'BlocklistProject gambling',
  },

  // --- Crypto scams & phishing ---
  {
    url: 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json',
    format: 'metamask-json',
    label: 'MetaMask crypto phishing',
  },
  {
    url: 'https://raw.githubusercontent.com/blocklistproject/Lists/main/scam.txt',
    format: 'plain',
    label: 'BlocklistProject scam',
  },
  {
    url: 'https://raw.githubusercontent.com/durablenapkin/scamblocklist/master/hosts.txt',
    format: 'hosts',
    label: 'Durablenapkin scam',
  },
  {
    url: 'https://raw.githubusercontent.com/Spam404/lists/master/main-blacklist.txt',
    format: 'plain',
    label: 'Spam404 fraud',
  },
];

// Domains that should never be blocked regardless of list membership
const WHITELIST = new Set([
  'google.com', 'apple.com', 'microsoft.com', 'amazon.com',
  'cloudflare.com', 'facebook.com', 'instagram.com', 'tiktok.com',
  'icloud.com', 'akamai.com', 'fastly.com', 'shopify.com',
  'wordpress.com', 'wix.com', 'squarespace.com', 'stripe.com',
  'paypal.com', 'ebay.com', 'etsy.com', 'github.com', 'twitter.com',
  'youtube.com', 'reddit.com', 'netflix.com', 'spotify.com',
]);

function isValidDomain(d) {
  return /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)+$/.test(d)
    && !WHITELIST.has(d)
    && d.length < 100;
}

async function fetchSource(source) {
  console.log(`  Fetching ${source.label}...`);
  let res;
  try {
    res = await fetch(source.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    console.warn(`  SKIP ${source.label}: ${e.message}`);
    return new Set();
  }

  const domains = new Set();

  if (source.format === 'metamask-json') {
    const json = await res.json();
    const blacklist = json.blacklist || json.data?.blacklist || [];
    for (const d of blacklist) {
      const domain = d.toLowerCase().replace(/^\*\./, '').trim();
      if (isValidDomain(domain)) domains.add(domain);
    }
    return domains;
  }

  const text = await res.text();
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!') || line.startsWith(';')) continue;

    if (source.format === 'hosts') {
      const m = line.match(/^(?:0\.0\.0\.0|127\.0\.0\.1)\s+(\S+)/);
      if (m) {
        const d = m[1].toLowerCase();
        if (d !== 'localhost' && isValidDomain(d)) domains.add(d);
      }
      continue;
    }

    // plain format — first token, strip wildcard
    const d = line.split(/\s+/)[0].toLowerCase().replace(/^\*\./, '');
    if (isValidDomain(d)) domains.add(d);
  }

  return domains;
}

async function uploadBatch(domains) {
  const body = domains.map(d => ({ key: d, value: '1' }));
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${NAMESPACE_ID}/bulk`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  const json = await res.json();
  if (!json.success) {
    console.error('Upload error:', JSON.stringify(json.errors));
    throw new Error('Upload failed');
  }
}

async function main() {
  const allDomains = new Set();

  for (const source of SOURCES) {
    const domains = await fetchSource(source);
    console.log(`    ${domains.size} domains`);
    for (const d of domains) allDomains.add(d);
  }

  const domainArray = [...allDomains];
  console.log(`\nTotal unique domains: ${domainArray.length}`);
  console.log('Uploading to Cloudflare KV in batches of 10,000...\n');

  const BATCH_SIZE = 10000;
  let uploaded = 0;

  for (let i = 0; i < domainArray.length; i += BATCH_SIZE) {
    const batch = domainArray.slice(i, i + BATCH_SIZE);
    await uploadBatch(batch);
    uploaded += batch.length;
    console.log(`Uploaded ${uploaded} / ${domainArray.length}`);
  }

  console.log('\nDone. Blocklist seeded.');
  console.log(`Total domains uploaded: ${uploaded}`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
