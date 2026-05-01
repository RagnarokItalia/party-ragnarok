import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { JOB_ICONS } from '../constants';
const DISCORD_NOTIFICHE = process.env.REACT_APP_DISCORD_EVENTS;
const DISCORD_PROMEMORIA = 'https://discord.com/api/webhooks/1499169727409557636/5SGI8gBOovw4oOyHzaha8BxEM1YO9a6ju4PxcnvuPAq7WJwwaWnsWo1jXgiPYJtanuoa';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [event, setEvent] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState('');
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const eventSnap = await getDoc(doc(db, 'events', id));
      if (eventSnap.exists()) setEvent({ id: eventSnap.id, ...eventSnap.data() });

      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) setUserProfile(userSnap.data());

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const totalSlots = event ? Object.values(event.slots).reduce((a, b) => a + b, 0) : 0;
  const totalBooked = event ? event.participants.length : 0;
  const isFull = totalBooked >= totalSlots;
  const isCreator = event?.createdBy === user.uid;
  const isParticipant = event?.participants.some(p => p.uid === user.uid);
  const isReserve = event?.reserves.some(p => p.uid === user.uid);

  const handleJoinClick = () => {
    if (!userProfile?.charName || !userProfile?.role) {
      alert('Completa prima il tuo profilo personaggio!');
      navigate('/profile');
      return;
    }
    const jobs = userProfile.jobs || (userProfile.job ? [userProfile.job] : []);
    if (jobs.length > 1) {
      setShowJobPicker(true);
    } else {
      confirmJoin(jobs[0]);
    }
  };

  const confirmJoin = async (job) => {
    setShowJobPicker(false);
    const eventRef = doc(db, 'events', id);
    const newParticipant = {
      uid: user.uid,
      charName: userProfile.charName,
      job: job,
      role: userProfile.role
    };
    if (!isFull) {
      await updateDoc(eventRef, {
        participants: [...event.participants, newParticipant]
      });
    } else {
      await updateDoc(eventRef, {
        reserves: [...event.reserves, newParticipant]
      });
    }
    const snap = await getDoc(eventRef);
    setEvent({ id: snap.id, ...snap.data() });
  };

  const handleLeave = async () => {
  const eventRef = doc(db, 'events', id);
  const wasParticipant = event.participants.some(p => p.uid === user.uid);
  let newParticipants = event.participants.filter(p => p.uid !== user.uid);
  let newReserves = [...event.reserves];

  if (wasParticipant && newReserves.length > 0) {
    // Promuovi prima riserva
    const promoted = newReserves.shift();
    newParticipants = [...newParticipants, promoted];

    // Notifica Discord promozione
    await fetch(DISCORD_NOTIFICHE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🎉 Riserva promossa!',
          color: 0x2ecc71,
          fields: [
            { name: '📋 Evento', value: event.name, inline: true },
            { name: '⚔️ Giocatore', value: `${promoted.charName} (${promoted.job})`, inline: true },
            { name: '📢 Stato', value: 'Spostato da riserva a partecipante!', inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      })
    });
  } else if (wasParticipant && newReserves.length === 0) {
    // Posto libero, nessuna riserva
    await fetch(DISCORD_NOTIFICHE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🔔 Posto libero!',
          color: 0xf39c12,
          fields: [
            { name: '📋 Evento', value: event.name, inline: true },
            { name: '📅 Data', value: new Date(event.date).toLocaleString('it-IT'), inline: true },
            { name: '📢 Stato', value: 'Si è liberato un posto! Accedi per prenotarti.', inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      })
    });
  }

  await updateDoc(eventRef, {
    participants: newParticipants,
    reserves: newReserves
  });

  const snap = await getDoc(eventRef);
  setEvent({ id: snap.id, ...snap.data() });
};

  const handleDelete = async () => {
    if (window.confirm('Sei sicuro di voler eliminare questo evento?')) {
      await deleteDoc(doc(db, 'events', id));
      navigate('/');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    const eventRef = doc(db, 'events', id);
    const newComment = {
      uid: user.uid,
      charName: userProfile?.charName || user.displayName,
      text: comment,
      createdAt: new Date().toISOString()
    };
    const updatedComments = [...(event.comments || []), newComment];
    await updateDoc(eventRef, { comments: updatedComments });
    const snap = await getDoc(eventRef);
    setEvent({ id: snap.id, ...snap.data() });
    setComment('');
  };

  if (loading) return <div style={{ color: 'white', padding: '20px' }}>Caricamento...</div>;
  if (!event) return <div style={{ color: 'white', padding: '20px' }}>Evento non trovato.</div>;

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={btnStyle('#555')}>← Home</button>

      {/* Pulsanti creatore */}
      {isCreator && (
        <div style={{ float: 'right' }}>
          <button onClick={() => navigate(`/edit-event/${id}`)} style={btnStyle('#f39c12')}>✏️ Modifica</button>
          <button onClick={handleDelete} style={{ ...btnStyle('#e74c3c'), marginLeft: '10px' }}>🗑️ Elimina</button>
        </div>
      )}

      <h2 style={{ marginTop: '20px' }}>{event.name}</h2>
      <p>📅 {new Date(event.date).toLocaleString('it-IT')}</p>
      <p>👥 {totalBooked}/{totalSlots} partecipanti {isFull ? '🔴 Completo' : '🟢 Aperto'}</p>

      <h3 style={{ marginTop: '20px' }}>Posti per ruolo</h3>
      {['DPS', 'Support', 'Tank'].map(role => {
        const booked = event.participants.filter(p => p.role === role).length;
        return <p key={role}>{role}: {booked}/{event.slots[role]}</p>;
      })}

      <h3 style={{ marginTop: '20px' }}>👥 Partecipanti</h3>
      {event.participants.length === 0 && <p style={{ color: '#aaa' }}>Nessuno ancora.</p>}
      {event.participants.map((p, i) => (
        <div key={i} style={cardStyle}>
          {JOB_ICONS[p.job] || '⚔️'} {p.charName} — {p.job} ({p.role})
        </div>
      ))}

      <h3 style={{ marginTop: '20px' }}>🔄 Riserve</h3>
      {event.reserves.length === 0 && <p style={{ color: '#aaa' }}>Nessuna riserva.</p>}
      {event.reserves.map((p, i) => (
        <div key={i} style={{ ...cardStyle, borderLeft: '4px solid #f39c12' }}>
          ⏳ {JOB_ICONS[p.job] || '⚔️'} {p.charName} — {p.job} ({p.role})
        </div>
      ))}

      {/* Azioni partecipazione */}
      <div style={{ marginTop: '20px' }}>
        {!isParticipant && !isReserve && (
          <button onClick={handleJoinClick} style={btnStyle(isFull ? '#f39c12' : '#2ecc71')}>
            {isFull ? '⏳ Iscriviti come riserva' : '✅ Partecipa'}
          </button>
        )}
        {isParticipant && <p style={{ color: '#2ecc71' }}>✅ Sei iscritto a questo evento!</p>}
        {isReserve && <p style={{ color: '#f39c12' }}>⏳ Sei in lista riserve!</p>}
        {(isParticipant || isReserve) && (
          <button onClick={handleLeave} style={{ ...btnStyle('#e74c3c'), marginTop: '10px' }}>
            ❌ Annulla iscrizione
          </button>
        )}
      </div>

      {/* Commenti */}
      <h3 style={{ marginTop: '30px' }}>💬 Commenti</h3>
      {(event.comments || []).length === 0 && <p style={{ color: '#aaa' }}>Nessun commento.</p>}
      {(event.comments || []).map((c, i) => (
        <div key={i} style={{ ...cardStyle, borderLeft: '4px solid #4285f4' }}>
          <strong>{c.charName}</strong>
          <span style={{ color: '#aaa', fontSize: '0.8rem', marginLeft: '10px' }}>
            {new Date(c.createdAt).toLocaleString('it-IT')}
          </span>
          <p style={{ margin: '5px 0 0 0' }}>{c.text}</p>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Scrivi un commento..."
          style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
          onKeyDown={e => e.key === 'Enter' && handleComment()}
        />
        <button onClick={handleComment} style={btnStyle('#4285f4')}>Invia</button>
      </div>

      {/* Popup selezione job */}
      {showJobPicker && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#16213e', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ marginBottom: '20px' }}>Con quale job vuoi partecipare?</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {(userProfile.jobs || [userProfile.job]).map(job => (
                <div
                  key={job}
                  onClick={() => confirmJoin(job)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: selectedJob === job ? '#4285f4' : '#0f3460',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    border: '2px solid #4285f4',
                    fontSize: '1rem'
                  }}
                >
                  {JOB_ICONS[job] || '⚔️'} {job}
                </div>
              ))}
            </div>
            <button onClick={() => setShowJobPicker(false)} style={{ ...btnStyle('#555'), marginTop: '20px' }}>
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#16213e',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '10px',
  borderLeft: '4px solid #2ecc71'
};

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

export default EventDetail;