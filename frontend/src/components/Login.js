import React, { useState } from 'react';
import { motion } from 'framer-motion';

function Login({ setRole, setUserName }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      localStorage.setItem('role', data.role);
      localStorage.setItem('name', data.name);
      setRole(data.role);
      setUserName(data.name);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: 'spring' }}
    >
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-4xl">
        <motion.div
          className="md:w-1/2 p-8"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <svg className="hero-svg" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M256 32C132.3 32 32 132.3 32 256s100.3 224 224 224 224-100.3 224-224S379.7 32 256 32zm0 384c-88.4 0-160-71.6-160-160S167.6 96 256 96s160 71.6 160 160-71.6 160-160 160z" fill="#A78BFA"/>
            <path d="M256 128c-70.7 0-128 57.3-128 128s57.3 128 128 128 128-57.3 128-128-57.3-128-128-128zm0 192c-35.3 0-64-28.7-64-64s28.7-64 64-64 64 28.7 64 64-28.7 64-64 64z" fill="#6B21A8"/>
          </svg>
        </motion.div>
        <motion.div
          className="card w-full max-w-md p-10 md:w-1/2"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2
            className="text-5xl font-extrabold text-center text-purple-400 mb-8 glow"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome to LibraryVerse
          </motion.h2>
          {error && (
            <motion.div
              className="alert alert-error mb-6"
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          <div className="input-wrapper mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="input w-full"
              disabled={isLoading}
              id="email"
            />
            <label htmlFor="email">Email</label>
          </div>
          <div className="input-wrapper mb-8">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="input w-full"
              disabled={isLoading}
              id="password"
            />
            <label htmlFor="password">Password</label>
          </div>
          <motion.button
            onClick={handleLogin}
            className="btn btn-primary w-full glow btn-ripple"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              'Login'
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Login;