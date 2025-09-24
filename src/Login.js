// my-chatbot/src/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://accessai-onh4.onrender.com/login', { email, password });
      const userData = { token: response.data.token, ...response.data.user };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container light">
        <div className="card auth-card">
            <h2>Log In</h2>
            {error && <p style={{color: 'var(--danger-light)'}}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label className="form-label" htmlFor="login-email">Email</label>
                    <input
                        id="login-email"
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <input
                        id="login-password"
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading}>
                    {loading ? 'Logging In...' : 'Log In'}
                </button>
            </form>
            <div className="footer-link">
                Don’t have an account? <Link to="/signup">Sign Up</Link>
            </div>
        </div>
    </div>
  );
}

export default Login;