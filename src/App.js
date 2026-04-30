import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import Login from './pages/Login';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import EditEvent from './pages/EditEvent';
import Members from './pages/Members';
import Stats from './pages/Stats';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'white' }}>Caricamento...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/create-event" element={user ? <CreateEvent /> : <Navigate to="/login" />} />
        <Route path="/event/:id" element={user ? <EventDetail /> : <Navigate to="/login" />} />
        <Route path="/edit-event/:id" element={user ? <EditEvent /> : <Navigate to="/login" />} />
        <Route path="/members" element={user ? <Members /> : <Navigate to="/login" />} />
        <Route path="/stats" element={user ? <Stats /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;