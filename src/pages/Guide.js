import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    title: '👤 Come registrarsi',
    content: `1. Vai su PartyRagnarok e clicca "Accedi con Google"
2. Accedi con il tuo account Google
3. Vai su "Profilo" e inserisci:
   - Nome del tuo personaggio in gioco
   - I tuoi job (puoi selezionarne più di uno)
   - Il tuo ruolo principale (DPS, Support o Tank)
4. Clicca "Salva profilo"`
  },
  {
    title: '⚔️ Come creare un evento',
    content: `1. Dalla Home clicca "➕ Evento"
2. Inserisci il nome dell'evento (es. Endless Tower)
3. Scegli data e ora
4. Imposta il numero di posti per ruolo:
   - DPS: quanti giocatori DPS servono
   - Support: quanti healer/support servono
   - Tank: quanti tank servono
5. Clicca "Crea evento"
6. Una notifica arriverà automaticamente su Discord nel canale #eventparty`
  },
  {
    title: '📋 Come partecipare a un evento',
    content: `1. Dalla Home clicca sull'evento che ti interessa
2. Clicca "✅ Partecipa"
3. Se hai più job, scegli con quale vuoi partecipare
4. Se i posti sono esauriti, puoi iscriverti come riserva
5. Se un partecipante si ritira, la prima riserva viene promossa automaticamente`
  },
  {
    title: '🔔 Notifiche Discord',
    content: `Le notifiche arrivano automaticamente su Discord:

📢 Canale #eventparty:
   - Quando viene creato un nuovo evento
   - Quando si libera un posto
   - Quando una riserva viene promossa

⏰ Canale #promemoria:
   - 30 minuti prima dell'evento
   - 10 minuti prima dell'evento
   - Quando l'evento sta per iniziare`
  },
  {
    title: '✏️ Gestione eventi (solo creatore)',
    content: `Se hai creato un evento puoi:
- ✏️ Modificarlo: cambiare nome, data o numero di posti
- 🗑️ Eliminarlo: rimuovere l'evento definitivamente

Questi pulsanti sono visibili solo a te come creatore dell'evento.`
  },
  {
    title: '📊 Statistiche e membri',
    content: `- 👥 Membri: vedi tutti i giocatori registrati con i loro job e ruoli
- 📊 Stats: classifica di partecipazione agli eventi della gilda
   - 🥇 Chi ha partecipato a più eventi
   - Quanti eventi completati e in programma per ogni membro`
  },
  {
    title: '🔄 Riserve',
    content: `Quando un evento è completo puoi iscriverti come riserva.
- Verrai aggiunto alla lista d'attesa
- Se un partecipante annulla, sarai promosso automaticamente
- Riceverai la notifica su Discord quando vieni promosso`
  }
];

function Guide() {
  const [openSection, setOpenSection] = useState(null);
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={btnStyle('#555')}>← Home</button>
      <h2 style={{ marginTop: '20px', marginBottom: '10px' }}>📖 Guida PartyRagnarok</h2>
      <p style={{ color: '#aaa', marginBottom: '25px' }}>Come usare l'app per organizzare i party della gilda</p>

      {sections.map((section, i) => (
        <div key={i} style={{
          backgroundColor: '#16213e',
          borderRadius: '10px',
          marginBottom: '12px',
          overflow: 'hidden'
        }}>
          <div
            onClick={() => setOpenSection(openSection === i ? null : i)}
            style={{
              padding: '15px 20px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '4px solid #4285f4'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem' }}>{section.title}</h3>
            <span style={{ fontSize: '1.2rem' }}>{openSection === i ? '🔼' : '🔽'}</span>
          </div>

          {openSection === i && (
            <div style={{
              padding: '15px 20px',
              borderTop: '1px solid #0f3460',
              whiteSpace: 'pre-line',
              color: '#ccc',
              lineHeight: '1.7',
              fontSize: '0.95rem'
            }}>
              {section.content}
            </div>
          )}
        </div>
      ))}

      <div style={{
        backgroundColor: '#0f3460',
        borderRadius: '10px',
        padding: '20px',
        marginTop: '20px',
        borderLeft: '4px solid #2ecc71'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🌐 Link utili</h3>
        <p style={{ margin: '5px 0', color: '#ccc' }}>🎮 Sito: <a href="https://partyragnarok-91b64.web.app" style={{ color: '#4285f4' }}>partyragnarok-91b64.web.app</a></p>
        <p style={{ margin: '5px 0', color: '#ccc' }}>💬 Discord: cerca i canali #eventparty e #promemoria</p>
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

export default Guide;