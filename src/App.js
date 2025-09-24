// my-chatbot/src/App.js
import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Set PDF.js worker source for PDF processing
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
// Backend API URL from environment variable or default
const API_URL = process.env.REACT_APP_API_URL || 'https://accessai-onh4.onrender.com/chat';

// NOTE: In a larger application, this would be imported from a shared module.
const learningPaths = {
    javascript: {
        chapters: [
            {
                title: 'JavaScript Fundamentals',
                lessons: [
                    { id: 1, title: 'Introduction to JavaScript', difficulty: 'Beginner', points: 50 },
                    { id: 2, title: 'Setting Up Your Environment', difficulty: 'Beginner', points: 50 },
                ],
            },
            // ... other chapters
        ],
    },
    python: { /* ... python data */ },
    java: { /* ... java data */ },
    cpp: { /* ... cpp data */ },
    solidity: { /* ... solidity data */ },
};

function App({ user, setUser }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('chatMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [credits, setCredits] = useState(() => {
    const saved = localStorage.getItem('credits');
    return saved ? parseInt(saved, 10) : 5;
  });
  
  // ... other existing states ...
  
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    localStorage.setItem('credits', credits);
  }, [messages, credits]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSubmit = async (userInput) => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(API_URL, {
        messages: newMessages,
        input: userInput,
        credits,
      }, {
        headers: { Authorization: user ? `Bearer ${user.token}` : '' },
      });

      const botMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, botMessage]);
      setCredits(response.data.credits);
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Error: Could not get a response.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  // Effect to handle closing sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
        if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
            setSidebarOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, [sidebarOpen]);


  return (
    <div className={`app-container ${theme}`}>
      <header className="header">
        <div className="header-left">
          <button className="btn btn-icon hamburger" onClick={toggleSidebar} aria-label="Toggle Menu">
            ☰
          </button>
          <h1 className="app-title">AccessAI</h1>
        </div>
        <div className="header-right">
          {user ? (
            <>
              <span>{user.email}</span>
              <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn btn-secondary">Login</button>
              <button onClick={() => navigate('/signup')} className="btn btn-primary">Sign Up</button>
            </>
          )}
          <button onClick={toggleTheme} className="btn btn-icon">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="main-layout container">
        {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
        <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-section">
            <h2>Settings</h2>
            <div className="settings-bar">
                {/* Simplified settings for clarity */}
                <label className="form-label" htmlFor="tone-select">Tone:</label>
                <select id="tone-select" className="form-select">
                    <option value="neutral">Neutral</option>
                    <option value="formal">Formal</option>
                    <option value="casual">Casual</option>
                </select>
            </div>
          </div>
           <div className="sidebar-section">
                <h2>Actions</h2>
                <div className="settings-bar">
                    <button className="btn btn-secondary">Clear Chat</button>
                    <button className="btn btn-secondary">Export Chat</button>
                </div>
            </div>
        </aside>

        <main className="main-content">
          <div className="chat-container">
            <div className="messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
                  <ReactMarkdown
                     components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {msg.role === 'assistant' && (
                     <div className="response-actions">
                        <button className="btn btn-icon" title="Copy">📋</button>
                        <button className="btn btn-icon" title="Listen">🔊</button>
                        <button className="btn btn-icon" title="Good response">👍</button>
                        <button className="btn btn-icon" title="Bad response">👎</button>
                    </div>
                  )}
                </div>
              ))}
               {loading && (
                <div className="message bot-message">
                  <div className="spinner"></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
              <input
                type="text"
                className="form-input chat-input"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(input)}
                disabled={loading}
              />
              <button onClick={() => handleSubmit(input)} className="btn btn-primary" disabled={loading}>Send</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;