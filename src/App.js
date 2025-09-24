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