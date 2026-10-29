#!/usr/bin/env python3
"""ดึง PM2.5 วัดจริงจาก Air4Thai (กรมควบคุมมลพิษ) เก็บเป็น data/air4thai.json
รันบน GitHub Actions เพราะเว็บแอปดึงตรงจากเบราว์เซอร์ไม่ได้ (ติด CORS)"""
import json, sys, time, urllib.request, datetime, os
os.makedirs('data', exist_ok=True)
errs = []
def status(m): open('data/air4thai_status.txt','w').write(datetime.datetime.utcnow().isoformat()+'Z '+m+'\n')
URLS = ['https://air4thai.pcd.go.th/services/getNewAQI_JSON.php',
        'http://air4thai.pcd.go.th/services/getNewAQI_JSON.php']
raw = None
for u in URLS:
    for _ in range(2):
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 AreaReady-bot'})
            raw = json.load(urllib.request.urlopen(req, timeout=40)); break
        except Exception as e:
            errs.append(u+' '+repr(e)[:150]); time.sleep(3)
    if raw: break
if not raw or not isinstance(raw.get('stations'), list):
    status('no data: '+' | '.join(errs)); sys.exit(0)
out = []
for s in raw['stations']:
    try:
        a = s['AQILast']; p = a['PM25']; v = float(p['value'])
        lat, lon = float(s['lat']), float(s['long'])
    except Exception:
        continue
    if v < 0 or not (-90 <= lat <= 90 and -180 <= lon <= 180): continue
    try: aqi = float(p.get('aqi'))
    except Exception: aqi = -1
    out.append({'id': s.get('stationID'), 'n': s.get('nameTH'), 'a': s.get('areaTH'),
                'lat': lat, 'lon': lon, 'date': a.get('date'), 'time': a.get('time'),
                'pm25': v, 'aqi': aqi if aqi >= 0 else None})
if len(out) < 5:
    status('too few stations: %d'%len(out)); sys.exit(0)
json.dump({'fetched': datetime.datetime.utcnow().isoformat() + 'Z', 'owner': 'กรมควบคุมมลพิษ (Air4Thai)',
           'stations': out}, open('data/air4thai.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
status('ok %d stations'%len(out))
