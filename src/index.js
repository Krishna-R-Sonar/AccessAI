// Filename: src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Use react-dom/client for React 18
import App from './App';
import './App.css'; // Import your CSS file

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);