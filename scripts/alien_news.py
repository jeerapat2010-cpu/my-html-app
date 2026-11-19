#!/usr/bin/env python3
"""ดึงหัวข้อข่าวอวกาศ/UAP/SETI จาก RSS ทางการ → data/alien_news.json (เฉพาะหัวข้อ + ลิงก์ต้นทาง ไม่คัดลอกเนื้อหา)"""
import json, re, time, urllib.request, datetime, os, email.utils
import xml.etree.ElementTree as ET
os.makedirs('data', exist_ok=True)
FEEDS = [('NASA', 'https://www.nasa.gov/feed/'), ('SETI Institute', 'https://www.seti.org/feed/'),
         ('Phys.org', 'https://phys.org/rss-feed/space-news/astronomy/'), ('ESA', 'https://www.esa.int/rssfeed/Our_Activities/Space_Science'),
         ('Sky at Night', 'https://www.skyatnightmagazine.com/feed/')]
KW = re.compile(r'\b(alien|extraterrestrial|UAP|UFO|SETI|technosignature|biosignature|habitable|exoplanet|life on mars|search for life|interstellar|3I/ATLAS|astrobiolog|Europa|Enceladus|Perseverance)\b', re.I)
items, log = [], []
def status(m): open('data/alien_news_status.txt', 'w').write(datetime.datetime.utcnow().isoformat() + 'Z ' + m + '\n')
for name, url in FEEDS:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 AlienDefense-bot'})
        root = ET.fromstring(urllib.request.urlopen(req, timeout=30).read())
        n = 0
        for it in root.iter('item'):
            t = (it.findtext('title') or '').strip(); u = (it.findtext('link') or '').strip()
            if not t or not u.startswith('http') or not KW.search(t): continue
            try: d = email.utils.parsedate_to_datetime(it.findtext('pubDate')).date().isoformat()
            except Exception: d = ''
            items.append({'t': t[:160], 'u': u, 's': name, 'd': d}); n += 1
        log.append(f'{name}:{n}')
    except Exception as e:
        log.append(f'{name}:ERR {repr(e)[:60]}'); time.sleep(1)
items.sort(key=lambda x: x['d'], reverse=True)
seen, out = set(), []
for x in items:
    if x['u'] in seen: continue
    seen.add(x['u']); out.append(x)
status(' '.join(log) + f' total={len(out)}')
if out:
    json.dump({'updated': datetime.datetime.utcnow().isoformat() + 'Z', 'items': out[:24]}, open('data/alien_news.json', 'w'), ensure_ascii=False, indent=1)
