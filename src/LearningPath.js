// my-chatbot/src/LearningPath.js
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

// NOTE: Ideally, this data would be fetched or imported from a shared location.
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
  const [theme, setTheme] = useState('light'); // Assuming a default theme
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonContent, setLessonContent] = useState('');
  const [loading, setLoading] = useState(false);

  const path = learningPaths[language];

  if (!path) {
    navigate('/');
    return null;
  }
  
  const startLesson = async (lesson) => {
      setCurrentLesson(lesson);
      setLoading(true);
      // Simplified prompt for generating lesson content
      const prompt = `Provide a detailed lesson on "${lesson.title}" for ${language}. Include concepts, code examples, and a simple challenge.`;
      try {
          // This would be your actual API call
          // const response = await axios.post(API_URL, ...);
          // setLessonContent(response.data.response);
          
          // Mock response for demonstration
          setTimeout(() => {
              setLessonContent(`## ${lesson.title}\n\nThis is a placeholder for the lesson content about **${lesson.title}**. In a real scenario, this would be generated by the AI based on the prompt. It would include detailed explanations, code snippets, and a challenge for you to complete.`);
              setLoading(false);
          }, 1000);
          
      } catch (error) {
          setLessonContent('Error: Could not load lesson content.');
          setLoading(false);
      }
  }

  return (
    <div className={`app-container ${theme}`}>
      <header className="header">
        <div className="header-left">
           <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back to Chat</button>
        </div>
        <div className="header-right">
             <h1 className="app-title">{language.charAt(0).toUpperCase() + language.slice(1)} Path</h1>
        </div>
      </header>
      <div className="main-layout container" style={{gap: 'var(--space-6)'}}>
         <aside className="sidebar open" style={{position: 'sticky', transform: 'none', height: 'calc(100vh - 70px)'}}>
            <h2>Lessons</h2>
            {path.chapters.map((chapter, chapIdx) => (
                <div className="sidebar-section" key={chapIdx}>
                    <h3>{chapter.title}</h3>
                    {chapter.lessons.map((lesson, lessIdx) => (
                       <button 
                         key={lessIdx} 
                         className="btn btn-secondary" 
                         style={{width: '100%', marginBottom: 'var(--space-2)', justifyContent: 'flex-start'}}
                         onClick={() => startLesson(lesson)}
                       >
                         {lesson.title}
                       </button>
                    ))}
                </div>
            ))}
         </aside>
         <main className="main-content" style={{marginLeft: 0}}>
            <div className="card">
                {loading && <div className="spinner"></div>}
                {!loading && currentLesson && (
                    <>
                        <h2>{currentLesson.title}</h2>
                        <ReactMarkdown>{lessonContent}</ReactMarkdown>
                        <button className="btn btn-primary">Mark as Complete</button>
                    </>
                )}
                 {!loading && !currentLesson && (
                    <div>
                        <h2>Welcome to the {language} learning path!</h2>
                        <p>Select a lesson from the left sidebar to get started.</p>
                    </div>
                )}
            </div>
         </main>
      </div>
    </div>
  );
}

export default LearningPath;