// my-chatbot/src/LearningPath.js

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';
import './App.css'; // Reuse styles from App.css

const API_URL = process.env.REACT_APP_API_URL || 'https://accessai-onh4.onrender.com';

// Learning paths data
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

function LearningPath({ user }) {
  const { language } = useParams();
  const navigate = useNavigate();
  const [theme] = useState(localStorage.getItem('accessai-theme') || 'light'); // Sync with app theme
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(null);
  const [lessonContent, setLessonContent] = useState('');
  const [learningMessages, setLearningMessages] = useState([]);
  const [askInput, setAskInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProgress, setUserProgress] = useState({
    completedLessons: {},
  });
  const sidebarRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [learningMessages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  if (!learningPaths[language]) {
    navigate('/');
    return null;
  }

  const path = learningPaths[language];

  // Toggle chapter expansion
  const toggleChapter = (index) => {
    setExpandedChapters(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Start lesson
  const startLesson = async (chapterIndex, lessonIndex) => {
    const lesson = path.chapters[chapterIndex].lessons[lessonIndex];
    setCurrentChapterIndex(chapterIndex);
    setCurrentLessonIndex(lessonIndex);
    setLoading(true);

    const prompt = `Provide a detailed lesson on "${lesson.title}" for ${language} in Markdown format. Include:
    - A brief introduction to the topic
    - Key concepts with examples
    - A coding challenge or quiz for the user to solve
    - An explanation of the solution
    If the language is Solidity, include blockchain-specific context.`;

    try {
      const response = await axios.post(API_URL, {
        messages: [],
        input: prompt,
      }, {
        headers: { Authorization: user ? `Bearer ${user.token}` : '' },
      });
      setLessonContent(response.data.response);
    } catch (error) {
      setLessonContent('Error loading lesson content.');
    } finally {
      setLoading(false);
    }
  };

  // Handle ask AI submit
  const handleAskSubmit = async () => {
    if (!askInput.trim()) return;

    const newMessages = [
      ...learningMessages,
      { role: 'user', content: askInput, timestamp: new Date().toLocaleTimeString() },
    ];
    setLearningMessages(newMessages);
    setAskInput('');
    setLoading(true);

    const enhancedPrompt = `${askInput}. Remember, if asking for direct solution to challenge, encourage trying first.`;

    try {
      const response = await axios.post(API_URL, {
        messages: newMessages,
        input: enhancedPrompt,
      }, {
        headers: { Authorization: user ? `Bearer ${user.token}` : '' },
      });
      const botMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toLocaleTimeString(),
      };
      setLearningMessages(prev => [...prev, botMessage]);
    } catch (error) {
      setLearningMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error: Failed to get response.', timestamp: new Date().toLocaleTimeString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Mark lesson complete
  const markComplete = (chapterIndex, lessonIndex) => {
    const lesson = path.chapters[chapterIndex].lessons[lessonIndex];
    setUserProgress(prev => {
      const completed = prev.completedLessons[language] || [];
      if (!completed.includes(lesson.id)) {
        completed.push(lesson.id);
      }
      return { ...prev, completedLessons: { ...prev.completedLessons, [language]: completed } };
    });
    // Update points etc. as in App.js
  };

  return (
    <div className={`app-container ${theme}`}>
      <header className="header">
        {/* Similar header as App, with back to chat */}
        <button onClick={() => navigate('/')} className="back-button">Back to Chat</button>
        <h1>{language.charAt(0).toUpperCase() + language.slice(1)} Learning Path</h1>
        <button onClick={toggleSidebar} className="hamburger">
          {sidebarOpen ? '✕' : '☰'}
        </button>
      </header>
      <div className="main-layout container">
        <aside ref={sidebarRef} className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <h2>Chapters</h2>
          {path.chapters.map((chapter, chapIdx) => (
            <div key={chapIdx}>
              <button onClick={() => toggleChapter(chapIdx)} className="sidebar-button">
                {chapter.title} {expandedChapters.includes(chapIdx) ? '-' : '+'}
              </button>
              {expandedChapters.includes(chapIdx) && (
                <ul style={{listStyle: 'none', padding: '0'}}>
                  {chapter.lessons.map((lesson, lessIdx) => (
                    <li key={lessIdx}>
                      <button onClick={() => startLesson(chapIdx, lessIdx)}>
                        {lesson.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </aside>
        <main className="main-content">
          {currentLessonIndex !== null ? (
            <div>
              <h2>{path.chapters[currentChapterIndex].lessons[currentLessonIndex].title}</h2>
              {loading ? <div className="loading" /> : 
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={theme === 'dark' ? vscDarkPlus : coy}
                          language={match[1]}
                          PreTag="div"
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
                  {lessonContent}
                </ReactMarkdown>
              }
              <button onClick={() => markComplete(currentChapterIndex, currentLessonIndex)} className="submit-challenge">
                Mark as Complete
              </button>
            </div>
          ) : (
            <p>Select a lesson from the sidebar to start.</p>
          )}
          <div className="chat-container" style={{ marginTop: '20px' }}>
            <h3>Ask AI for Explanation</h3>
            <div className="messages">
              {learningMessages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <input
              value={askInput}
              onChange={e => setAskInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAskSubmit()}
              placeholder="Ask about this lesson..."
              className="chat-input"
            />
            <button onClick={handleAskSubmit} disabled={loading} className="send-btn">Send</button>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LearningPath;