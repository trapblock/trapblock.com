#!/usr/bin/env python3
# TrapBlock — Seed Blocklist v3
# Runs automatically via GitHub Actions every day at 3 AM UTC.
# Domains expire from KV after 8 days if not refreshed — no manual clearing needed.
# To include Hagezi TIF (1.8M extra domains): set INCLUDE_TIF=1

import urllib.request
import json
import re
import sys
import os
import time

ACCOUNT_ID = '0d1a05978a042e8ca512959e7c68ad54'
NAMESPACE_ID = '10f19c30a6d44cc2bcbdd6a61f3502ca'
API_TOKEN = os.environ.get('CF_API_TOKEN', '')
INCLUDE_TIF = os.environ.get('INCLUDE_TIF', '').lower() in ('1', 'true', 'yes')

# Domains expire after 8 days if the daily seed does not refresh them.
# This automatically removes domains that disappear from source lists.
UPLOAD_TTL = 8 * 24 * 3600

SOURCES = [
    # Gambling sites — the core list
    ('https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling/hosts',
     'hosts', 'StevenBlack gambling'),
    # Phishing and scam landing pages — catches ad redirect targets
    ('https://phishing.army/download/phishing_army_blocklist.txt',
     'plain', 'Phishing Army'),
    # Crypto phishing — fake wallets and investment scams
    ('https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json',
     'metamask-json', 'MetaMask crypto phishing'),
]

# Optional: 1.8M broad threat domains. Enable with INCLUDE_TIF=1.
# Only run this via manual GitHub Actions trigger, not daily, to keep costs down.
TIF_SOURCE = (
    'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/domains/tif.txt',
    'plain',
    'Hagezi Threat Intelligence Feed (1.8M domains)'
)

# Must stay in sync with WHITELIST in worker-v9.js.
# Subdomains of these are also protected.
WHITELIST = {
    # Google
    'google.com', 'googleapis.com', 'gstatic.com', 'googletagmanager.com',
    'google-analytics.com', 'googleadservices.com', 'doubleclick.net',
    'googlesyndication.com', 'firebaseapp.com', 'firebaseio.com',
    'crashlytics.com', 'fabric.io', 'app-measurement.com',
    # Apple
    'apple.com', 'icloud.com', 'mzstatic.com',
    # Microsoft / Amazon
    'microsoft.com', 'azure.com', 'msftconnecttest.com',
    'amazon.com', 'amazonaws.com', 'cloudfront.net',
    # Social platforms
    'facebook.com', 'fbcdn.net', 'instagram.com', 'threads.net',
    'tiktok.com', 'tiktokv.com', 'tiktokcdn.com', 'bytedance.com',
    'twitter.com', 'x.com', 'twimg.com',
    'reddit.com', 'redd.it', 'pinterest.com',
    'snapchat.com', 'snap.com',
    # Communication
    'slack.com', 'slack-edge.com',
    'linkedin.com', 'licdn.com',
    # Media
    'youtube.com', 'ytimg.com', 'netflix.com', 'spotify.com',
    # CDN / infra
    'cloudflare.com', 'akamai.com', 'akamaized.net', 'akamaihd.net',
    'fastly.com', 'fastly.net', 'edgekey.net',
    # Commerce / payments
    'shopify.com', 'stripe.com', 'paypal.com', 'ebay.com',
    'etsy.com', 'aliexpress.com', 'wordpress.com', 'wix.com', 'squarespace.com',
    # Dev / code
    'github.com',
    # Analytics and attribution (shared with gambling sites but used by everyone)
    'adjust.com', 'appsflyer.com', 'branch.io', 'kochava.com',
    'mixpanel.com', 'segment.io', 'segment.com', 'amplitude.com',
    'outbrain.com', 'taboola.com', 'criteo.com',
    # Yandex
    'yandex.ru', 'yandex.com', 'yandex.net', 'yastatic.net',
    'mc.yandex.ru', 'mc.yandex.com', 'metrika.yandex.ru', 'ymetrica1.com',
    'counter.yadro.ru',
    # Certificate validation — blocking these breaks HTTPS for everyone
    'ocsp.digicert.com', 'ocsp.apple.com', 'ocsp.pki.goog', 'pki.goog',
    'ocsp.sectigo.com', 'ocsp.comodoca.com',
}

DOMAIN_RE = re.compile(
    r'^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)+$'
)

def is_valid(d):
    d = d.lower().strip().rstrip('.')
    if not DOMAIN_RE.match(d):
        return False
    if len(d) >= 100:
        return False
    parts = d.split('.')
    # Reject if domain or any parent is in whitelist
    for i in range(len(parts) - 1):
        if '.'.join(parts[i:]) in WHITELIST:
            return False
    return True

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'TrapBlock/3.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8', errors='ignore')

def parse_source(url, fmt, label):
    print(f'  Fetching {label}...')
    try:
        text = fetch(url)
    except Exception as e:
        print(f'  SKIP {label}: {e}')
        return set()

    domains = set()

    if fmt == 'metamask-json':
        data = json.loads(text)
        blacklist = data.get('blacklist', data.get('data', {}).get('blacklist', []))
        for d in blacklist:
            d = d.lower().lstrip('*.').strip()
            if is_valid(d):
                domains.add(d)
        return domains

    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith(('#', '!', ';')):
            continue
        if fmt == 'hosts':
            m = re.match(r'^(?:0\.0\.0\.0|127\.0\.0\.1)\s+(\S+)', line)
            if m:
                d = m.group(1).lower()
                if d != 'localhost' and is_valid(d):
                    domains.add(d)
        else:
            d = line.split()[0].lower().lstrip('*.')
            if is_valid(d):
                domains.add(d)

    return domains

def upload_batch(domains, retries=8):
    body = json.dumps([
        {'key': d, 'value': '1', 'expiration_ttl': UPLOAD_TTL}
        for d in domains
    ]).encode()
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}'
                f'/storage/kv/namespaces/{NAMESPACE_ID}/bulk',
                data=body,
                method='PUT',
                headers={
                    'Authorization': f'Bearer {API_TOKEN}',
                    'Content-Type': 'application/json',
                }
            )
            with urllib.request.urlopen(req, timeout=60) as r:
                result = json.loads(r.read())
            if not result.get('success'):
                raise RuntimeError(f"API error: {result.get('errors')}")
            return
        except urllib.error.HTTPError as e:
            if e.code == 429:
                # Respect Retry-After header if present, otherwise back off exponentially
                retry_after = int(e.headers.get('Retry-After', 0))
                wait = max(retry_after, 2 ** (attempt + 2))  # minimum 4s, grows to 512s
                print(f'    Rate limited. Waiting {wait}s before retry {attempt+1}/{retries}...')
                time.sleep(wait)
            else:
                wait = 2 ** attempt
                print(f'    HTTP {e.code}. Retry {attempt+1}/{retries} in {wait}s')
                time.sleep(wait)
        except Exception as e:
            wait = 2 ** attempt
            print(f'    Retry {attempt+1}/{retries} in {wait}s ({e})')
            time.sleep(wait)
    raise RuntimeError('Upload failed after all retries')

def upload_all(domains):
    domain_list = sorted(domains)
    total = len(domain_list)
    BATCH = 10000
    uploaded = 0
    for i in range(0, total, BATCH):
        batch = domain_list[i:i + BATCH]
        upload_batch(batch)
        uploaded += len(batch)
        print(f'  {uploaded:,} / {total:,}')
        time.sleep(1.0)
    return uploaded

def main():
    if not API_TOKEN:
        print('ERROR: CF_API_TOKEN environment variable not set.')
        print('Run with: CF_API_TOKEN=your_token python3 seed-blocklist.py')
        sys.exit(1)

    sources = list(SOURCES)
    if INCLUDE_TIF:
        sources.append(TIF_SOURCE)
        print('TIF mode ON: including Hagezi Threat Intelligence Feed')

    print('Fetching sources...')
    all_domains = set()
    for url, fmt, label in sources:
        domains = parse_source(url, fmt, label)
        print(f'    {len(domains):,} domains')
        all_domains.update(domains)

    print(f'\nTotal unique domains: {len(all_domains):,}')
    print(f'Uploading with {UPLOAD_TTL // 86400}-day expiry...\n')

    uploaded = upload_all(all_domains)
    print(f'\nDone. {uploaded:,} domains in KV.')

if __name__ == '__main__':
    main()
