import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { JOB_ICONS, JOBS, ROLES } from '../constants';

function Profile() {
  const [charName, setCharName] = useState('');
  const [jobs, setJobs] = useState([]);
  const [role, setRole] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchProfile = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setCharName(data.charName || '');
        setJobs(data.jobs || (data.job ? [data.job] : []));
        setRole(data.role || '');
      }
    };
    fetchProfile();
  }, [user]);

  const toggleJob = (job) => {
    setJobs(prev =>
      prev.includes(job)
        ? prev.filter(j => j !== job)
        : [...prev, job]
    );
  };

  const handleSave = async () => {
    if (!charName) { alert('Inserisci il nome del personaggio!'); return; }
    if (jobs.length === 0) { alert('Seleziona almeno un job!'); return; }
    if (!role) { alert('Seleziona un ruolo!'); return; }

    const ref = doc(db, 'users', user.uid);
    await setDoc(ref, {
      charName,
      jobs,
      job: jobs[0],
      role,
      email: user.email,
      displayName: user.displayName,
      uid: user.uid
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={btnStyle('#555')}>← Torna alla Home</button>
      <h2 style={{ marginTop: '20px' }}>👤 Il tuo profilo personaggio</h2>

      <div style={{ maxWidth: '500px', marginTop: '30px' }}>
        <label>Nome personaggio</label>
        <input
          value={charName}
          onChange={e => setCharName(e.target.value)}
          placeholder="Es. JohnWarlock"
          style={inputStyle}
        />

        <label>Job (puoi selezionarne più di uno)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', marginBottom: '20px' }}>
          {JOBS.map(j => (
            <div
              key={j}
              onClick={() => toggleJob(j)}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                backgroundColor: jobs.includes(j) ? '#4285f4' : '#16213e',
                border: jobs.includes(j) ? '2px solid #4285f4' : '2px solid #444',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
            >
              {JOB_ICONS[j]} {j}
            </div>
          ))}
        </div>

        {jobs.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#aaa', marginBottom: '8px' }}>Job selezionati:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {jobs.map(j => (
                <span key={j} style={{
                  backgroundColor: '#4285f4',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.9rem'
                }}>
                  {JOB_ICONS[j]} {j}
                </span>
              ))}
            </div>
          </div>
        )}

        <label>Ruolo principale</label>
        <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
          <option value="">-- Seleziona ruolo --</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <button onClick={handleSave} style={btnStyle('#2ecc71')}>
          💾 Salva profilo
        </button>

        {saved && <p style={{ color: '#2ecc71', marginTop: '10px' }}>✅ Profilo salvato!</p>}
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

export default Profile;
