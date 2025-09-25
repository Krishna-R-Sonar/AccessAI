// my-chatbot/src/App.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://accessai-onh4.onrender.com';
const CHAT_ENDPOINT = `${API_URL}/chat`;
const LEADERBOARD_URL = `${API_URL}/leaderboard`;
const UPDATE_POINTS_URL = `${API_URL}/update-points`;

function App({ user, setUser }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('accessai-theme');
    return savedTheme || 'light';
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModes, setActiveModes] = useState({
    codeMode: false,
    auditMode: false,
    emotionDetection: false,
    criticalThinking: false,
    simulationMode: false,
    aiLiteracy: false,
    collaborationMode: false
  });
  
  const [tone, setTone] = useState('friendly');
  const [responseLength, setResponseLength] = useState('concise');
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(user ? Infinity : 5);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [fileName, setFileName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [points, setPoints] = useState(user ? user.points : 0);
  const [level, setLevel] = useState(user ? user.level : 1);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [comments, setComments] = useState({});
  const [fullCodeView, setFullCodeView] = useState(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('accessai-theme', theme);
  }, [theme]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setSpeechSupported(true);
      recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        setSpeechError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    // Text-to-speech
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
    }

    // Load leaderboard
    fetchLeaderboard();

    // Calculate progress
    setProgress(Math.min(100, Math.floor((points % 100) / 100 * 100)));
  }, [points]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(LEADERBOARD_URL, {
        params: { limit: 5 }
      });
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const toggleMode = (mode) => {
    setActiveModes(prev => ({
      ...prev,
      [mode]: !prev[mode]
    }));
  };

  const createProject = () => {
    if (newProjectName.trim()) {
      const project = { 
        name: newProjectName.trim(), 
        messages: [],
        createdAt: new Date().toISOString()
      };
      setProjects(prev => [...prev, project]);
      setNewProjectName('');
      setCurrentProject(project.name);
    }
  };

  const switchProject = (projectName) => {
    if (currentProject) {
      // Save current messages to project
      setProjects(prev => 
        prev.map(p => 
          p.name === currentProject ? { ...p, messages } : p
        )
      );
    }
    setCurrentProject(projectName);
    const project = projects.find(p => p.name === projectName);
    setMessages(project ? project.messages : []);
  };

  const handleSubmit = async (userInput) => {
    if (!userInput.trim()) return;

    const newMessage = { 
      role: 'user', 
      content: userInput, 
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    // Check credits for non-logged-in users
    if (!user && credits <= 0) {
      setShowSignupPrompt(true);
      setLoading(false);
      return;
    }

    // Build enhanced prompt based on active modes
    let enhancedPrompt = userInput;
    const modeInstructions = [];

    if (activeModes.codeMode) modeInstructions.push('Provide response with code examples');
    if (activeModes.auditMode) modeInstructions.push('Audit the code for best practices');
    if (activeModes.emotionDetection) modeInstructions.push('Detect emotion and respond empathetically');
    if (activeModes.criticalThinking) modeInstructions.push('Encourage critical thinking');
    if (activeModes.simulationMode) modeInstructions.push('Simulate the scenario');
    if (activeModes.aiLiteracy) modeInstructions.push('Explain AI concepts');
    if (activeModes.collaborationMode) modeInstructions.push('Collaborate on the idea');

    if (modeInstructions.length > 0) {
      enhancedPrompt = `${modeInstructions.join('. ')}. ${enhancedPrompt}`;
    }

    try {
      const response = await axios.post(CHAT_ENDPOINT, {
        messages: updatedMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        input: enhancedPrompt,
        credits
      }, {
        headers: { 
          Authorization: user ? `Bearer ${user.token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const botMessage = {
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toLocaleTimeString(),
          id: Date.now() + 1,
          tone,
          responseLength,
          modes: { ...activeModes }
        };

        setMessages(prev => [...prev, botMessage]);
        
        if (!user) {
          setCredits(response.data.credits);
        } else {
          // Update points for logged-in users
          setPoints(prev => {
            const newPoints = prev + 10;
            if (newPoints >= level * 100) {
              setLevel(prevLevel => prevLevel + 1);
            }
            return newPoints;
          });

          try {
            await axios.post(UPDATE_POINTS_URL, { points: 10 }, {
              headers: { Authorization: `Bearer ${user.token}` }
            });
          } catch (pointsError) {
            console.error('Error updating points:', pointsError);
          }
        }
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError(error.response?.data?.details || 'Failed to send message. Please try again.');
      
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now() + 1,
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (!speechSupported) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setSpeechError('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speakText = (text) => {
    if (ttsSupported) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch: 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const editResponse = (index, content) => {
    const newContent = prompt('Edit response:', content);
    if (newContent !== null) {
      setMessages(prev => prev.map((msg, i) => 
        i === index ? { ...msg, content: newContent } : msg
      ));
    }
  };

  const shareResponse = async (index, content) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AccessAI Response',
          text: content
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await copyToClipboard(content);
      alert('Response copied to clipboard!');
    }
  };

  const downloadCode = (code, language) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFeedback = (index, type) => {
    setFeedback(prev => ({ ...prev, [index]: type }));
  };

  const addComment = (index, text) => {
    if (!text.trim()) return;
    
    setComments(prev => ({
      ...prev,
      [index]: [...(prev[index] || []), { 
        text, 
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now()
      }]
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    
    if (file.type.startsWith('image/')) {
      // Handle image files
      const reader = new FileReader();
      reader.onload = (event) => {
        handleSubmit(`I uploaded an image file: ${file.name}. Please help me analyze it.`);
      };
      reader.readAsDataURL(file);
    } else {
      // Handle text-based files
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        handleSubmit(`I uploaded a file: ${file.name}. Content: ${content.substring(0, 1000)}...`);
      };
      reader.readAsText(file);
    }
    
    // Reset file input
    e.target.value = '';
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCredits(5);
    setPoints(0);
    setLevel(1);
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  return (
    <div className={`app-container ${theme}`}>
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button 
            className="hamburger" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <h1 className="app-title">AccessAI</h1>
        </div>
        
        <div className="header-right">
          <div className="user-stats">
            {user ? (
              <>
                <span className="user-points">⭐ {points}</span>
                <span className="user-level">Level {level}</span>
                <button onClick={handleLogout} className="action-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <span>Credits: {credits}</span>
                <a href="/login" className="auth-link">Login</a>
                <a href="/signup" className="auth-link">Signup</a>
              </>
            )}
          </div>
          
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <aside 
          ref={sidebarRef} 
          className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        >
          <div className="sidebar-header">
            <h3>Settings</h3>
            <button 
              className="sidebar-close" 
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          <div className="sidebar-section">
            <h3>AI Modes</h3>
            {Object.entries(activeModes).map(([mode, isActive]) => (
              <div 
                key={mode}
                className={`settings-toggle ${isActive ? 'active' : ''}`}
                onClick={() => toggleMode(mode)}
              >
                <span>{mode.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isActive}
                    onChange={() => {}}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <h3>Response Settings</h3>
            <div className="form-group">
              <label className="form-label">Tone</label>
              <select 
                value={tone} 
                onChange={(e) => setTone(e.target.value)}
                className="form-input"
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="humorous">Humorous</option>
                <option value="technical">Technical</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Response Length</label>
              <select 
                value={responseLength} 
                onChange={(e) => setResponseLength(e.target.value)}
                className="form-input"
              >
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Projects</h3>
            <div className="project-input-group">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name"
                className="project-input"
                onKeyPress={(e) => e.key === 'Enter' && createProject()}
              />
              <button onClick={createProject} className="send-btn">
                +
              </button>
            </div>
            
            <div className="project-list">
              {projects.map((project) => (
                <div
                  key={project.name}
                  className={`project-item ${currentProject === project.name ? 'active' : ''}`}
                  onClick={() => switchProject(project.name)}
                >
                  <span>{project.name}</span>
                  <span>{project.messages.length} messages</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <button onClick={clearChat} className="submit-btn" style={{background: 'var(--error-color)'}}>
              Clear Chat
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Gamification Bar */}
          <div className="gamification-bar">
            <div className="progress-section">
              <div className="progress-info">
                <span>Level {level} Progress</span>
                <span>{points % 100}/100 XP</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="leaderboard-section">
              <h3>Top Learners</h3>
              <div className="leaderboard-list">
                {leaderboard.slice(0, 3).map((entry, index) => (
                  <div key={index} className="leaderboard-item">
                    <span className="leaderboard-rank">#{index + 1}</span>
                    <span>{entry.username}</span>
                    <span>{entry.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <section className="language-selection">
            <h2>Start Learning</h2>
            <p>Choose your programming language to begin your coding journey</p>
            
            <div className="language-grid">
              {['JavaScript', 'Python', 'Java', 'C++', 'Solidity', 'Go'].map((lang) => (
                <div 
                  key={lang}
                  className="language-card"
                  onClick={() => navigate(`/learn/${lang.toLowerCase()}`)}
                >
                  <div className="language-icon">
                    {lang === 'JavaScript' && '⚡'}
                    {lang === 'Python' && '🐍'}
                    {lang === 'Java' && '☕'}
                    {lang === 'C++' && '⚙️'}
                    {lang === 'Solidity' && '🔗'}
                    {lang === 'Go' && '🚀'}
                  </div>
                  <h3>{lang}</h3>
                </div>
              ))}
            </div>
          </section>

          {/* Chat Interface */}
          <section className="chat-interface">
            <h2>AI Coding Assistant</h2>
            <p>Ask me anything about programming, code reviews, or learning paths</p>
            
            {error && (
              <div className="error-message">
                ⚠️ {error}
                <button onClick={() => setError('')} className="modal-close">
                  ✕
                </button>
              </div>
            )}

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="text-center" style={{padding: '2rem', color: 'var(--text-muted)'}}>
                  <h3>👋 Welcome to AccessAI!</h3>
                  <p>Start a conversation by typing a message below or select a learning path above.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.role}-message`}>
                    <div className="message-bubble">
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const language = match ? match[1] : 'text';
                              
                              return !inline ? (
                                <div style={{position: 'relative'}}>
                                  <SyntaxHighlighter
                                    style={theme === 'dark' ? vscDarkPlus : coy}
                                    language={language}
                                    PreTag="div"
                                    showLineNumbers
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                  <button 
                                    onClick={() => setFullCodeView({content: String(children), language})}
                                    className="action-btn"
                                    style={{position: 'absolute', top: '0.5rem', right: '0.5rem'}}
                                  >
                                    Full View
                                  </button>
                                </div>
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
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      
                      {msg.role === 'assistant' && (
                        <div className="message-actions">
                          <button onClick={() => speakText(msg.content)} className="action-btn">
                            🔊 Speak
                          </button>
                          <button onClick={() => copyToClipboard(msg.content)} className="action-btn">
                            📋 Copy
                          </button>
                          <button onClick={() => editResponse(msg.id, msg.content)} className="action-btn">
                            ✏️ Edit
                          </button>
                          <button onClick={() => shareResponse(msg.id, msg.content)} className="action-btn">
                            📤 Share
                          </button>
                        </div>
                      )}
                      
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {loading && (
                <div className="message bot-message">
                  <div className="message-bubble">
                    <div className="loading"></div>
                    <span style={{marginLeft: '0.5rem'}}>AI is thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSubmit(input)}
                placeholder="Type your message here..."
                className="chat-input"
                disabled={loading}
              />
              
              <button
                onClick={toggleRecording}
                className={`send-btn ${isRecording ? 'recording' : ''}`}
                disabled={!speechSupported || loading}
                style={{background: isRecording ? 'var(--error-color)' : 'var(--secondary-color)'}}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
              
              <button
                onClick={() => handleSubmit(input)}
                className="send-btn"
                disabled={loading || !input.trim()}
              >
                {loading ? '⏳' : '📤'}
              </button>
            </div>

            <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.5rem'}}>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                accept=".txt,.js,.py,.java,.cpp,.sol,.go,image/*"
                style={{display: 'none'}}
              />
              <label htmlFor="file-upload" className="action-btn">
                📎 Upload File
              </label>
              
              {fileName && (
                <span style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                  Selected: {fileName}
                </span>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Signup Prompt Modal */}
      {showSignupPrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              onClick={() => setShowSignupPrompt(false)} 
              className="modal-close"
            >
              ✕
            </button>
            
            <h2>🎉 Unlock Full Access!</h2>
            <p>You've used all your free credits. Sign up now to get:</p>
            
            <ul style={{margin: '1rem 0', paddingLeft: '1.5rem'}}>
              <li>✨ Unlimited AI conversations</li>
              <li>⭐ Earn points and level up</li>
              <li>🏆 Compete on the leaderboard</li>
              <li>💾 Save your projects and chat history</li>
            </ul>
            
            <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
              <button 
                onClick={() => navigate('/login')} 
                className="submit-btn"
                style={{flex: 1}}
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/signup')} 
                className="submit-btn"
                style={{flex: 1, background: 'var(--success-color)'}}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Code View Modal */}
      {fullCodeView && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              onClick={() => setFullCodeView(null)} 
              className="modal-close"
            >
              ✕
            </button>
            
            <h2>Complete Code</h2>
            <SyntaxHighlighter
              style={theme === 'dark' ? vscDarkPlus : coy}
              language={fullCodeView.language}
              showLineNumbers
              style={{maxHeight: '60vh', overflow: 'auto'}}
            >
              {fullCodeView.content}
            </SyntaxHighlighter>
            
            <button 
              onClick={() => downloadCode(fullCodeView.content, fullCodeView.language)}
              className="submit-btn"
              style={{marginTop: '1rem'}}
            >
              Download Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;