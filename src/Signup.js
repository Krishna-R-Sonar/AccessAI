// my-chatbot/src/Signup.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://accessai-onh4.onrender.com/signup', { email, password });
      const userData = { token: response.data.token, ...response.data.user };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
     <div className="app-container light">
        <div className="card auth-card">
            <h2>Create Account</h2>
            {error && <p style={{color: 'var(--danger-light)'}}>{error}</p>}
            <form onSubmit={handleSignup}>
                <div className="form-group">
                    <label className="form-label" htmlFor="signup-email">Email</label>
                    <input
                        id="signup-email"
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="signup-password">Password</label>
                    <input
                        id="signup-password"
                        type="password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <button type="submit" className="btn btn-primary" style={{width: '100%'}} disabled={loading}>
                    {loading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>
            <div className="footer-link">
                Already have an account? <Link to="/login">Log In</Link>
            </div>
        </div>
    </div>
  );
}

export default Signup;