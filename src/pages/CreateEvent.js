import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

function CreateEvent() {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState({ DPS: 3, Support: 1, Tank: 1 });
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleCreate = async () => {
    if (!name || !date) {
      alert('Inserisci nome e data evento!');
      return;
    }

    await addDoc(collection(db, 'events'), {
      name,
      date: new Date(date).toISOString(),
      slots,
      participants: [],
      reserves: [],
      comments: [],
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      notified: false
    });

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