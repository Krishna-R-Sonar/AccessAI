// my-chatbot/server/server.js
require('dotenv').config();

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3001;

// MongoDB connection with error handling
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://accessai-five.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Enhanced middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
}));

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced User Schema for MongoDB
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  achievements: [{ type: String }],
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// Enhanced middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Enhanced root route with better HTML response
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AccessAI Backend API</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        
        .container {
          max-width: 800px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          overflow: hidden;
          margin: 2rem;
        }
        
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 3rem 2rem;
          text-align: center;
        }
        
        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }
        
        .header p {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .content {
          padding: 3rem 2rem;
        }
        
        .endpoints {
          display: grid;
          gap: 1rem;
          margin: 2rem 0;
        }
        
        .endpoint {
          background: #f8fafc;
          padding: 1.5rem;
          border-radius: 12px;
          border-left: 4px solid #4f46e5;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .endpoint:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .endpoint strong {
          color: #4f46e5;
          font-size: 1.1rem;
        }
        
        .footer {
          text-align: center;
          padding: 2rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        
        .btn {
          display: inline-block;
          background: #4f46e5;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
          margin: 0.5rem;
        }
        
        .btn:hover {
          background: #4338ca;
          transform: translateY(-1px);
        }
        
        @media (max-width: 768px) {
          .header h1 { font-size: 2rem; }
          .header p { font-size: 1rem; }
          .content { padding: 2rem 1rem; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 AccessAI Backend API</h1>
          <p>Intelligent chatbot platform for coding education</p>
        </div>
        
        <div class="content">
          <h2>Welcome to AccessAI</h2>
          <p>This is the backend server powering the AccessAI chatbot platform. The API provides intelligent chat functionality, user management, and learning path tracking.</p>
          
          <div class="endpoints">
            <div class="endpoint">
              <strong>GET /health</strong> - Check server status and API availability
            </div>
            <div class="endpoint">
              <strong>POST /chat</strong> - Intelligent chat endpoint with AI responses
            </div>
            <div class="endpoint">
              <strong>POST /signup</strong> - User registration with email verification
            </div>
            <div class="endpoint">
              <strong>POST /login</strong> - User authentication and token generation
            </div>
            <div class="endpoint">
              <strong>GET /leaderboard</strong> - Top users ranking by points
            </div>
            <div class="endpoint">
              <strong>POST /update-points</strong> - Update user points and achievements
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Ready to start building? Visit the frontend application:</p>
          <a href="https://accessai-five.vercel.app/" class="btn">Access Frontend</a>
          <a href="/health" class="btn" style="background: #10b981;">Check API Health</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(healthcheck);
});

// Enhanced signup endpoint with better validation
app.post('/signup', async (req, res) => {
  console.log('Signup request received:', { ...req.body, password: '***' });
  
  const { email, password } = req.body;

  // Enhanced input validation
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: 'Email and password are required'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Validation failed',
      details: 'Password must be at least 6 characters long'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Validation failed',
      details: 'Please provide a valid email address'
    });
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Registration failed',
        details: 'An account with this email already exists'
      });
    }

    // Hash password and save new user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ 
      email: email.toLowerCase(), 
      password: hashedPassword 
    });
    
    await user.save();

    console.log('User created successfully:', email);
    
    // Generate JWT token
    const token = jwt.sign({ 
      id: user._id, 
      email: user.email 
    }, process.env.JWT_SECRET, { 
      expiresIn: '24h' 
    });

    res.status(201).json({ 
      success: true,
      message: 'Account created successfully',
      token, 
      user: { 
        email: user.email, 
        points: user.points,
        level: user.level
      } 
    });

  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ 
      error: 'Registration failed',
      details: 'Internal server error. Please try again later.'
    });
  }
});

// Enhanced login endpoint
app.post('/login', async (req, res) => {
  console.log('Login request received:', { ...req.body, password: '***' });
  
  const { email, password } = req.body;

  // Enhanced input validation
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: 'Email and password are required'
    });
  }

  try {
    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Invalid email or password'
      });
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ 
      id: user._id, 
      email: user.email 
    }, process.env.JWT_SECRET, { 
      expiresIn: '24h' 
    });

    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: { 
        email: user.email, 
        points: user.points,
        level: user.level
      } 
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: 'Internal server error. Please try again later.'
    });
  }
});

// Enhanced chat endpoint with better error handling
app.post('/chat', async (req, res) => {
  let user = null;

  // Try to verify token if provided
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.warn('Invalid or expired token, continuing as guest');
    }
  }

  req.user = user; // may be null (guest)

  console.log('Chat request received:', {
    user: req.user?.email || 'Guest',
    messageLength: req.body.messages?.length,
    hasInput: !!req.body.input
  });

  const { messages, input, credits = 0 } = req.body;

  // Input validation
  if (!input || typeof input !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      details: 'Valid input message is required'
    });
  }

  if (input.length > 1000) {
    return res.status(400).json({
      error: 'Validation failed',
      details: 'Message too long. Maximum 1000 characters allowed.'
    });
  }

  // Credit system for guests
  if (!req.user && credits <= 0) {
    return res.status(403).json({
      error: 'Credit limit exceeded',
      details: 'No credits remaining. Please sign up or log in to continue chatting.'
    });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      systemInstruction: "You are a helpful coding tutor..."
    });

    const chat = model.startChat({
      history: (messages || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(input);
    const responseText = result.response.text();

    console.log('Chat response generated successfully');

    let updatedCredits = credits;
    if (req.user) {
      try {
        const dbUser = await User.findById(req.user.id);
        dbUser.points += 10;
        if (dbUser.points >= dbUser.level * 100) {
          dbUser.level += 1;
        }
        await dbUser.save();
      } catch (userError) {
        console.error('Error updating user points:', userError.message);
      }
    } else {
      updatedCredits = credits - 1;
    }

    res.json({
      success: true,
      response: responseText,
      credits: updatedCredits
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({
      error: 'Chat processing failed',
      details: 'Unable to process your message. Please try again.'
    });
  }
});


// Enhanced update points endpoint
app.post('/update-points', authenticateToken, async (req, res) => {
  const { points, achievement } = req.body;

  if (typeof points !== 'number' || points < 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: 'Valid points value is required'
    });
  }

  try {
    const user = await User.findById(req.user.id);
    user.points += points;
    
    if (achievement && !user.achievements.includes(achievement)) {
      user.achievements.push(achievement);
    }
    
    // Level up logic
    if (user.points >= user.level * 100) {
      user.level += 1;
    }
    
    await user.save();

    console.log('Points updated successfully for user:', user.email);
    
    res.status(200).json({ 
      success: true,
      points: user.points,
      level: user.level,
      achievements: user.achievements
    });

  } catch (error) {
    console.error('Error updating points:', error.message);
    res.status(500).json({ 
      error: 'Failed to update points',
      details: 'Internal server error'
    });
  }
});

// Enhanced leaderboard endpoint with pagination
app.get('/leaderboard', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  try {
    const totalUsers = await User.countDocuments();
    const users = await User.find()
      .sort({ points: -1, lastActive: -1 })
      .skip(skip)
      .limit(limit)
      .select('email points level achievements lastActive');

    const leaderboard = users.map(user => ({
      username: user.email.split('@')[0],
      points: user.points,
      level: user.level,
      achievements: user.achievements,
      lastActive: user.lastActive
    }));

    res.status(200).json({
      success: true,
      leaderboard,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: 'Internal server error'
    });
  }
});

// User profile endpoint
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('email points level achievements createdAt lastActive');
    
    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      details: 'Internal server error'
    });
  }
});

// Enhanced 404 handler
app.use((req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    details: `The requested resource ${req.url} was not found on this server.`
  });
});

// Enhanced global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message, err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: 'A record with this information already exists'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      details: 'Authentication token is invalid'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      details: 'Authentication token has expired'
    });
  }

  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong. Please try again later.' 
      : err.message
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Starting graceful shutdown...');
  server.close(() => {
    mongoose.connection.close();
    console.log('Server shut down gracefully.');
    process.exit(0);
  });
});

// Start the server with enhanced logging
const server = app.listen(port, () => {
  console.log(`
🚀 AccessAI Server running successfully!
📍 Port: ${port}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📅 Started: ${new Date().toISOString()}
🔗 Health check: http://localhost:${port}/health
  `);
});

module.exports = app;