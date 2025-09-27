import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('https://accessai-onh4.onrender.com/login', {
        email,
        password,
      });
      const userData = { token: response.data.token, ...response.data.user };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" role="region" aria-labelledby="login-title">
        <div className="auth-header">
          <h2 id="login-title">Log In to Your Account</h2>
        </div>
        {/* Display error message if present */}
        {error && <div className="error-message">{error}</div>}
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              aria-describedby={error ? 'login-error' : undefined}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              aria-describedby={error ? 'login-error' : undefined}
              className="form-input"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading} aria-busy={loading}>
            {loading ? (
              <span className="loading-spinner">
                <span className="spinner-icon" aria-hidden="true"></span>
                Logging In...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </form>
        <div className="auth-footer">
          Don’t have an account? <a href="/signup" className="auth-link">Sign Up</a>
        </div>
      </div>
    </div>
  );
}

export default Login;