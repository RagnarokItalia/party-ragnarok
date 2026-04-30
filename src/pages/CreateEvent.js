import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1499166410025472151/sPmC241qIY4V5_vLAYPCoPeIcyN9MFIOQbbFnOq9uNnsLhL024KSpKjUgKb-enDbE85S';

function CreateEvent() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState({ DPS: 3, Support: 1, Tank: 1 });
  const navigate = useNavigate();
  const user = auth.currentUser;

  const sendDiscordNotification = async (eventName, eventDate, slots) => {
    const totalSlots = Object.values(slots).reduce((a, b) => a + b, 0);
    const formattedDate = new Date(eventDate).toLocaleString('it-IT');

    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🗡️ Nuovo Party creato!',
          color: 0x2ecc71,
          fields: [
            { name: '📋 Party', value: eventName, inline: true },
            { name: '📅 Data', value: formattedDate, inline: true },
            { name: '👥 Posti totali', value: `${totalSlots}`, inline: true },
            { name: '🗡️ DPS', value: `${slots.DPS} posti`, inline: true },
            { name: '✝️ Support', value: `${slots.Support} posti`, inline: true },
            { name: '🛡️ Tank', value: `${slots.Tank} posti`, inline: true },
          ],
          footer: { text: 'Accedi su PartyRagnarok per prenotarti!' },
          timestamp: new Date().toISOString()
        }]
      })
    });
  };

  const handleCreate = async () => {
    if (!name || !date) {
      alert('Inserisci nome e data evento!');
      return;
    }

    const docRef = await addDoc(collection(db, 'events'), {
      name,
      date: new Date(date).toISOString(),
      slots,
      participants: [],
      reserves: [],
      comments: [],
      createdBy: user.uid,
      createdAt: new Date().toISOString()
    });

    await sendDiscordNotification(name, date, slots);
    navigate('/');
  };

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={btnStyle('#555')}>← Torna alla Home</button>
      <h2 style={{ marginTop: '20px' }}>➕ Crea nuovo evento</h2>

      <div style={{ maxWidth: '400px', marginTop: '30px' }}>
        <label>Nome evento</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Es. Endless Tower"
          style={inputStyle}
        />

        <label>Data e ora</label>
        <input
          type="datetime-local"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={inputStyle}
        />

        <h3 style={{ marginBottom: '10px' }}>Posti per ruolo</h3>
        {['DPS', 'Support', 'Tank'].map(role => (
          <div key={role} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <label style={{ width: '100px' }}>{role}</label>
            <button onClick={() => setSlots(s => ({ ...s, [role]: Math.max(0, s[role] - 1) }))} style={smallBtn}>−</button>
            <span style={{ margin: '0 15px', fontSize: '1.2rem' }}>{slots[role]}</span>
            <button onClick={() => setSlots(s => ({ ...s, [role]: s[role] + 1 }))} style={smallBtn}>+</button>
          </div>
        ))}

        <button onClick={handleCreate} style={btnStyle('#2ecc71')}>
          ✅ Crea evento
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px',
  marginTop: '5px',
  marginBottom: '20px',
  borderRadius: '6px',
  border: 'none',
  backgroundColor: '#16213e',
  color: 'white',
  fontSize: '1rem'
};

const btnStyle = (color) => ({
  padding: '10px 20px',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1rem'
});

const smallBtn = {
  padding: '5px 12px',
  backgroundColor: '#16213e',
  color: 'white',
  border: '1px solid #444',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1.1rem'
};

export default CreateEvent;