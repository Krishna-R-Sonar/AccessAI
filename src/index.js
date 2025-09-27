// my-chatbot/src/index.js
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Login from './Login';
import Signup from './Signup';
import LearningPath from './LearningPath';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          color: '#b91c1c',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h1>Something went wrong</h1>
          <p>An unexpected error occurred. Please try refreshing the page or contact support.</p>
          <details style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
            <summary>Error Details</summary>
            <p>{this.state.error?.message}</p>
            <p>{this.state.errorInfo?.componentStack}</p>
          </details>
          <button
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('accessai-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    console.log('Root component mounted', { user: user?.email || 'Guest' });
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
          <Route path="/learn/:language" element={<LearningPath user={user} />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

// Log application startup
console.log('Application started', {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
});