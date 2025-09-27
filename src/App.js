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
  const [theme, setTheme] = useState(() => localStorage.getItem('accessai-theme') || 'light');
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('accessai-theme', theme);
  }, [theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  useEffect(() => {
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

    if ('speechSynthesis' in window) {
      setTtsSupported(true);
    }

    fetchLeaderboard();
    setProgress(Math.min(100, Math.floor((points % 100) / 100 * 100)));
  }, [points]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(LEADERBOARD_URL, { params: { limit: 5 } });
      console.log('Leaderboard fetched successfully:', response.data);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const toggleMode = (mode) => {
    setActiveModes(prev => ({ ...prev, [mode]: !prev[mode] }));
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
      console.log('Project created:', project.name);
    }
  };

  const switchProject = (projectName) => {
    if (currentProject) {
      setProjects(prev => 
        prev.map(p => 
          p.name === currentProject ? { ...p, messages } : p
        )
      );
    }
    setCurrentProject(projectName);
    const project = projects.find(p => p.name === projectName);
    setMessages(project ? project.messages : []);
    console.log('Switched to project:', projectName);
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

    if (!user && credits <= 0) {
      console.warn('No credits remaining for guest user');
      setShowSignupPrompt(true);
      setLoading(false);
      return;
    }

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
      const headers = { 'Content-Type': 'application/json' };
      if (user?.token) {
        headers.Authorization = `Bearer ${user.token}`;
      }

      console.log('Sending chat request:', {
        endpoint: CHAT_ENDPOINT,
        messageCount: updatedMessages.length,
        inputLength: enhancedPrompt.length,
        hasToken: !!user?.token
      });

      const response = await axios.post(CHAT_ENDPOINT, {
        messages: updatedMessages,
        input: enhancedPrompt,
        credits
      }, { headers });

      console.log('Chat response received:', {
        status: response.status,
        responseLength: response.data.response?.length
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
          console.log('Guest credits updated:', response.data.credits);
        } else {
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
            console.log('Points updated successfully');
          } catch (pointsError) {
            console.error('Error updating points:', {
              message: pointsError.message,
              response: pointsError.response?.data,
              status: pointsError.response?.status
            });
          }
        }
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: {
          messages: updatedMessages.length,
          inputLength: enhancedPrompt.length
        }
      });
      setError(error.response?.data?.details || 'Failed to send message. Please try again.');
      
      const errorMessage = {
        role: 'assistant',
        content: `Error: ${error.response?.data?.details || 'Failed to send message.'}`,
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
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const editResponse = (index, content) => {
    const newContent = prompt('Edit response:', content);
    if (newContent !== null) {
      setMessages(prev => prev.map((msg, i) => 
        i === index ? { ...msg, content: newContent } : msg
      ));
      console.log('Response edited:', { index });
    }
  };

  const shareResponse = async (index, content) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AccessAI Response',
          text: content
        });
        console.log('Response shared:', { index });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      await copyToClipboard(content);
      console.log('Response copied to clipboard:', { index });
      alert('Response copied to clipboard!');
    }
  };

  const downloadCode = (code, language) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code.${language || 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('Code downloaded:', { language });
  };

  const handleFeedback = (messageId, type) => {
    setFeedback(prev => ({ ...prev, [messageId]: type }));
    console.log('Feedback recorded:', { messageId, type });
  };

  const addComment = (messageId) => {
    const comment = prompt('Add a comment:');
    if (comment) {
      setComments(prev => ({ ...prev, [messageId]: comment }));
      console.log('Comment added:', { messageId, comment });
    }
  };

  const viewFullCode = (code) => {
    setFullCodeView(code);
    console.log('Viewing full code');
  };

  const closeFullCode = () => {
    setFullCodeView(null);
    console.log('Closed full code view');
  };

  const handleSignupPrompt = () => {
    setShowSignupPrompt(false);
    navigate('/signup');
    console.log('Navigated to signup');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessai-user');
    setCredits(5);
    setPoints(0);
    setLevel(1);
    console.log('User logged out');
  };

  const languages = [
    { name: 'JavaScript', icon: '🟨', path: 'javascript' },
    { name: 'Python', icon: '🐍', path: 'python' },
    { name: 'Java', icon: '☕', path: 'java' },
    { name: 'C++', icon: '➕', path: 'cpp' },
    { name: 'Solidity', icon: '🔗', path: 'solidity' },
  ];

  const startLearning = (path) => {
    navigate(`/learn/${path}`);
    console.log('Started learning path:', path);
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle Sidebar">
            ☰
          </button>
          <h1 className="app-title">AccessAI</h1>
        </div>
        <div className="header-right">
          {user ? (
            <>
              <div className="user-stats">
                <span className="user-points">Points: {points}</span>
                <span className="user-level">Level: {level}</span>
              </div>
              <button onClick={logout} className="auth-button">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="auth-button">Login</button>
              <button onClick={() => navigate('/signup')} className="auth-button primary">Signup</button>
            </>
          )}
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </header>

      <div className="main-layout">
        <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h2>Settings</h2>
            <button className="sidebar-close" onClick={toggleSidebar} aria-label="Close Sidebar">✕</button>
          </div>
          
          <div className="sidebar-section">
            <h3>Modes</h3>
            {Object.entries(activeModes).map(([mode, active]) => (
              <div 
                key={mode} 
                className={`settings-toggle ${active ? 'active' : ''}`}
                onClick={() => toggleMode(mode)}
              >
                {mode.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                <div className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={active} 
                    readOnly 
                    aria-hidden="true"
                  />
                  <span className="toggle-slider"></span>
                </div>
              </div>
            ))}
          </div>

          <div className="sidebar-section">
            <h3>Tone</h3>
            <select 
              value={tone} 
              onChange={e => setTone(e.target.value)}
              className="settings-select"
            >
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="humorous">Humorous</option>
            </select>
          </div>

          <div className="sidebar-section">
            <h3>Response Length</h3>
            <select 
              value={responseLength} 
              onChange={e => setResponseLength(e.target.value)}
              className="settings-select"
            >
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </div>

          <div className="sidebar-section">
            <h3>Projects</h3>
            <div className="project-input-group">
              <input 
                type="text" 
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="New project name"
                className="project-input"
              />
              <button onClick={createProject} className="action-btn">Create</button>
            </div>
            <div className="project-list">
              {projects.map(project => (
                <div 
                  key={project.name}
                  className={`project-item ${currentProject === project.name ? 'active' : ''}`}
                  onClick={() => switchProject(project.name)}
                >
                  {project.name}
                  <span className="project-date">{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="main-content">
          <section className="gamification-bar">
            <div className="progress-section">
              <div className="progress-info">
                <span>Level {level}</span>
                <span>{points} / {level * 100} XP</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="leaderboard-section">
              <h3>Leaderboard</h3>
              <div className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <div key={index} className="leaderboard-item">
                    <span>
                      <span className="leaderboard-rank">#{index + 1}</span> {entry.username}
                    </span>
                    <span>{entry.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="language-selection">
            <h2>Choose a Language to Learn</h2>
            <div className="language-grid">
              {languages.map(lang => (
                <div 
                  key={lang.path}
                  className="language-card"
                  onClick={() => startLearning(lang.path)}
                >
                  <span className="language-icon">{lang.icon}</span>
                  <h3>{lang.name}</h3>
                </div>
              ))}
            </div>
          </section>

          <section className="chat-interface">
            <h2>Chat with AI Tutor</h2>
            {!user && <p className="credits-info">Credits left: {credits}</p>}
            {error && <p className="error-message">{error}</p>}
            <div className="messages-container">
              {messages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}${msg.isError ? ' error' : ''}`}
                >
                  <div className="message-bubble">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <div className="code-block">
                              <SyntaxHighlighter
                                style={theme === 'dark' ? vscDarkPlus : coy}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                              <div className="code-actions">
                                <button onClick={() => copyToClipboard(String(children))} className="action-btn">Copy</button>
                                <button onClick={() => downloadCode(String(children), match[1])} className="action-btn">Download</button>
                                <button onClick={() => viewFullCode(String(children))} className="action-btn">Full View</button>
                              </div>
                            </div>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className="message-meta">
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && (
                      <div className="message-actions">
                        <button onClick={() => speakText(msg.content)} disabled={!ttsSupported} className="action-btn">🔊 Read</button>
                        <button onClick={() => copyToClipboard(msg.content)} className="action-btn">Copy</button>
                        <button onClick={() => editResponse(index, msg.content)} className="action-btn">Edit</button>
                        <button onClick={() => shareResponse(index, msg.content)} className="action-btn">Share</button>
                        <button onClick={() => handleFeedback(msg.id, 'thumbsup')} className={`action-btn ${feedback[msg.id] === 'thumbsup' ? 'active' : ''}`}>👍</button>
                        <button onClick={() => handleFeedback(msg.id, 'thumbsdown')} className={`action-btn ${feedback[msg.id] === 'thumbsdown' ? 'active' : ''}`}>👎</button>
                        <button onClick={() => addComment(msg.id)} className="action-btn">💬 Comment</button>
                      </div>
                    )}
                    {comments[msg.id] && <p className="comment">Comment: {comments[msg.id]}</p>}
                  </div>
                </div>
              ))}
              {loading && <div className="message bot-message">AI is thinking...</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSubmit(input)}
                placeholder="Type your message..."
                disabled={loading}
                className="chat-input"
              />
              <button 
                onClick={toggleRecording} 
                disabled={!speechSupported || loading} 
                className="action-btn"
                aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
              <button 
                onClick={() => handleSubmit(input)} 
                disabled={loading || !input.trim()}
                className="send-btn"
              >
                Send
              </button>
            </div>
            {speechError && <p className="error-message">{speechError}</p>}
          </section>
        </main>
      </div>

      {showSignupPrompt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowSignupPrompt(false)}>✕</button>
            <h2>Out of Credits</h2>
            <p>Sign up for unlimited access!</p>
            <button onClick={handleSignupPrompt} className="submit-btn">Sign Up Now</button>
          </div>
        </div>
      )}

      {fullCodeView && (
        <div className="modal-overlay">
          <div className="modal-content full-code-modal">
            <button className="modal-close" onClick={closeFullCode}>✕</button>
            <pre className="full-code-view">
              <code>{fullCodeView}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;