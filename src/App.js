import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './App.css';

// Set PDF.js worker source for PDF processing
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

// Backend API URL from environment variable or default
const API_URL = process.env.REACT_APP_API_URL || 'https://accessai-onh4.onrender.com/chat';

// Learning paths for each programming language - updated to nested structure with chapters
const learningPaths = {
  javascript: {
    chapters: [
      {
        title: 'JavaScript Fundamentals',
        lessons: [
          { id: 1, title: 'Introduction to JavaScript and its role in web development', difficulty: 'Beginner', points: 50 },
          { id: 2, title: 'Setting up development environment (Node.js, browser console)', difficulty: 'Beginner', points: 50 },
          { id: 3, title: 'Variables (var, let, const) and data types', difficulty: 'Beginner', points: 50 },
          { id: 4, title: 'Operators and expressions', difficulty: 'Beginner', points: 50 },
          { id: 5, title: 'Basic input/output', difficulty: 'Beginner', points: 50 },
        ],
      },
      {
        title: 'Control Flow and Functions',
        lessons: [
          { id: 6, title: 'Conditional statements (if/else, switch)', difficulty: 'Beginner', points: 75 },
          { id: 7, title: 'Looping structures (for, while, do-while)', difficulty: 'Beginner', points: 75 },
          { id: 8, title: 'Functions declaration and expression', difficulty: 'Beginner', points: 75 },
          { id: 9, title: 'Function parameters and return values', difficulty: 'Beginner', points: 75 },
          { id: 10, title: 'Scope and hoisting', difficulty: 'Beginner', points: 75 },
        ],
      },
      {
        title: 'Arrays and Objects',
        lessons: [
          { id: 11, title: 'Array creation and manipulation', difficulty: 'Intermediate', points: 100 },
          { id: 12, title: 'Array methods (mutating and non-mutating)', difficulty: 'Intermediate', points: 100 },
          { id: 13, title: 'Object literals and properties', difficulty: 'Intermediate', points: 100 },
          { id: 14, title: 'Object methods and `this` keyword', difficulty: 'Intermediate', points: 100 },
          { id: 15, title: 'Object manipulation techniques', difficulty: 'Intermediate', points: 100 },
        ],
      },
      {
        title: 'Advanced JavaScript Concepts',
        lessons: [
          { id: 16, title: 'Closures and lexical scoping', difficulty: 'Intermediate', points: 150 },
          { id: 17, title: 'Prototypes and inheritance', difficulty: 'Intermediate', points: 150 },
          { id: 18, title: 'Asynchronous JavaScript (callbacks, promises, async/await)', difficulty: 'Intermediate', points: 150 },
          { id: 19, title: 'Error handling (try/catch/finally)', difficulty: 'Intermediate', points: 150 },
          { id: 20, title: 'ES6+ features (destructuring, spread/rest, template literals)', difficulty: 'Intermediate', points: 150 },
        ],
      },
      {
        title: 'Modern JavaScript and Browser APIs',
        lessons: [
          { id: 21, title: 'DOM manipulation and events', difficulty: 'Advanced', points: 200 },
          { id: 22, title: 'Fetch API and AJAX', difficulty: 'Advanced', points: 200 },
          { id: 23, title: 'Modern array methods (map, filter, reduce)', difficulty: 'Advanced', points: 200 },
          { id: 24, title: 'Modules (import/export)', difficulty: 'Advanced', points: 200 },
          { id: 25, title: 'Web Storage API', difficulty: 'Advanced', points: 200 },
        ],
      },
      {
        title: 'Testing and Tooling',
        lessons: [
          { id: 26, title: 'Debugging techniques', difficulty: 'Advanced', points: 200 },
          { id: 27, title: 'Unit testing with Jest', difficulty: 'Advanced', points: 200 },
          { id: 28, title: 'Package management with npm', difficulty: 'Advanced', points: 200 },
          { id: 29, title: 'Build tools (Webpack, Babel)', difficulty: 'Advanced', points: 200 },
          { id: 30, title: 'Code quality tools (ESLint, Prettier)', difficulty: 'Advanced', points: 200 },
        ],
      },
    ],
  },
  // Similarly for python, java, cpp, solidity - filling based on provided structure
  python: {
    chapters: [
      {
        title: 'Python Basics',
        lessons: [
          { id: 1, title: 'Introduction to Python and its applications', difficulty: 'Beginner', points: 50 },
          { id: 2, title: 'Setting up Python environment', difficulty: 'Beginner', points: 50 },
          { id: 3, title: 'Variables, data types, and basic operations', difficulty: 'Beginner', points: 50 },
          { id: 4, title: 'Input/output operations', difficulty: 'Beginner', points: 50 },
          { id: 5, title: 'Comments and documentation', difficulty: 'Beginner', points: 50 },
        ],
      },
      {
        title: 'Control Structures and Functions',
        lessons: [
          { id: 6, title: 'Conditional statements', difficulty: 'Beginner', points: 75 },
          { id: 7, title: 'Looping constructs', difficulty: 'Beginner', points: 75 },
          { id: 8, title: 'Function definition and invocation', difficulty: 'Beginner', points: 75 },
          { id: 9, title: 'Function arguments and return values', difficulty: 'Beginner', points: 75 },
          { id: 10, title: 'Lambda functions', difficulty: 'Beginner', points: 75 },
        ],
      },
      {
        title: 'Data Structures',
        lessons: [
          { id: 11, title: 'Lists and list comprehensions', difficulty: 'Intermediate', points: 100 },
          { id: 12, title: 'Tuples and sets', difficulty: 'Intermediate', points: 100 },
          { id: 13, title: 'Dictionaries and dictionary comprehensions', difficulty: 'Intermediate', points: 100 },
          { id: 14, title: 'Strings and string manipulation', difficulty: 'Intermediate', points: 100 },
          { id: 15, title: 'Common operations on data structures', difficulty: 'Intermediate', points: 100 },
        ],
      },
      {
        title: 'Object-Oriented Programming',
        lessons: [
          { id: 16, title: 'Classes and objects', difficulty: 'Intermediate', points: 150 },
          { id: 17, title: 'Inheritance and polymorphism', difficulty: 'Intermediate', points: 150 },
          { id: 18, title: 'Encapsulation and abstraction', difficulty: 'Intermediate', points: 150 },
          { id: 19, title: 'Special methods (__init__, __str__, etc.)', difficulty: 'Intermediate', points: 150 },
          { id: 20, title: 'Exception handling', difficulty: 'Intermediate', points: 150 },
        ],
      },
      {
        title: 'Advanced Python Concepts',
        lessons: [
          { id: 21, title: 'Modules and packages', difficulty: 'Advanced', points: 200 },
          { id: 22, title: 'File handling', difficulty: 'Advanced', points: 200 },
          { id: 23, title: 'Decorators and generators', difficulty: 'Advanced', points: 200 },
          { id: 24, title: 'Context managers', difficulty: 'Advanced', points: 200 },
          { id: 25, title: 'Regular expressions', difficulty: 'Advanced', points: 200 },
        ],
      },
      {
        title: 'Python Ecosystem',
        lessons: [
          { id: 26, title: 'Virtual environments', difficulty: 'Advanced', points: 200 },
          { id: 27, title: 'Package management with pip', difficulty: 'Advanced', points: 200 },
          { id: 28, title: 'Popular libraries (NumPy, Pandas, Requests)', difficulty: 'Advanced', points: 200 },
          { id: 29, title: 'Web frameworks introduction (Flask, Django)', difficulty: 'Advanced', points: 200 },
          { id: 30, title: 'Testing with unittest/pytest', difficulty: 'Advanced', points: 200 },
        ],
      },
    ],
  },
  java: {
    chapters: [
      // Fill similarly from provided structure
      {
        title: 'Java Fundamentals',
        lessons: [
          { id: 1, title: 'Introduction to Java and JVM', difficulty: 'Beginner', points: 50 },
          { id: 2, title: 'Setting up Java development environment', difficulty: 'Beginner', points: 50 },
          { id: 3, title: 'Basic syntax and program structure', difficulty: 'Beginner', points: 50 },
          { id: 4, title: 'Variables, data types, and operators', difficulty: 'Beginner', points: 50 },
          { id: 5, title: 'Basic input/output', difficulty: 'Beginner', points: 50 },
        ],
      },
      {
        title: 'Control Flow and Methods',
        lessons: [
          { id: 6, title: 'Conditional statements', difficulty: 'Beginner', points: 75 },
          { id: 7, title: 'Looping constructs', difficulty: 'Beginner', points: 75 },
          { id: 8, title: 'Method declaration and invocation', difficulty: 'Beginner', points: 75 },
          { id: 9, title: 'Method overloading', difficulty: 'Beginner', points: 75 },
          { id: 10, title: 'Command-line arguments', difficulty: 'Beginner', points: 75 },
        ],
      },
      {
        title: 'Object-Oriented Programming',
        lessons: [
          { id: 11, title: 'Classes and objects', difficulty: 'Intermediate', points: 100 },
          { id: 12, title: 'Constructors', difficulty: 'Intermediate', points: 100 },
          { id: 13, title: 'Inheritance and polymorphism', difficulty: 'Intermediate', points: 100 },
          { id: 14, title: 'Interfaces and abstract classes', difficulty: 'Intermediate', points: 100 },
          { id: 15, title: 'Packages and access modifiers', difficulty: 'Intermediate', points: 100 },
        ],
      },
      {
        title: 'Java Collections Framework',
        lessons: [
          { id: 16, title: 'List implementations (ArrayList, LinkedList)', difficulty: 'Intermediate', points: 150 },
          { id: 17, title: 'Set implementations (HashSet, TreeSet)', difficulty: 'Intermediate', points: 150 },
          { id: 18, title: 'Map implementations (HashMap, TreeMap)', difficulty: 'Intermediate', points: 150 },
          { id: 19, title: 'Iterators and comparators', difficulty: 'Intermediate', points: 150 },
          { id: 20, title: 'Collections utility class', difficulty: 'Intermediate', points: 150 },
        ],
      },
      {
        title: 'Exception Handling and I/O',
        lessons: [
          { id: 21, title: 'Exception hierarchy', difficulty: 'Advanced', points: 200 },
          { id: 22, title: 'Try-catch-finally blocks', difficulty: 'Advanced', points: 200 },
          { id: 23, title: 'Custom exceptions', difficulty: 'Advanced', points: 200 },
          { id: 24, title: 'File I/O operations', difficulty: 'Advanced', points: 200 },
          { id: 25, title: 'Serialization', difficulty: 'Advanced', points: 200 },
        ],
      },
      {
        title: 'Advanced Java Concepts',
        lessons: [
          { id: 26, title: 'Multithreading', difficulty: 'Advanced', points: 200 },
          { id: 27, title: 'Generics', difficulty: 'Advanced', points: 200 },
          { id: 28, title: 'Annotations', difficulty: 'Advanced', points: 200 },
          { id: 29, title: 'Lambda expressions and functional interfaces', difficulty: 'Advanced', points: 200 },
          { id: 30, title: 'Java modules system', difficulty: 'Advanced', points: 200 },
        ],
      },
    ],
  },
  cpp: {
    chapters: [
      {
        title: 'C++ Fundamentals',
        lessons: [
          { id: 1, title: 'Introduction to C++ and its features', difficulty: 'Beginner', points: 50 },
          { id: 2, title: 'Setting up development environment', difficulty: 'Beginner', points: 50 },
          { id: 3, title: 'Basic syntax and program structure', difficulty: 'Beginner', points: 50 },
          { id: 4, title: 'Variables, data types, and operators', difficulty: 'Beginner', points: 50 },
          { id: 5, title: 'Basic input/output with iostream', difficulty: 'Beginner', points: 50 },
        ],
      },
      {
        title: 'Control Flow and Functions',
        lessons: [
          { id: 6, title: 'Conditional statements', difficulty: 'Beginner', points: 75 },
          { id: 7, title: 'Looping constructs', difficulty: 'Beginner', points: 75 },
          { id: 8, title: 'Function declaration and definition', difficulty: 'Beginner', points: 75 },
          { id: 9, title: 'Function overloading', difficulty: 'Beginner', points: 75 },
          { id: 10, title: 'References and pointers', difficulty: 'Beginner', points: 75 },
        ],
      },
      {
        title: 'Object-Oriented Programming',
        lessons: [
          { id: 11, title: 'Classes and objects', difficulty: 'Intermediate', points: 100 },
          { id: 12, title: 'Constructors and destructors', difficulty: 'Intermediate', points: 100 },
          { id: 13, title: 'Inheritance and polymorphism', difficulty: 'Intermediate', points: 100 },
          { id: 14, title: 'Operator overloading', difficulty: 'Intermediate', points: 100 },
          { id: 15, title: 'Templates and generic programming', difficulty: 'Intermediate', points: 100 },
        ],
      },
      {
        title: 'Memory Management',
        lessons: [
          { id: 16, title: 'Stack vs heap memory', difficulty: 'Intermediate', points: 150 },
          { id: 17, title: 'Dynamic memory allocation', difficulty: 'Intermediate', points: 150 },
          { id: 18, title: 'Smart pointers', difficulty: 'Intermediate', points: 150 },
          { id: 19, title: 'Memory leaks and debugging', difficulty: 'Intermediate', points: 150 },
          { id: 20, title: 'RAII principle', difficulty: 'Intermediate', points: 150 },
        ],
      },
      {
        title: 'Standard Template Library (STL)',
        lessons: [
          { id: 21, title: 'Containers (vector, list, map, etc.)', difficulty: 'Advanced', points: 200 },
          { id: 22, title: 'Iterators', difficulty: 'Advanced', points: 200 },
          { id: 23, title: 'Algorithms', difficulty: 'Advanced', points: 200 },
          { id: 24, title: 'Function objects', difficulty: 'Advanced', points: 200 },
          { id: 25, title: 'STL utilities', difficulty: 'Advanced', points: 200 },
        ],
      },
      {
        title: 'Advanced C++ Concepts',
        lessons: [
          { id: 26, title: 'Exception handling', difficulty: 'Advanced', points: 200 },
          { id: 27, title: 'File I/O operations', difficulty: 'Advanced', points: 200 },
          { id: 28, title: 'Multithreading', difficulty: 'Advanced', points: 200 },
          { id: 29, title: 'Move semantics', difficulty: 'Advanced', points: 200 },
          { id: 30, title: 'Modern C++ features (C++11/14/17/20)', difficulty: 'Advanced', points: 200 },
        ],
      },
    ],
  },
  solidity: {
    chapters: [
      {
        title: 'Blockchain and Ethereum Basics',
        lessons: [
          { id: 1, title: 'Introduction to blockchain technology', difficulty: 'Beginner', points: 50 },
          { id: 2, title: 'Understanding Ethereum and smart contracts', difficulty: 'Beginner', points: 50 },
          { id: 3, title: 'Setting up development environment (Remix, Truffle)', difficulty: 'Beginner', points: 50 },
          { id: 4, title: 'Ethereum accounts and transactions', difficulty: 'Beginner', points: 50 },
          { id: 5, title: 'Gas and transaction costs', difficulty: 'Beginner', points: 50 },
        ],
      },
      {
        title: 'Solidity Fundamentals',
        lessons: [
          { id: 6, title: 'Basic syntax and structure of smart contracts', difficulty: 'Beginner', points: 75 },
          { id: 7, title: 'Data types and variables', difficulty: 'Beginner', points: 75 },
          { id: 8, title: 'Functions and modifiers', difficulty: 'Beginner', points: 75 },
          { id: 9, title: 'Events and logging', difficulty: 'Beginner', points: 75 },
          { id: 10, title: 'Error handling (require, revert, assert)', difficulty: 'Beginner', points: 75 },
        ],
      },
      {
        title: 'Advanced Solidity Concepts',
        lessons: [
          { id: 11, title: 'Inheritance and interfaces', difficulty: 'Intermediate', points: 100 },
          { id: 12, title: 'Libraries and imports', difficulty: 'Intermediate', points: 100 },
          { id: 13, title: 'Memory vs storage', difficulty: 'Intermediate', points: 100 },
          { id: 14, title: 'Function visibility and modifiers', difficulty: 'Intermediate', points: 100 },
          { id: 15, title: 'Contract interactions', difficulty: 'Intermediate', points: 100 },
        ],
      },
      {
        title: 'Security Considerations',
        lessons: [
          { id: 16, title: 'Common vulnerabilities (reentrancy, overflow)', difficulty: 'Intermediate', points: 150 },
          { id: 17, title: 'Security best practices', difficulty: 'Intermediate', points: 150 },
          { id: 18, title: 'Testing strategies', difficulty: 'Intermediate', points: 150 },
          { id: 19, title: 'Audit processes', difficulty: 'Intermediate', points: 150 },
          { id: 20, title: 'Upgrade patterns', difficulty: 'Intermediate', points: 150 },
        ],
      },
      {
        title: 'Decentralized Application Development',
        lessons: [
          { id: 21, title: 'Web3.js and Ethers.js integration', difficulty: 'Advanced', points: 200 },
          { id: 22, title: 'Frontend development for dApps', difficulty: 'Advanced', points: 200 },
          { id: 23, title: 'IPFS integration', difficulty: 'Advanced', points: 200 },
          { id: 24, title: 'Oracles and external data', difficulty: 'Advanced', points: 200 },
          { id: 25, title: 'Token standards (ERC-20, ERC-721)', difficulty: 'Advanced', points: 200 },
        ],
      },
      {
        title: 'Deployment and Maintenance',
        lessons: [
          { id: 26, title: 'Testnet deployment', difficulty: 'Advanced', points: 200 },
          { id: 27, title: 'Mainnet deployment', difficulty: 'Advanced', points: 200 },
          { id: 28, title: 'Monitoring and analytics', difficulty: 'Advanced', points: 200 },
          { id: 29, title: 'Upgrade mechanisms', difficulty: 'Advanced', points: 200 },
          { id: 30, title: 'Governance models', difficulty: 'Advanced', points: 200 },
        ],
      },
    ],
  },
};

// Badges for gamification milestones
const badges = [
  { name: 'Beginner Coder', points: 100, description: 'Completed your first lesson!' },
  { name: 'Challenge Champion', points: 300, description: 'Solved 3 coding challenges!' },
  { name: 'Solidity Starter', points: 200, description: 'Completed a Solidity lesson!' },
  { name: 'Master Coder', points: 500, description: 'Earned 500 points!' },
];

function App({ user, setUser }) {
  // Existing states
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem('chatProjects');
    return savedProjects ? JSON.parse(savedProjects) : [];
  });
  const [currentProject, setCurrentProject] = useState('');
  const [newProjectName, setNewProjectName] = useState(''); // For creating/renaming
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
  const [credits, setCredits] = useState(() => {
    const savedCredits = localStorage.getItem('credits');
    return savedCredits ? parseInt(savedCredits) : 5;
  });
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [userProgress, setUserProgress] = useState({
    points: 0,
    completedLessons: {},
    badges: [],
  });
  const [currentLesson, setCurrentLesson] = useState(null);
  const [challengeInput, setChallengeInput] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);
  const [autoTts, setAutoTts] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);

  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const recognitionRef = useRef(null);
  const speechSynth = useRef(window.speechSynthesis);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save messages and projects to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    localStorage.setItem('chatProjects', JSON.stringify(projects));
    localStorage.setItem('credits', credits);
  }, [messages, projects, credits]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('https://accessai-onh4.onrender.com/leaderboard');
        setLeaderboardData(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };
    fetchLeaderboard();
  }, []);

  // Handle sidebar toggle
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Close sidebar on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    let fileContent = '';
    if (file.type === 'application/pdf') {
      const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        fileContent += textContent.items.map(item => item.str).join(' ');
      }
    } else if (file.type.startsWith('image/')) {
      fileContent = `[Image uploaded: ${file.name}. Describe or analyze as needed.]`;
    } else {
      fileContent = await file.text();
    }

    handleSubmit(fileContent, true);
  };

  // Handle chat submit
  const handleSubmit = async (userInput, isFile = false) => {
    if (!userInput.trim() && !isFile) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: userInput, timestamp: new Date().toLocaleTimeString() },
    ];
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
      const botMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toLocaleTimeString(),
        tone,
        responseLength,
        language: codeMode ? codeLanguage : undefined,
        isAudit: auditMode,
        isSimulation: simulationMode,
        isCollaboration: collaborationMode,
      };
      setMessages(prev => [...prev, botMessage]);
      setCredits(response.data.credits);

      if (autoTts) {
        speakText(response.data.response);
      }

      if (currentProject) {
        setProjects(prev => prev.map(p =>
          p.name === currentProject ? { ...p, messages: [...p.messages, botMessage] } : p
        ));
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error: Failed to get response.', timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Speech recognition setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
      };
      recognitionRef.current.onerror = (event) => {
        setSpeechError(`Speech recognition error: ${event.error}`);
      };
      recognitionRef.current.onend = () => setIsRecording(false);
    } else {
      setSpeechSupported(false);
      setSpeechError('Speech recognition not supported in this browser.');
    }

    if (!speechSynth.current) {
      setTtsSupported(false);
    }
  }, []);

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsRecording(prev => !prev);
  };

  // Speak text
  const speakText = (text) => {
    if (ttsSupported) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynth.current.speak(utterance);
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    if (currentProject) {
      setProjects(prev => prev.map(p =>
        p.name === currentProject ? { ...p, messages: [] } : p
      ));
    }
  };

  // Reset context
  const resetContext = () => {
    setMessages([{ role: 'assistant', content: 'Context reset. How can I help?', timestamp: new Date().toLocaleTimeString() }]);
  };

  // Generate study guide
  const generateStudyGuide = async () => {
    const notes = messages.filter(msg => msg.role === 'user').map(msg => msg.content).join('\n');
    if (!notes) {
      return setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Please provide some notes to generate a study guide.', timestamp: new Date().toLocaleTimeString() },
      ]);
    }
    await handleSubmit(`Generate a study guide based on these notes: ${notes}`);
  };

  // Export chat
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

  // Learn about AI
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

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  // Handle feedback
  const handleFeedback = (index, value) => {
    setFeedback(prev => ({
      ...prev,
      [index]: value,
    }));
  };

  // Edit response
  const editResponse = (index, content) => {
    const newContent = prompt('Edit the response:', content);
    if (newContent) {
      handleSubmit(`Refine this response: ${newContent}`);
    }
  };

  // Share response
  const shareResponse = (index, content) => {
    const shareUrl = `https://access-ai-iota.vercel.app/share/${index}`;
    copyToClipboard(shareUrl);
    alert('Shareable link copied to clipboard!');
  };

  // Download code
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

  // Add comment
  const addComment = (index, comment) => {
    setComments(prev => ({
      ...prev,
      [index]: [...(prev[index] || []), { text: comment, timestamp: new Date().toLocaleTimeString() }],
    }));
  };

  // Create new project
  const createProject = () => {
    if (!newProjectName.trim()) return alert('Enter a project name');
    if (projects.some(p => p.name === newProjectName)) return alert('Project name already exists');
    setProjects(prev => [...prev, { name: newProjectName, messages: [] }]);
    setCurrentProject(newProjectName);
    setNewProjectName('');
  };

  // Rename project
  const renameProject = (oldName) => {
    const newName = prompt('New project name:', oldName);
    if (newName && newName !== oldName && !projects.some(p => p.name === newName)) {
      setProjects(prev => prev.map(p => p.name === oldName ? { ...p, name: newName } : p));
      if (currentProject === oldName) setCurrentProject(newName);
    }
  };

  // Start learning path - navigate to separate page
  const startLearningPath = (language) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    navigate(`/learn/${language}`);
  };

  // Start lesson - moved to LearningPath.js

  // Submit challenge - moved to LearningPath.js

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!selectedLanguage) return 0;
    const path = learningPaths[selectedLanguage];
    const totalLessons = path.chapters.reduce((sum, chap) => sum + chap.lessons.length, 0);
    const completed = userProgress.completedLessons[selectedLanguage]?.length || 0;
    return (completed / totalLessons) * 100;
  };

  return (
    <div className={`app-container ${theme}`}>
      {/* Full code view modal */}
      {fullCodeView && (
        <div className="modal" role="dialog" aria-labelledby="full-code-view">
          <div className="modal-content">
            <button
              onClick={() => setFullCodeView(null)}
              className="modal-close"
              aria-label="Close full code view modal"
            >
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
          <button
            className="hamburger"
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <h1 className="app-title">AccessAI - CodeQuest</h1>
        </div>
        <div className="header-right">
          <div className="user-stats">
            <span>Points: {user ? user.points : userProgress.points}</span>
            <span>Badges: {userProgress.badges.length}</span>
            {!user && <span>Credits: {credits}</span>}
          </div>
          {user ? (
            <>
              <span className="text-gray-700 dark:text-gray-300 mr-4">{user.email}</span>
              <button onClick={handleLogout} className="theme-toggle" aria-label="Logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="theme-toggle mr-2"
                aria-label="Login"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="theme-toggle"
                aria-label="Sign Up"
              >
                Sign Up
              </button>
            </>
          )}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </header>

      <div className="main-layout container">
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
              <select
                id="response-length-select"
                value={responseLength}
                onChange={e => setResponseLength(e.target.value)}
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
              <label>
                <input
                  type="checkbox"
                  checked={factCheck}
                  onChange={e => setFactCheck(e.target.checked)}
                />
                Fact-Check
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showReasoning}
                  onChange={e => setShowReasoning(e.target.checked)}
                />
                Show Reasoning
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={detailedMode}
                  onChange={e => setDetailedMode(e.target.checked)}
                />
                Detailed Mode
              </label>
              <label className={codeMode ? 'code-mode-active' : ''}>
                <input
                  type="checkbox"
                  checked={codeMode}
                  onChange={e => setCodeMode(e.target.checked)}
                />
                Code Mode
              </label>
              <label className={auditMode ? 'audit-mode-active' : ''}>
                <input
                  type="checkbox"
                  checked={auditMode}
                  onChange={e => setAuditMode(e.target.checked)}
                />
                Audit Mode
              </label>
              <label className={emotionDetection ? 'emotion-detection-active' : ''}>
                <input
                  type="checkbox"
                  checked={emotionDetection}
                  onChange={e => setEmotionDetection(e.target.checked)}
                />
                Emotion Detection
              </label>
              <label className={criticalThinkingMode ? 'critical-thinking-active' : ''}>
                <input
                  type="checkbox"
                  checked={criticalThinkingMode}
                  onChange={e => setCriticalThinkingMode(e.target.checked)}
                />
                Critical Thinking
              </label>
              <label className={offlineMode ? 'offline-mode-active' : ''}>
                <input
                  type="checkbox"
                  checked={offlineMode}
                  onChange={e => setOfflineMode(e.target.checked)}
                />
                Offline Mode
              </label>
              <label className={simulationMode ? 'simulation-mode-active' : ''}>
                <input
                  type="checkbox"
                  checked={simulationMode}
                  onChange={e => setSimulationMode(e.target.checked)}
                />
                Simulation Mode
              </label>
              <label className={aiLiteracyMode ? 'ai-literacy-active' : ''}>
                <input
                  type="checkbox"
                  checked={aiLiteracyMode}
                  onChange={e => setAiLiteracyMode(e.target.checked)}
                />
                AI Literacy Mode
              </label>
              <label className={collaborationMode ? 'collaboration-mode-active' : ''}>
                <input
                  type="checkbox"
                  checked={collaborationMode}
                  onChange={e => setCollaborationMode(e.target.checked)}
                />
                Collaboration Mode
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={autoTts}
                  onChange={e => setAutoTts(e.target.checked)}
                />
                Auto Text-to-Speech
              </label>
              {(codeMode || auditMode) && (
                <>
                  <label htmlFor="code-language-select">Code Language:</label>
                  <select
                    id="code-language-select"
                    value={codeLanguage}
                    onChange={e => setCodeLanguage(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="solidity">Solidity</option>
                  </select>
                </>
              )}
              <button onClick={generateStudyGuide} className="sidebar-button">
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
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                className="project-input"
              />
              <button onClick={createProject} className="sidebar-button">Create Project</button>
              <div className="project-list">
                {projects.map(project => (
                  <div key={project.name} style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => {
                        setCurrentProject(project.name);
                        setMessages(project.messages);
                      }}
                      className={currentProject === project.name ? 'active' : ''}
                    >
                      {project.name}
                    </button>
                    <button onClick={() => renameProject(project.name)} className="action-button">Rename</button>
                  </div>
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

          {/* Language Selection */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{`${selectedLanguage.charAt(0).toUpperCase() + selectedLanguage.slice(1)} Learning Path`}</h2>
                <button
                  onClick={() => setSelectedLanguage('')}
                  className="back-button"
                >
                  Back to Language Selection
                </button>
              </div>
              <div className="lessons-list">
                {learningPaths[selectedLanguage].chapters[0].lessons.map(lesson => ( // Note: Flat list for App.js, but nested in LearningPath
                  <div
                    key={lesson.id}
                    className={`lesson-card ${userProgress.completedLessons[selectedLanguage]?.includes(lesson.id) ? 'completed' : ''}`}
                  >
                    <h3>{lesson.title}</h3>
                    <p>Difficulty: {lesson.difficulty}</p>
                    <p>Points: {lesson.points}</p>
                    <button
                      onClick={() => startLearningPath(lesson)} // Updated to navigate
                      disabled={currentLesson?.id === lesson.id}
                    >
                      {currentLesson?.id === lesson.id ? 'In Progress' : 'Start Lesson'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Login Prompt */}
          {showLoginPrompt && (
            <div style={{ padding: '1.5rem', backgroundColor: theme === 'light' ? '#fff3cd' : '#8a6d3b', borderRadius: '0.375rem', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: theme === 'light' ? '#856404' : '#ffeeba', marginBottom: '1rem' }}>
                Please Sign Up or Log In
              </h2>
              <p style={{ color: theme === 'light' ? '#856404' : '#ffeeba', marginBottom: '1rem' }}>
                You need to be logged in to start lessons and earn points.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{ backgroundColor: '#007bff', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  style={{ backgroundColor: '#28a745', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {/* Challenge Section - kept for compatibility, but main challenge in LearningPath */}
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