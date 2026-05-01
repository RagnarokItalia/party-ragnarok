import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

function Home() {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [showPast, setShowPast] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'events'), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const now = new Date();
      setUpcomingEvents(list.filter(e => new Date(e.date) >= now));
      setPastEvents(list.filter(e => new Date(e.date) < now).reverse());

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists() && userSnap.data().isAdmin) {
        setIsAdmin(true);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const renderEvent = (event, isPast) => {
    const totalSlots = event.slots ? Object.values(event.slots).reduce((a, b) => a + b, 0) : 0;
    const totalBooked = event.participants ? event.participants.length : 0;
    const isFull = totalBooked >= totalSlots;

    return (
      <div
        key={event.id}
        onClick={() => navigate(`/event/${event.id}`)}
        style={{
          backgroundColor: '#16213e',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '15px',
          cursor: 'pointer',
          borderLeft: `5px solid ${isPast ? '#555' : isFull ? '#e74c3c' : '#2ecc71'}`,
          opacity: isPast ? 0.7 : 1
        }}
      >
        <h3>{event.name} {isPast ? '🏁' : ''}</h3>
        <p>📅 {new Date(event.date).toLocaleString('it-IT')}</p>
        <p>👥 {totalBooked}/{totalSlots} partecipanti {isPast ? '' : isFull ? '🔴 Completo' : '🟢 Aperto'}</p>
      </div>
    );
  };

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ margin: 0 }}>⚔️ PartyRagnarok</h1>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/guide')} style={btnStyle('#1abc9c')}>📖 Guida</button>
          <button onClick={() => navigate('/members')} style={btnStyle('#9b59b6')}>👥 Membri</button>
          <button onClick={() => navigate('/stats')} style={btnStyle('#e67e22')}>📊 Stats</button>
          <button onClick={() => navigate('/profile')} style={btnStyle('#4285f4')}>👤 Profilo</button>
          <button onClick={() => navigate('/create-event')} style={btnStyle('#2ecc71')}>➕ Evento</button>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} style={btnStyle('#8e44ad')}>⚙️ Admin</button>
          )}
          <button onClick={handleLogout} style={btnStyle('#e74c3c')}>🚪</button>
        </div>
      </div>

      {/* Eventi futuri */}
      <h2 style={{ marginBottom: '15px' }}>📅 Prossimi eventi</h2>
      {upcomingEvents.length === 0 && <p style={{ color: '#aaa' }}>Nessun evento in programma. Creane uno!</p>}
      {upcomingEvents.map(e => renderEvent(e, false))}

      {/* Storico eventi */}
      <div style={{ marginTop: '30px' }}>
        <button
          onClick={() => setShowPast(!showPast)}
          style={{ ...btnStyle('#555'), marginBottom: '15px' }}
        >
          {showPast ? '🔼 Nascondi storico' : '🔽 Mostra storico eventi'}
        </button>

        {showPast && (
          <>
            <h2 style={{ marginBottom: '15px' }}>🏁 Storico eventi</h2>
            {pastEvents.length === 0 && <p style={{ color: '#aaa' }}>Nessun evento passato.</p>}
            {pastEvents.map(e => renderEvent(e, true))}
          </>
        )}
      </div>
    </div>
  );
}

const btnStyle = (color) => ({
  padding: '8px 15px',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem'
});

export default Home;