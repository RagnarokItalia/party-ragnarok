import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { JOB_ICONS } from '../constants';

function Stats() {
  const [stats, setStats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const eventsSnap = await getDocs(collection(db, 'events'));
      const events = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const statsMap = {};

      events.forEach(event => {
        const isPast = new Date(event.date) < new Date();
        (event.participants || []).forEach(p => {
          if (!statsMap[p.uid]) {
            const user = users.find(u => u.uid === p.uid);
            statsMap[p.uid] = {
              charName: p.charName,
              job: p.job,
              jobs: user?.jobs || [p.job],
              role: p.role,
              total: 0,
              past: 0,
              upcoming: 0
            };
          }
          statsMap[p.uid].total += 1;
          if (isPast) statsMap[p.uid].past += 1;
          else statsMap[p.uid].upcoming += 1;
        });
      });

      const sorted = Object.values(statsMap).sort((a, b) => b.total - a.total);
      setStats(sorted);
    };
    fetchStats();
  }, []);

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={btnStyle('#555')}>← Home</button>
      <h2 style={{ marginTop: '20px' }}>📊 Statistiche gilda</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>Classifica partecipazione agli eventi</p>

      {stats.length === 0 && <p style={{ color: '#aaa' }}>Nessun dato disponibile.</p>}

      {stats.map((s, i) => (
        <div key={i} style={{
          backgroundColor: '#16213e',
          borderRadius: '10px',
          padding: '15px 20px',
          marginBottom: '12px',
          borderLeft: `5px solid ${i === 0 ? '#f1c40f' : i === 1 ? '#bdc3c7' : i === 2 ? '#e67e22' : '#4285f4'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`} {s.charName}
            </h3>
            <span style={{
              backgroundColor: '#4285f4',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              {s.total} eventi
            </span>
          </div>
          <p style={{ margin: '8px 0 6px 0', color: '#aaa', fontSize: '0.85rem' }}>
            ✅ Completati: {s.past} &nbsp;|&nbsp; 📅 In programma: {s.upcoming}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {(s.jobs || [s.job]).map(job => (
              <span key={job} style={{
                backgroundColor: '#0f3460',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.8rem'
              }}>
                {JOB_ICONS[job] || '⚔️'} {job}
              </span>
            ))}
          </div>
        </div>
      ))}
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

export default Stats;