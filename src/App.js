// Filename: src/App.js
import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './App.css';

// Set the worker source to the copied pdf.worker.mjs in public/
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

// Backend API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/chat';

// Mock leaderboard data
const leaderboardData = [
  { username: 'CodeMaster', points: 1500 },
  { username: 'SolidityStar', points: 1200 },
  { username: 'PythonPro', points: 1000 },
];

// Learning paths for each language
const learningPaths = {
  javascript: [
    { id: 1, title: 'Variables and Data Types', difficulty: 'Beginner', points: 50 },
    { id: 2, title: 'Functions and Scope', difficulty: 'Beginner', points: 75 },
    { id: 3, title: 'Arrays and Loops', difficulty: 'Intermediate', points: 100 },
    { id: 4, title: 'Promises and Async/Await', difficulty: 'Intermediate', points: 150 },
    { id: 5, title: 'Build a Mini Project', difficulty: 'Advanced', points: 200 },
  ],
  python: [
    { id: 1, title: 'Basics of Python', difficulty: 'Beginner', points: 50 },
    { id: 2, title: 'Lists and Dictionaries', difficulty: 'Beginner', points: 75 },
    { id: 3, title: 'Functions and Modules', difficulty: 'Intermediate', points: 100 },
    { id: 4, title: 'File Handling', difficulty: 'Intermediate', points: 150 },
    { id: 5, title: 'Data Analysis with Pandas', difficulty: 'Advanced', points: 200 },
  ],
  java: [
    { id: 1, title: 'Classes and Objects', difficulty: 'Beginner', points: 50 },
    { id: 2, title: 'Methods and Constructors', difficulty: 'Beginner', points: 75 },
    { id: 3, title: 'Inheritance and Polymorphism', difficulty: 'Intermediate', points: 100 },
    { id: 4, title: 'Exception Handling', difficulty: 'Intermediate', points: 150 },
    { id: 5, title: 'Build a Java App', difficulty: 'Advanced', points: 200 },
  ],
  cpp: [
    { id: 1, title: 'Pointers and Memory', difficulty: 'Beginner', points: 50 },
    { id: 2, title: 'Classes and Objects', difficulty: 'Beginner', points: 75 },
    { id: 3, title: 'Templates', difficulty: 'Intermediate', points: 100 },
    { id: 4, title: 'STL (Standard Template Library)', difficulty: 'Intermediate', points: 150 },
    { id: 5, title: 'Build a C++ Project', difficulty: 'Advanced', points: 200 },
  ],
  solidity: [
    { id: 1, title: 'Introduction to Smart Contracts', difficulty: 'Beginner', points: 50 },
    { id: 2, title: 'Writing Your First Contract', difficulty: 'Beginner', points: 75 },
    { id: 3, title: 'State Variables and Functions', difficulty: 'Intermediate', points: 100 },
    { id: 4, title: 'Build a Voting Contract', difficulty: 'Intermediate', points: 150 },
    { id: 5, title: 'Create a Simple Token', difficulty: 'Advanced', points: 200 },
  ],
};

// Badges for milestones
const badges = [
  { name: 'Beginner Coder', points: 100, description: 'Completed your first lesson!' },
  { name: 'Challenge Champion', points: 300, description: 'Solved 3 coding challenges!' },
  { name: 'Solidity Starter', points: 200, description: 'Completed a Solidity lesson!' },
  { name: 'Master Coder', points: 500, description: 'Earned 500 points!' },
];

function App() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem('chatProjects');
    return savedProjects ? JSON.parse(savedProjects) : [];
  });
  const [currentProject, setCurrentProject] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [theme, setTheme] = useState('light');
  const [tone, setTone] = useState('neutral');
  const [responseLength, setResponseLength] = useState('medium');
  const [factCheck, setFactCheck] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [detailedMode, setDetailedMode] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [auditMode, setAuditMode] = useState(false);
  const [emotionDetection, setEmotionDetection] = useState(false);
  const [criticalThinkingMode, setCriticalThinkingMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [aiLiteracyMode, setAiLiteracyMode] = useState(false);
  const [collaborationMode, setCollaborationMode] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [feedback, setFeedback] = useState({});
  const [comments, setComments] = useState({});
  const [fullCodeView, setFullCodeView] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);

  // Gamification and Learning Path States
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [userProgress, setUserProgress] = useState(() => {
    const savedProgress = localStorage.getItem('userProgress');
    return savedProgress ? JSON.parse(savedProgress) : { points: 0, completedLessons: {}, badges: [] };
  });
  const [currentLesson, setCurrentLesson] = useState(null);
  const [challengeInput, setChallengeInput] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    localStorage.setItem('chatProjects', JSON.stringify(projects));
    localStorage.setItem('userProgress', JSON.stringify(userProgress));
    scrollToBottom();
  }, [messages, projects, userProgress]);

  useEffect(() => {
    scrollToBottom();
  }, [loading]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [sidebarOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const detectEmotion = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('frustrated') || lowerText.includes('stuck') || lowerText.includes('hard') || lowerText.includes('difficult')) {
      return 'frustrated';
    } else if (lowerText.includes('great') || lowerText.includes('awesome') || lowerText.includes('good')) {
      return 'positive';
    }
    return 'neutral';
  };

  const handleSubmit = useCallback(async (textToProcess, isStudyGuide = false) => {
    if (!textToProcess || textToProcess.trim() === '') return;

    const timestamp = new Date().toLocaleTimeString();
    const userMessage = { role: 'user', content: textToProcess, timestamp };
    setMessages(prev => [...prev, userMessage]);

    if (currentProject) {
      setProjects(prev => {
        const updated = [...prev];
        const project = updated.find(p => p.name === currentProject);
        if (project) {
          project.messages = [...project.messages, userMessage];
        } else {
          updated.push({ name: currentProject, messages: [userMessage] });
        }
        return updated;
      });
    }

    setLoading(true);

    try {
      if (offlineMode) {
        const assistantMessage = {
          role: 'assistant',
          content: `**Offline Mode**: Limited functionality available. Here's a basic response:\n\nI can help with simple queries offline. For example, if you're asking about basic math, I can assist. What is your question?`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setLoading(false);
        setFileName('');
        return;
      }

      let detectedEmotion = 'neutral';
      if (emotionDetection) {
        detectedEmotion = detectEmotion(textToProcess);
      }

      let adjustedTone = tone;
      if (emotionDetection && detectedEmotion === 'frustrated') {
        adjustedTone = 'encouraging';
      } else if (emotionDetection && detectedEmotion === 'positive') {
        adjustedTone = 'celebratory';
      }

      let prompt = textToProcess;
      if (isStudyGuide) {
        prompt = `Generate a concise study guide from the following notes in Markdown format: ${textToProcess}`;
      } else if (auditMode) {
        prompt = `Act as a code auditor for ${codeLanguage} code. Analyze the following code for syntax errors, potential issues, and best practices. Provide a detailed audit report in Markdown format, including a summary of findings, specific issues with line numbers (if applicable), reasoning for each issue, and suggestions for improvement. Here is the code to audit:\n\n\`\`\`${codeLanguage}\n${textToProcess}\n\`\`\``;
      } else if (codeMode) {
        if (criticalThinkingMode) {
          prompt = `Act as a coding mentor for ${codeLanguage}. Instead of providing the full solution, ask probing questions to guide the user to solve: ${textToProcess}. Then, suggest alternative approaches and explain their trade-offs in Markdown format.`;
        } else {
          prompt = `Act as a coding assistant. Generate a complete ${codeLanguage} code file for: ${textToProcess}. Include all necessary imports, main logic, and exports. Provide explanations in Markdown format.`;
        }
      } else if (simulationMode) {
        prompt = `Act as a simulation guide. Guide the user through a real-world scenario related to: ${textToProcess}. Provide a step-by-step simulation in Markdown format, asking for user decisions at each step and providing feedback on their choices. For example, if the topic is project management, simulate managing a project budget.`;
      } else if (collaborationMode) {
        prompt = `Act as a collaboration facilitator. Suggest a group activity or networking opportunity related to: ${textToProcess}. Provide prompts to guide collaborative problem-solving in Markdown format. For example, suggest joining a study group or coding challenge and provide discussion prompts.`;
      } else {
        if (criticalThinkingMode) {
          prompt = `Act as a Socratic tutor. Instead of answering directly, ask probing questions to guide the user to the answer for: ${textToProcess}. Provide hints and encourage critical thinking in Markdown format.`;
        } else {
          prompt = `Respond in a ${adjustedTone} tone with a ${responseLength} response in Markdown format. ${textToProcess}`;
          if (factCheck) {
            prompt += ' Verify the information and provide sources if possible.';
          }
          if (showReasoning) {
            prompt = `Show your reasoning step-by-step before providing the final answer in Markdown format. ${prompt}`;
          }
          if (detailedMode) {
            prompt = `Provide a detailed and thorough response in Markdown format. ${prompt}`;
          }
        }
      }

      if (textToProcess.toLowerCase().includes('search for') && !auditMode && !codeMode && !simulationMode && !collaborationMode) {
        prompt = `Simulate a web search for: ${textToProcess} in Markdown format`;
      }

      if (aiLiteracyMode) {
        prompt = `${prompt}\n\nAfter providing the response, explain in simple terms how you arrived at this answer, including the steps you took and any limitations or biases I should be aware of. Also, provide a tip for using AI responsibly. Format this explanation in Markdown under a section titled 'How I Processed This Request'.`;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          input: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend request failed with status ${response.status}`);
      }

      const data = await response.json();
      let assistantContent = data.response;

      if (emotionDetection && detectedEmotion === 'frustrated') {
        assistantContent = `**I noticed you might be feeling frustrated. Let’s tackle this together!** Here’s my response:\n\n${assistantContent}\n\nWould you like to take a short break or try a different approach?`;
      }

      const assistantMessage = {
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toLocaleTimeString(),
        tone: adjustedTone,
        responseLength,
        language: (codeMode || auditMode) ? codeLanguage : null,
        isAudit: auditMode,
        isSimulation: simulationMode,
        isCollaboration: collaborationMode,
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (currentProject) {
        setProjects(prev => {
          const updated = [...prev];
          const project = updated.find(p => p.name === currentProject);
          if (project) {
            project.messages = [...project.messages, assistantMessage];
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Failed to process your request. Please try again later.', timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setLoading(false);
      setFileName('');
    }
  }, [messages, currentProject, tone, responseLength, factCheck, showReasoning, detailedMode, codeMode, auditMode, emotionDetection, criticalThinkingMode, offlineMode, simulationMode, aiLiteracyMode, collaborationMode, codeLanguage]);

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    try {
      let text;
      if (file.type === 'text/plain') {
        text = await file.text();
      } else if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        text = `Describe this image: [User uploaded an image named ${file.name}]`;
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: 'Unsupported file type. Please upload a .txt, .pdf, or image file.', timestamp: new Date().toLocaleTimeString() },
        ]);
        setFileName('');
        setLoading(false);
        return;
      }
      handleSubmit(text);
    } catch (error) {
      console.error('Error processing file:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Failed to process the file. Please try a different file.', timestamp: new Date().toLocaleTimeString() },
      ]);
      setFileName('');
    } finally {
      setLoading(false);
    }
  }, [handleSubmit]);

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  };

  const clearChat = () => {
    setMessages([]);
    if (currentProject) {
      setProjects(prev => {
        const updated = [...prev];
        const project = updated.find(p => p.name === currentProject);
        if (project) {
          project.messages = [];
        }
        return updated;
      });
    }
    localStorage.removeItem('chatMessages');
  };

  const resetContext = () => {
    setMessages([]);
    if (currentProject) {
      setProjects(prev => {
        const updated = [...prev];
        const project = updated.find(p => p.name === currentProject);
        if (project) {
          project.messages = [];
        }
        return updated;
      });
    }
  };

  const generateStudyGuide = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      handleSubmit(lastMessage.content, true);
    } else {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Please provide some notes to generate a study guide.', timestamp: new Date().toLocaleTimeString() },
      ]);
    }
  };

  const exportChat = () => {
    const chatData = currentProject
      ? projects.find(p => p.name === currentProject)?.messages || messages
      : messages;
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject || 'chat'}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const learnAboutAI = () => {
    const aiLiteracyMessage = `
## Learn About AI

### What is AI?
AI, or artificial intelligence, is when computers are designed to think and act like humans. I’m an AI chatbot, which means I can understand your questions and provide answers by processing lots of data.

### How Do I Work?
I use a large language model to understand and generate responses. When you ask a question, I break it down into parts, search my knowledge base, and create an answer that fits your request. I’m trained on a huge amount of text data, but I don’t have access to everything, and I can make mistakes.

### Ethical Tips for Using AI
- **Verify My Answers**: I might have biases or outdated information, so always double-check important facts.
- **Protect Your Privacy**: Don’t share sensitive personal information with me.
- **Use Me as a Tool**: I’m here to help you learn and grow, not to replace your own thinking.

Would you like to learn more about a specific AI topic?
    `;
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: aiLiteracyMessage, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleFeedback = (index, value) => {
    setFeedback(prev => ({
      ...prev,
      [index]: value,
    }));
  };

  const editResponse = (index, content) => {
    const newContent = prompt('Edit the response:', content);
    if (newContent) {
      handleSubmit(`Refine this response: ${newContent}`);
    }
  };

  const shareResponse = (index, content) => {
    const shareUrl = `https://access-ai-iota.vercel.app/share/${index}`;
    copyToClipboard(shareUrl);
    alert('Shareable link copied to clipboard!');
  };

  const downloadCode = (content, language) => {
    const extension = language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'solidity' ? 'sol' : 'txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addComment = (index, comment) => {
    setComments(prev => ({
      ...prev,
      [index]: [...(prev[index] || []), { text: comment, timestamp: new Date().toLocaleTimeString() }],
    }));
  };

  // Gamification and Learning Path Functions
  const startLearningPath = (language) => {
    setSelectedLanguage(language);
    setCurrentLesson(null);
    setChallengeInput('');
    setChallengeResult(null);
    setCodeLanguage(language);
    setCodeMode(true);
  };

  const startLesson = async (lesson) => {
    setCurrentLesson(lesson);
    setChallengeInput('');
    setChallengeResult(null);

    const prompt = `Provide a detailed lesson on "${lesson.title}" for ${selectedLanguage} in Markdown format. Include:
    - A brief introduction to the topic
    - Key concepts with examples
    - A coding challenge for the user to solve
    - An explanation of the solution
    If the language is Solidity, include blockchain-specific context (e.g., how this concept applies to smart contracts).`;
    
    await handleSubmit(prompt);
  };

  const submitChallenge = async () => {
    if (!challengeInput || !currentLesson) return;

    const prompt = `Evaluate the following ${selectedLanguage} code for the challenge in the lesson "${currentLesson.title}":
    \`\`\`${selectedLanguage}
    ${challengeInput}
    \`\`\`
    Provide feedback in Markdown format, including:
    - Whether the solution is correct
    - Any errors or improvements needed
    - If correct, award the user ${currentLesson.points} points and congratulate them
    If the language is Solidity, ensure the code follows smart contract best practices (e.g., security considerations).`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        input: prompt,
      }),
    });

    if (!response.ok) {
      setChallengeResult('Failed to evaluate your solution. Please try again.');
      return;
    }

    const data = await response.json();
    setChallengeResult(data.response);

    if (data.response.toLowerCase().includes('correct')) {
      setUserProgress(prev => {
        const newProgress = { ...prev };
        newProgress.points += currentLesson.points;
        newProgress.completedLessons[selectedLanguage] = newProgress.completedLessons[selectedLanguage] || [];
        newProgress.completedLessons[selectedLanguage].push(currentLesson.id);

        badges.forEach(badge => {
          if (newProgress.points >= badge.points && !newProgress.badges.includes(badge.name)) {
            newProgress.badges.push(badge.name);
            alert(`🎉 Congratulations! You've earned the "${badge.name}" badge: ${badge.description}`);
          }
        });

        return newProgress;
      });
    }
  };

  const getProgressPercentage = () => {
    if (!selectedLanguage) return 0;
    const totalLessons = learningPaths[selectedLanguage].length;
    const completed = userProgress.completedLessons[selectedLanguage]?.length || 0;
    return (completed / totalLessons) * 100;
  };

  return (
    <div className={`app-container ${theme}`}>
      {fullCodeView && (
        <div className="modal" role="dialog" aria-labelledby="full-code-view">
          <div className="modal-content">
            <button onClick={() => setFullCodeView(null)} className="modal-close" aria-label="Close full code view modal">
              ✕
            </button>
            <h2 id="full-code-view">Full Code View</h2>
            <SyntaxHighlighter
              style={theme === 'dark' ? vscDarkPlus : vscDarkPlus}
              language={fullCodeView.language}
              showLineNumbers
              wrapLines
            >
              {fullCodeView.content}
            </SyntaxHighlighter>
            <button
              onClick={() => downloadCode(fullCodeView.content, fullCodeView.language)}
              className="action-button"
              aria-label="Download code"
            >
              Download Code
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="hamburger" onClick={toggleSidebar} aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"} aria-expanded={sidebarOpen}>
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <h1 className="app-title">AccessAI - CodeQuest</h1>
        </div>
        <div className="header-right">
          <div className="user-stats">
            <span>Points: {userProgress.points}</span>
            <span>Badges: {userProgress.badges.length}</span>
          </div>
          <button onClick={toggleTheme} className="theme-toggle" aria-label={theme === 'light' ? "Switch to dark theme" : "Switch to light theme"}>
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </header>

      <div className="main-layout">
        {/* Sidebar */}
        <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-hidden={!sidebarOpen}>
          <div className="sidebar-section">
            <h2>Settings</h2>
            <div className="settings-bar">
              <label htmlFor="tone-select">Tone:</label>
              <select id="tone-select" value={tone} onChange={e => setTone(e.target.value)}>
                <option value="neutral">Neutral</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="humorous">Humorous</option>
                <option value="encouraging">Encouraging</option>
                <option value="celebratory">Celebratory</option>
              </select>
              <label htmlFor="response-length-select">Response Length:</label>
              <select id="response-length-select" value={responseLength} onChange={e => setResponseLength(e.target.value)}>
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
              <label>
                <input type="checkbox" checked={factCheck} onChange={e => setFactCheck(e.target.checked)} />
                Fact-Check
              </label>
              <label>
                <input type="checkbox" checked={showReasoning} onChange={e => setShowReasoning(e.target.checked)} />
                Show Reasoning
              </label>
              <label>
                <input type="checkbox" checked={detailedMode} onChange={e => setDetailedMode(e.target.checked)} />
                Detailed Mode
              </label>
              <label className={codeMode ? 'code-mode-active' : ''}>
                <input type="checkbox" checked={codeMode} onChange={e => setCodeMode(e.target.checked)} />
                Code Mode
              </label>
              <label className={auditMode ? 'audit-mode-active' : ''}>
                <input type="checkbox" checked={auditMode} onChange={e => setAuditMode(e.target.checked)} />
                Audit Mode
              </label>
              <label className={emotionDetection ? 'emotion-detection-active' : ''}>
                <input type="checkbox" checked={emotionDetection} onChange={e => setEmotionDetection(e.target.checked)} />
                Emotion Detection
              </label>
              <label className={criticalThinkingMode ? 'critical-thinking-active' : ''}>
                <input type="checkbox" checked={criticalThinkingMode} onChange={e => setCriticalThinkingMode(e.target.checked)} />
                Critical Thinking
              </label>
              <label className={offlineMode ? 'offline-mode-active' : ''}>
                <input type="checkbox" checked={offlineMode} onChange={e => setOfflineMode(e.target.checked)} />
                Offline Mode
              </label>
              <label className={simulationMode ? 'simulation-mode-active' : ''}>
                <input type="checkbox" checked={simulationMode} onChange={e => setSimulationMode(e.target.checked)} />
                Simulation Mode
              </label>
              <label className={aiLiteracyMode ? 'ai-literacy-active' : ''}>
                <input type="checkbox" checked={aiLiteracyMode} onChange={e => setAiLiteracyMode(e.target.checked)} />
                AI Literacy Mode
              </label>
              <label className={collaborationMode ? 'collaboration-mode-active' : ''}>
                <input type="checkbox" checked={collaborationMode} onChange={e => setCollaborationMode(e.target.checked)} />
                Collaboration Mode
              </label>
              {(codeMode || auditMode) && (
                <>
                  <label htmlFor="code-language-select">Code Language:</label>
                  <select id="code-language-select" value={codeLanguage} onChange={e => setCodeLanguage(e.target.value)}>
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="solidity">Solidity</option>
                  </select>
                </>
              )}
              <button onClick={generateStudyGuide} className="study-guide-button">
                Generate Study Guide
              </button>
            </div>
          </div>
          <div className="sidebar-section">
            <h2>Projects</h2>
            <div className="projects-bar">
              <label htmlFor="project-input">Project Name:</label>
              <input
                id="project-input"
                type="text"
                placeholder="Project Name"
                value={currentProject}
                onChange={e => setCurrentProject(e.target.value)}
                className="project-input"
              />
              <div className="project-list">
                {projects.map(project => (
                  <button
                    key={project.name}
                    onClick={() => {
                      setCurrentProject(project.name);
                      setMessages(project.messages);
                    }}
                    className={currentProject === project.name ? 'active' : ''}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="sidebar-section">
            <button onClick={clearChat} className="sidebar-button" aria-label="Clear chat">
              Clear Chat
            </button>
            <button onClick={resetContext} className="sidebar-button" aria-label="Reset context">
              Reset Context
            </button>
            <button onClick={exportChat} className="sidebar-button" aria-label="Export chat">
              Export Chat
            </button>
            <button onClick={learnAboutAI} className="sidebar-button" aria-label="Learn about AI">
              Learn About AI
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Gamification Bar */}
          <div className="gamification-bar">
            {selectedLanguage && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
                <span>{`Progress: ${Math.round(getProgressPercentage())}%`}</span>
              </div>
            )}
            <div className="leaderboard">
              <h2>Leaderboard</h2>
              <ul>
                {leaderboardData.map((entry, index) => (
                  <li key={index}>{`${entry.username}: ${entry.points} points`}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Language Selection and Learning Path */}
          {!selectedLanguage ? (
            <div className="language-selection">
              <h2>Select a Programming Language to Start Your Journey!</h2>
              <div className="language-options">
                {Object.keys(learningPaths).map(lang => (
                  <button
                    key={lang}
                    onClick={() => startLearningPath(lang)}
                    className="language-button"
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="learning-path">
              <h2>{`${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} Learning Path`}</h2>
              <button onClick={() => setSelectedLanguage('')} className="back-button">
                Back to Language Selection
              </button>
              <div className="lessons-list">
                {learningPaths[selectedLanguage].map(lesson => (
                  <div
                    key={lesson.id}
                    className={`lesson-card ${
                      userProgress.completedLessons[selectedLanguage]?.includes(lesson.id) ? 'completed' : ''
                    }`}
                  >
                    <h3>{lesson.title}</h3>
                    <p>Difficulty: {lesson.difficulty}</p>
                    <p>Points: {lesson.points}</p>
                    <button
                      onClick={() => startLesson(lesson)}
                      disabled={currentLesson?.id === lesson.id}
                    >
                      {currentLesson?.id === lesson.id ? 'In Progress' : 'Start Lesson'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coding Challenge Section */}
          {currentLesson && (
            <div className="challenge-section">
              <h2>{`Challenge: ${currentLesson.title}`}</h2>
              <label htmlFor="code-editor">Write your code below:</label>
              <textarea
                id="code-editor"
                value={challengeInput}
                onChange={e => setChallengeInput(e.target.value)}
                placeholder="Write your code here..."
                className="code-editor"
                rows={10}
              />
              <button onClick={submitChallenge} className="submit-challenge">
                Submit Solution
              </button>
              {challengeResult && (
                <div className="challenge-result">
                  <ReactMarkdown>{challengeResult}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

          {/* Chat Interface */}
          <div className="chat-container">
            <div className="messages">
              {(currentProject ? projects.find(p => p.name === currentProject)?.messages || messages : messages).map((msg, index) => (
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
                                    style={theme === 'dark' ? vscDarkPlus : vscDarkPlus}
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
                                onClick={() => setFullCodeView({ content: msg.content, language: msg.language })}
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
                            onKeyPress={(e) => {
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
              <label htmlFor="chat-input">Type your message:</label>
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSubmit(input)}
                className="chat-input"
                placeholder="Type your message or paste code..."
                disabled={loading}
                aria-label="Chat input"
              />
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