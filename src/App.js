// my-chatbot/src/App.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://accessai-onh4.onrender.com/chat';
const LEADERBOARD_URL = 'https://accessai-onh4.onrender.com/leaderboard';

function App({ user, setUser }) {
  const [theme, setTheme] = useState('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [auditMode, setAuditMode] = useState(false);
  const [emotionDetection, setEmotionDetection] = useState(false);
  const [criticalThinking, setCriticalThinking] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [aiLiteracy, setAiLiteracy] = useState(false);
  const [collaborationMode, setCollaborationMode] = useState(false);
  const [tone, setTone] = useState('friendly');
  const [responseLength, setResponseLength] = useState('concise');
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(5);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [fileName, setFileName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [points, setPoints] = useState(user ? user.points : 0);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [comments, setComments] = useState({});
  const [fullCodeView, setFullCodeView] = useState(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const mediaRecorderRef = useRef(null);
  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

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
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSubmit(transcript);
      };
      recognitionRef.current.onerror = (event) => {
        setSpeechError(`Speech recognition error: ${event.error}`);
      };
    }

    if ('speechSynthesis' in window) {
      setTtsSupported(true);
    }

    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(LEADERBOARD_URL);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const createProject = () => {
    if (newProjectName.trim()) {
      setProjects((prev) => [...prev, { name: newProjectName, messages: [] }]);
      setNewProjectName('');
    }
  };

  const switchProject = (projectName) => {
    if (currentProject) {
      const currentMessages = messages;
      setProjects((prev) =>
        prev.map((p) => (p.name === currentProject ? { ...p, messages: currentMessages } : p))
      );
    }
    setCurrentProject(projectName);
    const project = projects.find((p) => p.name === projectName);
    setMessages(project ? project.messages : []);
  };

  const handleSubmit = async (userInput) => {
    if (!userInput.trim()) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: userInput, timestamp: new Date().toLocaleTimeString() },
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    if (!user && credits <= 0) {
      setShowSignupPrompt(true);
      setLoading(false);
      return;
    }

    let enhancedPrompt = userInput;
    if (codeMode) enhancedPrompt = `Provide response in ${tone} tone, ${responseLength} length, with code examples. ${enhancedPrompt}`;
    if (auditMode) enhancedPrompt = `Audit the code for best practices: ${enhancedPrompt}`;
    if (emotionDetection) enhancedPrompt = `Detect emotion and respond empathetically: ${enhancedPrompt}`;
    if (criticalThinking) enhancedPrompt = `Encourage critical thinking: ${enhancedPrompt}`;
    if (simulationMode) enhancedPrompt = `Simulate the scenario: ${enhancedPrompt}`;
    if (aiLiteracy) enhancedPrompt = `Explain AI concepts: ${enhancedPrompt}`;
    if (collaborationMode) enhancedPrompt = `Collaborate on the idea: ${enhancedPrompt}`;

    try {
      const response = await axios.post(API_URL, {
        messages: newMessages,
        input: enhancedPrompt,
        credits,
      }, {
        headers: { Authorization: user ? `Bearer ${user.token}` : '' },
      });
      const botMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toLocaleTimeString(),
        tone,
        responseLength,
        isAudit: auditMode,
        isSimulation: simulationMode,
        isCollaboration: collaborationMode,
      };
      setMessages((prev) => [...prev, botMessage]);
      setCredits(response.data.credits);
      if (user) {
        setPoints((prev) => prev + 10);
        await axios.post('https://accessai-onh4.onrender.com/update-points', { points: 10 }, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: Failed to get response.', timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speakText = (text) => {
    if (ttsSupported) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const editResponse = (index, content) => {
    const newContent = prompt('Edit response:', content);
    if (newContent) {
      setMessages((prev) => prev.map((msg, i) => (i === index ? { ...msg, content: newContent } : msg)));
    }
  };

  const shareResponse = (index, content) => {
    alert(`Share this: ${content}`);
  };

  const downloadCode = (code, language) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFeedback = (index, type) => {
    setFeedback((prev) => ({ ...prev, [index]: type }));
  };

  const addComment = (index, text) => {
    setComments((prev) => ({
      ...prev,
      [index]: [...(prev[index] || []), { text, timestamp: new Date().toLocaleTimeString() }],
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        handleSubmit(`Uploaded file content: ${content}`);
      };
      reader.readAsText(file);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <div className={`app-container ${theme}`}>
      <header className="header">
        <div className="header-left">
          <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">
            ☰
          </button>
          <h1 className="app-title">AccessAI Chatbot</h1>
        </div>
        <div className="header-right">
          <div className="user-stats">
            {user ? (
              <>
                <span>Points: {points}</span>
                <button onClick={handleLogout} className="action-button">
                  Logout
                </button>
              </>
            ) : (
              <>
                <span>Credits: {credits}</span>
                <a href="/login">Login</a> / <a href="/signup">Signup</a>
              </>
            )}
          </div>
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </header>
      <div className="main-layout container">
        <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-section">
            <h2>Settings</h2>
            <div className="settings-bar">
              <label className={codeMode ? 'code-mode-active' : ''}>
                <input type="checkbox" checked={codeMode} onChange={() => setCodeMode(!codeMode)} />
                Code Mode
              </label>
              <label className={auditMode ? 'audit-mode-active' : ''}>
                <input type="checkbox" checked={auditMode} onChange={() => setAuditMode(!auditMode)} />
                Audit Mode
              </label>
              <label className={emotionDetection ? 'emotion-detection-active' : ''}>
                <input type="checkbox" checked={emotionDetection} onChange={() => setEmotionDetection(!emotionDetection)} />
                Emotion Detection
              </label>
              <label className={criticalThinking ? 'critical-thinking-active' : ''}>
                <input type="checkbox" checked={criticalThinking} onChange={() => setCriticalThinking(!criticalThinking)} />
                Critical Thinking
              </label>
              <label className={offlineMode ? 'offline-mode-active' : ''}>
                <input type="checkbox" checked={offlineMode} onChange={() => setOfflineMode(!offlineMode)} />
                Offline Mode
              </label>
              <label className={simulationMode ? 'simulation-mode-active' : ''}>
                <input type="checkbox" checked={simulationMode} onChange={() => setSimulationMode(!simulationMode)} />
                Simulation Mode
              </label>
              <label className={aiLiteracy ? 'ai-literacy-active' : ''}>
                <input type="checkbox" checked={aiLiteracy} onChange={() => setAiLiteracy(!aiLiteracy)} />
                AI Literacy
              </label>
              <label className={collaborationMode ? 'collaboration-mode-active' : ''}>
                <input type="checkbox" checked={collaborationMode} onChange={() => setCollaborationMode(!collaborationMode)} />
                Collaboration Mode
              </label>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="humorous">Humorous</option>
              </select>
              <select value={responseLength} onChange={(e) => setResponseLength(e.target.value)}>
                <option value="concise">Concise</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
          </div>
          <div className="sidebar-section">
            <h2>Projects</h2>
            <div className="projects-bar">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name"
                className="project-input"
              />
              <button onClick={createProject} className="sidebar-button">
                Create Project
              </button>
              <div className="project-list">
                {projects.map((project) => (
                  <button
                    key={project.name}
                    onClick={() => switchProject(project.name)}
                    className={currentProject === project.name ? 'active' : ''}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
        <main className="main-content">
          {/* Gamification Bar */}
          <div className="gamification-bar">
            <span>Progress: {progress}%</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}>
                <span>{progress}%</span>
              </div>
            </div>
            <div className="leaderboard">
              <h2>Leaderboard</h2>
              <ul>
                {leaderboard.map((entry, index) => (
                  <li key={index}>
                    {entry.username}: {entry.points}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Language Selection */}
          <div className="language-selection">
            <h2>Select Programming Language</h2>
            <div className="language-options">
              <button onClick={() => navigate('/learn/javascript')} className="language-button">
                JavaScript
              </button>
              <button onClick={() => navigate('/learn/python')} className="language-button">
                Python
              </button>
              <button onClick={() => navigate('/learn/java')} className="language-button">
                Java
              </button>
              <button onClick={() => navigate('/learn/cpp')} className="language-button">
                C++
              </button>
              <button onClick={() => navigate('/learn/solidity')} className="language-button">
                Solidity
              </button>
            </div>
          </div>

          {/* Learning Path Placeholder */}
          <div className="learning-path">
            {/* Learning path content would go here if integrated */}
          </div>

          {/* Challenge Section */}
          <div className="challenge-section">
            <h2>Coding Challenge</h2>
            <label htmlFor="code-editor">Write your code here:</label>
            <textarea id="code-editor" className="code-editor" placeholder="Enter your code..."></textarea>
            <button className="submit-challenge">Submit Challenge</button>
            <div className="challenge-result">
              {/* Challenge result would go here */}
            </div>
          </div>

          {/* Signup Prompt Modal */}
          {showSignupPrompt && (
            <div className="modal">
              <div className="modal-content">
                <button onClick={() => setShowSignupPrompt(false)} className="modal-close">
                  ✕
                </button>
                <h2>No Credits Left</h2>
                <p>Please sign up or log in to continue chatting.</p>
                <div className="modal-actions">
                  <button onClick={() => navigate('/login')} className="action-button">
                    Log In
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="action-button"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chat Interface */}
          <div className="chat-container">
            {/* Speech Error Display */}
            {speechError && (
              <div className="chat-error" role="alert">
                <span>⚠️ {speechError}</span>
                <button
                  onClick={() => setSpeechError('')}
                  className="action-button"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="messages">
              {(currentProject
                ? projects.find(p => p.name === currentProject)?.messages || messages
                : messages
              ).map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'} fade-in`}
                >
                  <div className="message-content">
                    {msg.role === 'assistant' ? (
                      <>
                        <div className="response-meta">
                          <span>Tone: {msg.tone || 'N/A'}</span>
                          <span>Length: {msg.responseLength || 'N/A'}</span>
                          {msg.language && <span>Language: {msg.language}</span>}
                          {msg.isAudit && <span>Type: Audit Report</span>}
                          {msg.isSimulation && <span>Type: Simulation</span>}
                          {msg.isCollaboration && <span>Type: Collaboration</span>}
                        </div>
                        <div className="response-body">
                          <ReactMarkdown
                            components={{
                              code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : msg.language || 'text';
                                return !inline && language ? (
                                  <SyntaxHighlighter
                                    style={theme === 'dark' ? vscDarkPlus : coy}
                                    language={language}
                                    PreTag="div"
                                    showLineNumbers
                                    wrapLines
                                    {...props}
                                  >
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
                        </div>
                        <div className="response-actions">
                          <button
                            onClick={() => speakText(msg.content)}
                            className="play-button"
                            disabled={!ttsSupported}
                            aria-label="Play response aloud"
                          >
                            ▶
                          </button>
                          <button
                            onClick={() => copyToClipboard(msg.content)}
                            className="action-button"
                            aria-label="Copy response"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => editResponse(index, msg.content)}
                            className="action-button"
                            aria-label="Edit response"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => shareResponse(index, msg.content)}
                            className="action-button"
                            aria-label="Share response"
                          >
                            Share
                          </button>
                          {msg.language && !msg.isAudit && (
                            <>
                              <button
                                onClick={() =>
                                  setFullCodeView({ content: msg.content, language: msg.language })
                                }
                                className="action-button"
                                aria-label="View full code"
                              >
                                Full Code View
                              </button>
                              <button
                                onClick={() => downloadCode(msg.content, msg.language)}
                                className="action-button"
                                aria-label="Download code"
                              >
                                Download Code
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleFeedback(index, 'like')}
                            className={`action-button ${feedback[index] === 'like' ? 'active' : ''}`}
                            aria-label="Like response"
                          >
                            👍
                          </button>
                          <button
                            onClick={() => handleFeedback(index, 'dislike')}
                            className={`action-button ${feedback[index] === 'dislike' ? 'active' : ''}`}
                            aria-label="Dislike response"
                          >
                            👎
                          </button>
                          {msg.language && !msg.isAudit && (
                            <>
                              <button
                                onClick={() => handleFeedback(index, 'works')}
                                className={`action-button ${feedback[index] === 'works' ? 'active' : ''}`}
                                aria-label="Code works"
                              >
                                Works
                              </button>
                              <button
                                onClick={() => handleFeedback(index, 'errors')}
                                className={`action-button ${feedback[index] === 'errors' ? 'active' : ''}`}
                                aria-label="Code has errors"
                              >
                                Errors
                              </button>
                            </>
                          )}
                          {msg.isAudit && (
                            <>
                              <button
                                onClick={() => handleFeedback(index, 'helpful')}
                                className={`action-button ${feedback[index] === 'helpful' ? 'active' : ''}`}
                                aria-label="Audit helpful"
                              >
                                Helpful
                              </button>
                              <button
                                onClick={() => handleFeedback(index, 'not-helpful')}
                                className={`action-button ${feedback[index] === 'not-helpful' ? 'active' : ''}`}
                                aria-label="Audit not helpful"
                              >
                                Not Helpful
                              </button>
                            </>
                          )}
                        </div>
                        <div className="comment-section">
                          <label htmlFor={`comment-input-${index}`}>Add a comment:</label>
                          <input
                            id={`comment-input-${index}`}
                            type="text"
                            placeholder="Add a comment..."
                            onKeyPress={e => {
                              if (e.key === 'Enter' && e.target.value) {
                                addComment(index, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="comment-input"
                            aria-label="Add comment"
                          />
                          {(comments[index] || []).map((comment, i) => (
                            <div key={i} className="comment">
                              <p>{comment.text}</p>
                              <span className="timestamp">{comment.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                    <span className="timestamp">{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message bot-message fade-in">
                  <div className="message-content">
                    <div className="spinner" role="status" aria-label="Loading"></div>
                  </div>
                </div>
              )}
              {fileName && !loading && (
                <div className="message user-message fade-in">
                  <div className="message-content">
                    <p>Uploaded: {fileName}</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="input-container">
              <label htmlFor="chat-input">Type or speak your message:</label>
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSubmit(input)}
                className="chat-input"
                placeholder="Type or speak your message..."
                disabled={loading}
                aria-label="Chat input"
              />
              <button
                onClick={toggleRecording}
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                disabled={loading || !speechSupported}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                🎤
              </button>
              <button
                onClick={() => handleSubmit(input)}
                className="send-button"
                disabled={loading}
                aria-label="Send message"
              >
                Send
              </button>
              <input
                type="file"
                accept=".txt,.pdf,image/*"
                onChange={handleFileUpload}
                className="file-input"
                disabled={loading}
                aria-label="Upload files"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="file-label">
                Upload File
              </label>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;