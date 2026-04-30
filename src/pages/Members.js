import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { JOB_ICONS } from '../constants';

function Members() {
  const [members, setMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(list.filter(m => m.charName));
    };
    fetchMembers();
  }, []);

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={btnStyle('#555')}>← Home</button>
      <h2 style={{ marginTop: '20px' }}>👥 Membri della gilda</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>{members.length} membri registrati</p>

      {members.map((m, i) => (
        <div key={i} style={{
          backgroundColor: '#16213e',
          borderRadius: '10px',
          padding: '15px 20px',
          marginBottom: '12px',
          borderLeft: '5px solid #9b59b6'
        }}>
          <h3 style={{ margin: '0 0 8px 0' }}>{m.charName}</h3>
          <p style={{ margin: '0 0 6px 0', color: '#aaa', fontSize: '0.9rem' }}>
            🎭 Ruolo: <strong style={{ color: 'white' }}>{m.role}</strong>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {(m.jobs || (m.job ? [m.job] : [])).map(job => (
              <span key={job} style={{
                backgroundColor: '#0f3460',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.85rem'
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

export default Members;