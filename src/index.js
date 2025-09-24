// my-chatbot/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css'; // Changed from index.css to App.css for consolidated styles
import App from './App';
import Login from './Login';
import Signup from './Signup';
import LearningPath from './LearningPath';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Root component to manage user state across routes
function Root() {
  const [user, setUser] = React.useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App user={user} setUser={setUser} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup setUser={setUser} />} />
        <Route path="/learn/:language" element={<LearningPath user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);