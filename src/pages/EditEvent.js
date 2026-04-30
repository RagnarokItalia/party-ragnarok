import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState({ DPS: 3, Support: 1, Tank: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      const snap = await getDoc(doc(db, 'events', id));
      if (snap.exists()) {
        const data = snap.data();
        if (data.createdBy !== user.uid) {
          alert('Non sei autorizzato a modificare questo evento!');
          navigate('/');
          return;
        }
        setName(data.name);
        setDate(new Date(data.date).toISOString().slice(0, 16));
        setSlots(data.slots);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id, user, navigate]);

  const handleSave = async () => {
    if (!name || !date) {
      alert('Inserisci nome e data evento!');
      return;
    }
    await updateDoc(doc(db, 'events', id), {
      name,
      date: new Date(date).toISOString(),
      slots
    });
    navigate(`/event/${id}`);
  };

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Caricamento...</div>;

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate(`/event/${id}`)} style={btnStyle('#555')}>← Torna all'evento</button>
      <h2 style={{ marginTop: '20px' }}>✏️ Modifica evento</h2>

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

        <button onClick={handleSave} style={btnStyle('#2ecc71')}>
          💾 Salva modifiche
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

export default EditEvent;