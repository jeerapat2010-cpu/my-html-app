"""ดึงยอดผู้เข้าชมจาก Google Analytics 4 แล้วเขียนเป็น stats.json (ให้หน้า room.html อ่านไปแสดงที่เคาน์เตอร์)"""
import os, json, datetime
from google.oauth2 import service_account
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (RunReportRequest, DateRange, Metric,
    FilterExpression, Filter)

PROP = os.environ.get('GA_PROPERTY_ID', '557339187')
creds = service_account.Credentials.from_service_account_info(json.loads(os.environ['GA_SA_KEY']),
    scopes=['https://www.googleapis.com/auth/analytics.readonly'])
client = BetaAnalyticsDataClient(credentials=creds)
rng = [DateRange(start_date='2020-01-01', end_date='today')]

def run(room=False):
    req = RunReportRequest(property=f'properties/{PROP}', date_ranges=rng,
        metrics=[Metric(name='totalUsers'), Metric(name='sessions'), Metric(name='screenPageViews')])
    if room:
        req.dimension_filter = FilterExpression(filter=Filter(field_name='pagePath',
            string_filter=Filter.StringFilter(match_type=Filter.StringFilter.MatchType.CONTAINS, value='room')))
    rows = client.run_report(req).rows
    return [int(m.value) for m in rows[0].metric_values] if rows else [0, 0, 0]

site, room = run(False), run(True)
out = {'users': site[0], 'sessions': site[1], 'views': site[2],
       'room_users': room[0], 'room_sessions': room[1], 'room_views': room[2],
       'updated': datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')}
json.dump(out, open('stats.json', 'w'), ensure_ascii=False, indent=1)
print(out)
