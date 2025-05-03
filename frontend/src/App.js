import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import TransactionHistory from './components/TransactionHistory';
import Modal from './components/Modal';
import { motion } from 'framer-motion';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

function App() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';
  const [role, setRole] = useState(localStorage.getItem('role') || '');
  const [userName, setUserName] = useState(localStorage.getItem('name') || '');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'success' });
  const navigate = useNavigate();

  const showModal = (title, message, type = 'success', confirmAction = null) => {
    setModal({ isOpen: true, title, message, type, confirmAction });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      localStorage.clear();
      setRole('');
      setUserName('');
      showModal('Logout Successful', 'You have been logged out.', 'success');
      setTimeout(() => navigate('/login'), 1000);
    } catch (error) {
      showModal('Logout Failed', error.message, 'error');
    }
  };

  const particlesInit = async (main) => {
    try {
      await loadFull(main);
    } catch (error) {
      console.error('Failed to initialize particles:', error);
    }
  };

  const isLoggedIn = !!role;

  return (
    <motion.div
      className="min-h-screen relative bg-cream"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          particles: {
            number: { value: 30, density: { enable: true, value_area: 800 } },
            color: { value: ['#D4A017', '#8B5CF6'] }, // Ochre and purple
            shape: { type: ['circle', 'square'] },
            opacity: { value: 0.4, random: true },
            size: { value: 3, random: true },
            move: { enable: true, speed: 0.3, direction: 'none', random: true },
          },
          interactivity: {
            events: { onhover: { enable: true, mode: 'repulse' } },
            modes: { repulse: { distance: 100, duration: 0.4 } },
          },
        }}
      />
      {isLoggedIn && (
        <nav className="navbar">
          <div className="container mx-auto flex justify-between items-center py-4">
            <a href="/" className="navbar-brand">
              LibraryVerse
            </a>
            <div className="flex items-center space-x-4">
              <a href="/" className="navbar-link">Home</a>
              <a href="/transactions" className="navbar-link">History</a>
              <button
                onClick={handleLogout}
                className="btn btn-error text-lg font-merriweather"
              >
                Logout
              </button>
              <span className="navbar-link">{userName}</span>
            </div>
          </div>
        </nav>
      )}
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <Login setRole={setRole} setUserName={setUserName} />}
        />
        <Route
          path="/"
          element={isLoggedIn ? <Home role={role} showModal={showModal} closeModal={closeModal} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/transactions"
          element={isLoggedIn ? <TransactionHistory role={role} showModal={showModal} closeModal={closeModal} /> : <Navigate to="/login" replace />}
        />
      </Routes>
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmAction={modal.confirmAction}
      />
    </motion.div>
  );
}

export default App;