// my-chatbot/src/Signup.js

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Signup({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle signup form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://accessai-onh4.onrender.com/signup', {
        email,
        password,
      });
      const userData = { token: response.data.token, ...response.data.user };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" role="region" aria-labelledby="signup-title">
        <div className="auth-header">
          <h2 id="signup-title">Create Your Account</h2>
        </div>
        {/* Display error message if present */}
        {error && <div className="error-message">{error}</div>}
        <form className="auth-form" onSubmit={handleSignup}>
          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">Email</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              aria-describedby={error ? 'signup-error' : undefined}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              aria-describedby={error ? 'signup-error' : undefined}
              className="form-input"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading} aria-busy={loading}>
            {loading ? (
              <span className="loading-spinner">
                <span className="spinner-icon" aria-hidden="true"></span>
                Signing Up...
              </span>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <a href="/login" className="auth-link">Log In</a>
        </div>
      </div>
    </div>
  );
}

export default Signup;