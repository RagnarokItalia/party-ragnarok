import urllib.request
import urllib.error
import json
import os
from datetime import datetime, timezone, timedelta

FIREBASE_PROJECT_ID = os.environ['FIREBASE_PROJECT_ID']
FIREBASE_API_KEY = os.environ['FIREBASE_API_KEY']
DISCORD_PROMEMORIA = os.environ['DISCORD_PROMEMORIA']

DAYS_MAP = {
    'Lunedì': 0, 'Martedì': 1, 'Mercoledì': 2, 'Giovedì': 3,
    'Venerdì': 4, 'Sabato': 5, 'Domenica': 6
}

def get_documents(collection):
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection}?key={FIREBASE_API_KEY}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
    return data.get('documents', [])

def send_discord(webhook, message, color, fields):
    print(f"Invio a: {webhook[:50]}...")
    payload = json.dumps({
        "embeds": [{
            "title": message,
            "color": color,
            "fields": fields,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    }).encode('utf-8')

    req = urllib.request.Request(
        webhook,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0'
        },
        method='POST'
    )
    urllib.request.urlopen(req)

def patch_field(doc_id, collection, fields_data, field_name):
    update_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection}/{doc_id}?key={FIREBASE_API_KEY}"
    patch_data = json.dumps({"fields": {**fields_data, field_name: {"booleanValue": True}}}).encode()
    req = urllib.request.Request(
        update_url + f"&updateMask.fieldPaths={field_name}",
        data=patch_data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'},
        method='PATCH'
    )
    urllib.request.urlopen(req)

def check_party_events(now):
    events = get_documents('events')
    print(f"Trovati {len(events)} party events")

    for event in events:
        fields_data = event.get('fields', {})
        name = fields_data.get('name', {}).get('stringValue', 'Evento sconosciuto')
        date_str = fields_data.get('date', {}).get('stringValue', '')
        reminded_30 = fields_data.get('reminded30', {}).get('booleanValue', False)
        reminded_10 = fields_data.get('reminded10', {}).get('booleanValue', False)
        reminded_1 = fields_data.get('reminded1', {}).get('booleanValue', False)

        if not date_str:
            continue

        event_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        diff_minutes = (event_date - now).total_seconds() / 60
        print(f"Party: {name} - diff_minutes: {diff_minutes:.1f}")

        doc_id = event['name'].split('/')[-1]
        participants_array = fields_data.get('participants', {}).get('arrayValue', {}).get('values', [])
        num_participants = len(participants_array)

        fields = [
            {"name": "📋 Raid", "value": name, "inline": True},
            {"name": "📅 Data", "value": (event_date + timedelta(hours=2)).strftime('%d/%m/%Y %H:%M'), "inline": True},
            {"name": "👥 Partecipanti", "value": str(num_participants), "inline": True}
        ]

        if 25 <= diff_minutes <= 35 and not reminded_30:
            send_discord(DISCORD_PROMEMORIA, "⏰ Promemoria — 30 minuti al Raid!", 0xf39c12, fields)
            patch_field(doc_id, 'events', fields_data, 'reminded30')

        elif 5 <= diff_minutes <= 15 and not reminded_10:
            send_discord(DISCORD_PROMEMORIA, "🚨 Raid tra 10 minuti! Preparatevi!", 0xe74c3c, fields)
            patch_field(doc_id, 'events', fields_data, 'reminded10')

        elif 0 <= diff_minutes <= 5 and not reminded_1:
            send_discord(DISCORD_PROMEMORIA, "🔴 Il Raid sta per iniziare! Entrate subito!", 0xe74c3c, fields)
            patch_field(doc_id, 'events', fields_data, 'reminded1')

def check_recurring_events(now):
    events = get_documents('recurringEvents')
    print(f"Trovati {len(events)} eventi ricorrenti")

    current_day = now.weekday()
    current_time_it = now + timedelta(hours=2)
    current_hour = current_time_it.hour
    current_minute = current_time_it.minute

    for event in events:
        fields_data = event.get('fields', {})
        name = fields_data.get('name', {}).get('stringValue', '')
        day = fields_data.get('day', {}).get('stringValue', '')
        time_str = fields_data.get('time', {}).get('stringValue', '')
        active = fields_data.get('active', {}).get('booleanValue', True)
        channel = fields_data.get('channel', {}).get('stringValue', '')

        if not active or not time_str or not channel:
            continue

        event_day = DAYS_MAP.get(day, -1)
        if event_day != current_day:
            continue

        event_hour, event_minute = map(int, time_str.split(':'))
        event_total_minutes = event_hour * 60 + event_minute
        current_total_minutes = current_hour * 60 + current_minute
        diff = event_total_minutes - current_total_minutes

        print(f"Evento ricorrente: {name} - {day} {time_str} - diff: {diff} min")

        fields = [
            {"name": "🎮 Evento", "value": name, "inline": True},
            {"name": "⏰ Orario", "value": time_str, "inline": True},
        ]

        if 25 <= diff <= 35:
            send_discord(channel, f"⏰ {name} tra 30 minuti!", 0xf39c12, fields)
        elif 5 <= diff <= 15:
            send_discord(channel, f"🚨 {name} tra 10 minuti! Preparatevi!", 0xe74c3c, fields)
        elif 0 <= diff <= 5:
            send_discord(channel, f"🔴 {name} sta per iniziare! Entrate subito!", 0xe74c3c, fields)

def main():
    now = datetime.now(timezone.utc)
    print(f"Ora UTC: {now}")
    check_party_events(now)
    check_recurring_events(now)

if __name__ == '__main__':
    main()