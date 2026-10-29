#!/usr/bin/env python3
"""ดึงรายการแผ่นดินไหวจากกรมอุตุนิยมวิทยา (TMD DailySeismicEvent) → data/tmdquake.json
รันบน GitHub Actions เพราะเบราว์เซอร์ดึงตรงไม่ได้ (CORS)"""
import json, sys, time, urllib.request, urllib.error, datetime, os, ssl
os.makedirs('data', exist_ok=True)
URL = 'https://data.tmd.go.th/api/DailySeismicEvent/v1/?uid=api&ukey=api12345&format=json'
errs = []
def status(m): open('data/tmdquake_status.txt', 'w').write(datetime.datetime.utcnow().isoformat() + 'Z ' + m + '\n')
raw = None
for ctx in (None, ssl._create_unverified_context()):
    for _ in range(2):
        try:
            req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0 AreaReady-bot'})
            raw = json.load(urllib.request.urlopen(req, timeout=40, context=ctx)); break
        except Exception as e:
            errs.append(repr(e)[:110]); time.sleep(3)
    if raw: break
ev = None
if isinstance(raw, dict):
    ev = raw.get('DailyEarthquakes') or raw.get('DailySeismicEvent') or raw.get('Earthquakes')
    if ev is None:
        for v in raw.values():
            if isinstance(v, list): ev = v; break
if not isinstance(ev, list):
    status('no data: ' + ' | '.join(errs) + ' keys=' + (str(list(raw)[:5]) if isinstance(raw, dict) else str(type(raw)))); sys.exit(0)
now = time.time(); out = []
for e in ev:
    try:
        t = datetime.datetime.strptime(e['DateTimeUTC'][:19], '%Y-%m-%d %H:%M:%S').replace(tzinfo=datetime.timezone.utc).timestamp()
        m = float(e['Magnitude']); la = float(e['Latitude']); lo = float(e['Longitude'])
    except Exception:
        continue
    if now - t > 72 * 3600 or not (0 <= la <= 25 and 90 <= lo <= 112): continue
    try: dp = float(e.get('Depth'))
    except Exception: dp = 10
    out.append({'t': int(t * 1000), 'o': str(e.get('OriginThai') or e.get('TitleThai') or '')[:80], 'm': m, 'dp': dp, 'lat': la, 'lon': lo})
out.sort(key=lambda x: -x['t']); out = out[:80]
json.dump({'fetched': datetime.datetime.utcnow().isoformat() + 'Z', 'owner': 'กรมอุตุนิยมวิทยา (TMD)', 'events': out},
          open('data/tmdquake.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
status('ok %d events (of %d)' % (len(out), len(ev)))
