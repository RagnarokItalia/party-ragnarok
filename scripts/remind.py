import urllib.request
import urllib.error
import json
import os
from datetime import datetime, timezone

FIREBASE_PROJECT_ID = os.environ['FIREBASE_PROJECT_ID']
FIREBASE_API_KEY = os.environ['FIREBASE_API_KEY']
DISCORD_PROMEMORIA = os.environ['DISCORD_PROMEMORIA']

def get_events():
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/events?key={FIREBASE_API_KEY}"
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
    return data.get('documents', [])

def send_discord(message, color, fields):
    payload = json.dumps({
        "embeds": [{
            "title": message,
            "color": color,
            "fields": fields,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }]
    }).encode('utf-8')

    req = urllib.request.Request(
        DISCORD_PROMEMORIA,
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    urllib.request.urlopen(req)

def main():
    events = get_events()
    now = datetime.now(timezone.utc)

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

        participants_array = fields_data.get('participants', {}).get('arrayValue', {}).get('values', [])
        num_participants = len(participants_array)

        fields = [
            {"name": "📋 Evento", "value": name, "inline": True},
            {"name": "📅 Data", "value": event_date.strftime('%d/%m/%Y %H:%M'), "inline": True},
            {"name": "👥 Partecipanti", "value": str(num_participants), "inline": True}
        ]

        doc_id = event['name'].split('/')[-1]
        update_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/events/{doc_id}?key={FIREBASE_API_KEY}"

        if 25 <= diff_minutes <= 35 and not reminded_30:
            send_discord("⏰ Promemoria — 30 minuti all'evento!", 0xf39c12, fields)
            patch_data = json.dumps({"fields": {**fields_data, "reminded30": {"booleanValue": True}}}).encode()
            req = urllib.request.Request(update_url + "&updateMask.fieldPaths=reminded30", data=patch_data, headers={'Content-Type': 'application/json'}, method='PATCH')
            urllib.request.urlopen(req)

        elif 5 <= diff_minutes <= 15 and not reminded_10:
            send_discord("🚨 Evento tra 10 minuti! Preparatevi!", 0xe74c3c, fields)
            patch_data = json.dumps({"fields": {**fields_data, "reminded10": {"booleanValue": True}}}).encode()
            req = urllib.request.Request(update_url + "&updateMask.fieldPaths=reminded10", data=patch_data, headers={'Content-Type': 'application/json'}, method='PATCH')
            urllib.request.urlopen(req)

        elif 0 <= diff_minutes <= 5 and not reminded_1:
            send_discord("🔴 L'evento sta per iniziare! Entrate subito!", 0xe74c3c, fields)
            patch_data = json.dumps({"fields": {**fields_data, "reminded1": {"booleanValue": True}}}).encode()
            req = urllib.request.Request(update_url + "&updateMask.fieldPaths=reminded1", data=patch_data, headers={'Content-Type': 'application/json'}, method='PATCH')
            urllib.request.urlopen(req)

if __name__ == '__main__':
    main()