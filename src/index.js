// my-chatbot/src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './Login';
import Signup from './Signup';
import LearningPath from './LearningPath';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ef4444' }}>
            ⚠️ Something went wrong
          </h1>
          <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Root component to manage user state across routes
function Root() {
  const [user, setUser] = React.useState(() => {
    try {
      const savedUser = localStorage.getItem('accessai-user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  });

  // Persist user changes to localStorage
  React.useEffect(() => {
    if (user) {
      localStorage.setItem('accessai-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('accessai-user');
    }
  }, [user]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App user={user} setUser={setUser} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="/learn/:language" element={<LearningPath user={user} setUser={setUser} />} />
          <Route path="*" element={
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
              <p style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>
                Page not found
              </p>
              <a 
                href="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#4f46e5',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                Go Home
              </a>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// Create root and render
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure you have a div with id="root" in your HTML.');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);