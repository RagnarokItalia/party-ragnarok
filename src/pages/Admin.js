import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

function Admin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [day, setDay] = useState('Lunedì');
  const [time, setTime] = useState('20:55');
  const [channel, setChannel] = useState('');
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const checkAdmin = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists() && snap.data().isAdmin) {
        setIsAdmin(true);
        fetchEvents();
      }
      setLoading(false);
    };
    checkAdmin();
  }, [user]);

  const fetchEvents = async () => {
    const snap = await getDocs(collection(db, 'recurringEvents'));
    setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleSave = async () => {
    if (!name || !time || !channel) {
      alert('Compila tutti i campi!');
      return;
    }
    if (editing) {
      await updateDoc(doc(db, 'recurringEvents', editing), { name, day, time, channel });
    } else {
      await addDoc(collection(db, 'recurringEvents'), { name, day, time, channel, active: true });
    }
    setShowForm(false);
    setEditing(null);
    setName(''); setDay('Lunedì'); setTime('20:55'); setChannel('');
    fetchEvents();
  };

  const handleEdit = (event) => {
    setEditing(event.id);
    setName(event.name);
    setDay(event.day);
    setTime(event.time);
    setChannel(event.channel);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Eliminare questo evento ricorrente?')) {
      await deleteDoc(doc(db, 'recurringEvents', id));
      fetchEvents();
    }
  };

  const handleToggle = async (event) => {
    await updateDoc(doc(db, 'recurringEvents', event.id), { active: !event.active });
    fetchEvents();
  };

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Caricamento...</div>;
  if (!isAdmin) return <div style={{ color: 'white', padding: '20px' }}>⛔ Accesso negato.</div>;

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={btnStyle('#555')}>← Home</button>
      <h2 style={{ marginTop: '20px' }}>⚙️ Pannello Admin</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>Gestisci gli eventi ricorrenti del gioco</p>

      <button onClick={() => { setShowForm(true); setEditing(null); setName(''); setDay('Lunedì'); setTime('20:55'); setChannel(''); }}
        style={btnStyle('#2ecc71')}>➕ Aggiungi evento ricorrente</button>

      {showForm && (
        <div style={{ backgroundColor: '#16213e', borderRadius: '10px', padding: '20px', margin: '20px 0' }}>
          <h3>{editing ? '✏️ Modifica evento' : '➕ Nuovo evento ricorrente'}</h3>

          <label>Nome evento</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Es. WoE" style={inputStyle} />

          <label>Giorno della settimana</label>
          <select value={day} onChange={e => setDay(e.target.value)} style={inputStyle}>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <label>Orario</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />

          <label>Webhook Discord (canale notifiche)</label>
          <input value={channel} onChange={e => setChannel(e.target.value)} placeholder="https://discord.com/api/webhooks/..." style={inputStyle} />

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={handleSave} style={btnStyle('#2ecc71')}>💾 Salva</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} style={btnStyle('#555')}>Annulla</button>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: '30px' }}>📋 Eventi ricorrenti</h3>
      {events.length === 0 && <p style={{ color: '#aaa' }}>Nessun evento ricorrente.</p>}
      {events.map(event => (
        <div key={event.id} style={{
          backgroundColor: '#16213e',
          borderRadius: '10px',
          padding: '15px 20px',
          marginBottom: '12px',
          borderLeft: `5px solid ${event.active ? '#2ecc71' : '#555'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>{event.name}</h3>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>📅 {event.day} alle {event.time}</p>
              <p style={{ margin: '3px 0 0 0', color: event.active ? '#2ecc71' : '#aaa', fontSize: '0.85rem' }}>
                {event.active ? '🟢 Attivo' : '🔴 Disattivato'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => handleToggle(event)} style={btnStyle(event.active ? '#e67e22' : '#2ecc71')}>
                {event.active ? '⏸ Disattiva' : '▶️ Attiva'}
              </button>
              <button onClick={() => handleEdit(event)} style={btnStyle('#4285f4')}>✏️ Modifica</button>
              <button onClick={() => handleDelete(event.id)} style={btnStyle('#e74c3c')}>🗑️ Elimina</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const inputStyle = {
  display: 'block', width: '100%', padding: '10px',
  marginTop: '5px', marginBottom: '15px', borderRadius: '6px',
  border: 'none', backgroundColor: '#0f3460', color: 'white', fontSize: '1rem'
};

const btnStyle = (color) => ({
  padding: '8px 15px', backgroundColor: color, color: 'white',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
});

export default Admin;