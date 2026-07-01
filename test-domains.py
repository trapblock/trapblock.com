#!/usr/bin/env python3
# TrapBlock — Domain Safety Test
# Run before every reinstall: python3 test-domains.py
# All SAFE domains must pass. All BLOCKED domains must be blocked.

import urllib.request
import json
import sys

WORKER = 'https://trapblock-dns.hidden-block-0f73.workers.dev/dns-query'

# These must NEVER be blocked
SAFE = [
    # Search & browsers
    ('google.com',              'Google'),
    ('www.google.com',          'Google www'),
    ('accounts.google.com',     'Google accounts'),
    ('googleapis.com',          'Google APIs'),
    ('gstatic.com',             'Google static'),
    ('bing.com',                'Bing'),
    ('duckduckgo.com',          'DuckDuckGo'),
    ('yahoo.com',               'Yahoo'),
    # Apple system
    ('apple.com',               'Apple'),
    ('icloud.com',              'iCloud'),
    ('mzstatic.com',            'App Store CDN'),
    ('smoot.apple.com',         'Safari suggestions'),
    ('api.apple.com',           'Apple API'),
    ('push.apple.com',          'Apple Push'),
    ('xp.apple.com',            'Apple XP'),
    # Social / messaging
    ('slack.com',               'Slack'),
    ('slack-edge.com',          'Slack CDN'),
    ('a.slack-edge.com',        'Slack CDN A'),
    ('wss-primary.slack.com',   'Slack WebSocket'),
    ('linkedin.com',            'LinkedIn'),
    ('platform.linkedin.com',   'LinkedIn platform'),
    ('licdn.com',               'LinkedIn CDN'),
    ('facebook.com',            'Facebook'),
    ('instagram.com',           'Instagram'),
    ('tiktok.com',              'TikTok'),
    ('analytics.tiktok.com',    'TikTok analytics'),
    ('twitter.com',             'Twitter'),
    ('x.com',                   'X'),
    ('reddit.com',              'Reddit'),
    # Video / audio
    ('youtube.com',             'YouTube'),
    ('ytimg.com',               'YouTube images'),
    ('netflix.com',             'Netflix'),
    ('spotify.com',             'Spotify'),
    # Browsers
    ('yandex.ru',               'Yandex search'),
    ('yandex.com',              'Yandex'),
    ('yastatic.net',            'Yandex static'),
    # Ad / attribution (legitimate)
    ('googleadservices.com',    'Google Ads'),
    ('adjust.com',              'Adjust attribution'),
    ('appsflyer.com',           'AppsFlyer'),
    ('branch.io',               'Branch'),
    ('kochava.com',             'Kochava'),
    ('app-measurement.com',     'Firebase measurement'),
    ('criteo.com',              'Criteo'),
    ('taboola.com',             'Taboola'),
    ('outbrain.com',            'Outbrain'),
    # Commerce
    ('shopify.com',             'Shopify'),
    ('stripe.com',              'Stripe'),
    ('paypal.com',              'PayPal'),
    ('amazon.com',              'Amazon'),
    ('amazonaws.com',           'AWS'),
    # CDN / infra
    ('cloudflare.com',          'Cloudflare'),
    ('fastly.com',              'Fastly'),
    ('akamaized.net',           'Akamai'),
    ('github.com',              'GitHub'),
]

# These MUST be blocked
BLOCKED = [
    ('topwininkow.shop',        'Pattern: topwin + .shop'),
    ('bigwin-casino.xyz',       'Pattern: bigwin + casino + .xyz'),
    ('casino-slots.fun',        'Pattern: casino + .fun'),
    ('megawin888.online',       'Pattern: megawin + .online'),
    ('jackpot-winner.site',     'Pattern: jackpot + .site'),
    ('bitcoin-airdrop.xyz',     'Pattern: bitcoin + .xyz'),
    ('bingo-bonus.club',        'Pattern: bingo + .club'),
]

def check(domain):
    url = f'{WORKER}?name={domain}&type=A'
    req = urllib.request.Request(url, headers={'User-Agent': 'TrapBlock-Test/1.0'})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
    answers = data.get('Answer', [])
    if answers and answers[0].get('data') == '0.0.0.0':
        return 'blocked-sinkhole'
    if data.get('Status') == 3:
        return 'blocked-nxdomain'
    if answers:
        return 'allowed'
    return 'no-answer'

def main():
    print('TrapBlock Domain Safety Test')
    print('=' * 50)

    failures = []

    print('\n[SAFE — must NOT be blocked]')
    for domain, label in SAFE:
        try:
            result = check(domain)
            is_blocked = result.startswith('blocked')
            status = 'FAIL' if is_blocked else 'ok  '
            print(f'  {status}  {label} ({domain})')
            if is_blocked:
                failures.append(f'FALSE POSITIVE: {label} ({domain}) is blocked')
        except Exception as e:
            print(f'  ERR   {label} ({domain}): {e}')

    print('\n[BLOCKED — must BE blocked]')
    for domain, label in BLOCKED:
        try:
            result = check(domain)
            is_blocked = result.startswith('blocked')
            status = 'ok  ' if is_blocked else 'FAIL'
            print(f'  {status}  {label} ({domain})')
            if not is_blocked:
                failures.append(f'MISSED BLOCK: {label} ({domain}) not blocked')
        except Exception as e:
            print(f'  ERR   {label} ({domain}): {e}')

    print('\n' + '=' * 50)
    if failures:
        print(f'FAILED — {len(failures)} issue(s):')
        for f in failures:
            print(f'  • {f}')
        sys.exit(1)
    else:
        print('ALL TESTS PASSED — safe to install profile')

if __name__ == '__main__':
    main()
