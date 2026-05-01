import urllib.request
import urllib.error
import json
import os
from datetime import datetime, timezone, timedelta

FIREBASE_PROJECT_ID = os.environ['FIREBASE_PROJECT_ID']
FIREBASE_API_KEY = os.environ['FIREBASE_API_KEY']
DISCORD_PROMEMORIA = os.environ['DISCORD_PROMEMORIA']
DISCORD_EVENTS = os.environ['DISCORD_EVENTS']

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

def send_discord(webhook, message, color, fields, footer=None):
    print(f"Invio a: {webhook[:50]}...")
    embed = {
        "title": message,
        "color": color,
        "fields": fields,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    if footer:
        embed["footer"] = {"text": footer}

    payload = json.dumps({"embeds": [embed]}).encode('utf-8')
    req = urllib.request.Request(
        webhook,
        data=payload,
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'},
        method='POST'
    )
    urllib.request.urlopen(req)

def patch_document(doc_id, collection, field_name, value, value_type='boolean'):
    update_url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT_ID}/databases/(default)/documents/{collection}/{doc_id}?key={FIREBASE_API_KEY}&updateMask.fieldPaths={field_name}"
    if value_type == 'boolean':
        field_value = {"booleanValue": value}
    else:
        field_value = {"stringValue": value}
    patch_data = json.dumps({"fields": {field_name: field_value}}).encode()
    req = urllib.request.Request(
        update_url,
        data=patch_data,
        headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'},
        method='PATCH'
    )
    urllib.request.urlopen(req)

def check_new_events():
    """Manda notifica su #eventparty per eventi appena creati"""
    events = get_documents('events')
    print(f"Controllo nuovi eventi: {len(events)}")

    for event in events:
        fields_data = event.get('fields', {})
        notified = fields_data.get('notified', {}).get('booleanValue', False)
        if notified:
            continue

        name = fields_data.get('name', {}).get('stringValue', '')
        date_str = fields_data.get('date', {}).get('stringValue', '')
        slots = fields_data.get('slots', {}).get('mapValue', {}).get('fields', {})
        dps = int(slots.get('DPS', {}).get('integerValue', 0))
        support = int(slots.get('Support', {}).get('integerValue', 0))
        tank = int(slots.get('Tank', {}).get('integerValue', 0))
        total = dps + support + tank

        if not date_str:
            continue

        event_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        formatted_date = (event_date + timedelta(hours=2)).strftime('%d/%m/%Y %H:%M')

        doc_id = event['name'].split('/')[-1]

        fields = [
            {"name": "📋 Party", "value": name, "inline": True},
            {"name": "📅 Data", "value": formatted_date, "inline": True},
            {"name": "👥 Posti totali", "value": str(total), "inline": True},
            {"name": "🗡️ DPS", "value": f"{dps} posti", "inline": True},
            {"name": "✝️ Support", "value": f"{support} posti", "inline": True},
            {"name": "🛡️ Tank", "value": f"{tank} posti", "inline": True},
        ]

        send_discord(DISCORD_EVENTS, "🗡️ Nuovo Party creato!", 0x2ecc71, fields, "Accedi su PartyRagnarok per prenotarti!")
        patch_document(doc_id, 'events', 'notified', True)
        print(f"Notificato nuovo evento: {name}")

def check_notification_queue():
    """Manda notifiche dalla coda (posti liberi, promozioni riserve)"""
    try:
        docs = get_documents('notificationQueue')
    except:
        print("Nessuna coda notifiche")
        return

    for doc in docs:
        fields_data = doc.get('fields', {})
        sent = fields_data.get('sent', {}).get('booleanValue', False)
        if sent:
            continue

        message = fields_data.get('message', {}).get('stringValue', '')
        event_name = fields_data.get('eventName', {}).get('stringValue', '')
        event_date = fields_data.get('eventDate', {}).get('stringValue', '')
        color_str = fields_data.get('color', {}).get('stringValue', 'green')
        doc_id = doc['name'].split('/')[-1]

        color = 0x2ecc71 if color_str == 'green' else 0xf39c12

        fields = [
            {"name": "📋 Party", "value": event_name, "inline": True},
            {"name": "📅 Data", "value": event_date, "inline": True},
        ]

        send_discord(DISCORD_EVENTS, message, color, fields)
        patch_document(doc_id, 'notificationQueue', 'sent', True)
        print(f"Notifica inviata: {message}")

def check_party_reminders(now):
    """Manda promemoria 30/10/1 minuto per party organizzati"""
    events = get_documents('events')
    print(f"Controllo promemoria party: {len(events)}")

    for event in events:
        fields_data = event.get('fields', {})
        name = fields_data.get('name', {}).get('stringValue', '')
        date_str = fields_data.get('date', {}).get('stringValue', '')
        reminded_30 = fields_data.get('reminded30', {}).get('booleanValue', False)
        reminded_10 = fields_data.get('reminded10', {}).get('booleanValue', False)
        reminded_1 = fields_data.get('reminded1', {}).get('booleanValue', False)

        if not date_str:
            continue

        event_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        diff_minutes = (event_date - now).total_seconds() / 60
        print(f"Party: {name} - diff: {diff_minutes:.1f} min")

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
            patch_document(doc_id, 'events', 'reminded30', True)

        elif 5 <= diff_minutes <= 15 and not reminded_10:
            send_discord(DISCORD_PROMEMORIA, "🚨 Raid tra 10 minuti! Preparatevi!", 0xe74c3c, fields)
            patch_document(doc_id, 'events', 'reminded10', True)

        elif 0 <= diff_minutes <= 5 and not reminded_1:
            send_discord(DISCORD_PROMEMORIA, "🔴 Il Raid sta per iniziare! Entrate subito!", 0xe74c3c, fields)
            patch_document(doc_id, 'events', 'reminded1', True)

def check_recurring_events(now):
    """Manda promemoria per eventi ricorrenti configurati dall'admin"""
    events = get_documents('recurringEvents')
    print(f"Controllo eventi ricorrenti: {len(events)}")

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
        event_total = event_hour * 60 + event_minute
        current_total = current_hour * 60 + current_minute
        diff = event_total - current_total

        print(f"Evento ricorrente: {name} - diff: {diff} min")

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
    check_new_events()
    check_notification_queue()
    check_party_reminders(now)
    check_recurring_events(now)

if __name__ == '__main__':
    main()