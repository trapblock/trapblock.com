#!/usr/bin/env python3
# TrapBlock — Seed Blocklist v2

import urllib.request
import json
import re
import sys
import os

ACCOUNT_ID = '0d1a05978a042e8ca512959e7c68ad54'
NAMESPACE_ID = '10f19c30a6d44cc2bcbdd6a61f3502ca'
API_TOKEN = os.environ.get('CF_API_TOKEN', '')

SOURCES = [
    # Gambling
    ('https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/gambling/hosts', 'hosts', 'StevenBlack gambling'),
    ('https://raw.githubusercontent.com/nicehash/NiceHashQuickMiner/master/blocking_lists/gambling.txt', 'plain', 'NiceHash gambling'),
    ('https://raw.githubusercontent.com/blocklistproject/Lists/main/gambling.txt', 'plain', 'BlocklistProject gambling'),
    # Crypto scams & phishing
    ('https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json', 'metamask-json', 'MetaMask crypto phishing'),
    ('https://raw.githubusercontent.com/blocklistproject/Lists/main/scam.txt', 'plain', 'BlocklistProject scam'),
    ('https://raw.githubusercontent.com/durablenapkin/scamblocklist/master/hosts.txt', 'hosts', 'Durablenapkin scam'),
    ('https://raw.githubusercontent.com/Spam404/lists/master/main-blacklist.txt', 'plain', 'Spam404 fraud'),
]

WHITELIST = {
    'google.com', 'apple.com', 'microsoft.com', 'amazon.com',
    'cloudflare.com', 'facebook.com', 'instagram.com', 'tiktok.com',
    'icloud.com', 'akamai.com', 'fastly.com', 'shopify.com',
    'wordpress.com', 'wix.com', 'squarespace.com', 'stripe.com',
    'paypal.com', 'ebay.com', 'etsy.com', 'github.com', 'twitter.com',
    'youtube.com', 'reddit.com', 'netflix.com', 'spotify.com',
}

DOMAIN_RE = re.compile(r'^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)+$')

def is_valid(d):
    return bool(DOMAIN_RE.match(d)) and d not in WHITELIST and len(d) < 100

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'TrapBlock/2.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
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

def upload_batch(domains):
    body = json.dumps([{'key': d, 'value': '1'} for d in domains]).encode()
    req = urllib.request.Request(
        f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/storage/kv/namespaces/{NAMESPACE_ID}/bulk',
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
        raise RuntimeError(f"Upload failed: {result.get('errors')}")

def main():
    all_domains = set()

    for url, fmt, label in SOURCES:
        domains = parse_source(url, fmt, label)
        print(f'    {len(domains)} domains')
        all_domains.update(domains)

    domain_list = sorted(all_domains)
    print(f'\nTotal unique domains: {len(domain_list)}')
    print('Uploading in batches of 10,000...\n')

    BATCH = 10000
    uploaded = 0
    for i in range(0, len(domain_list), BATCH):
        batch = domain_list[i:i+BATCH]
        upload_batch(batch)
        uploaded += len(batch)
        print(f'Uploaded {uploaded} / {len(domain_list)}')

    print(f'\nDone. {uploaded} domains in KV.')

if __name__ == '__main__':
    main()
