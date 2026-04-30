import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';

function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Errore login:", error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      color: 'white'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⚔️ PartyRagnarok</h1>
      <p style={{ marginBottom: '40px', color: '#aaa' }}>Organizza i party della tua gilda</p>
      <button
        onClick={handleLogin}
        style={{
          padding: '15px 30px',
          fontSize: '1.1rem',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        🔑 Accedi con Google
      </button>
    </div>
  );
}

export default Login;