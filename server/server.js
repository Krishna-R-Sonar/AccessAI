require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

// Validate environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'OPENROUTER_API_KEY', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// MongoDB connection with detailed error handling
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    process.exit(1);
  });

// Enhanced CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Rate limiting for security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  },
}));

// User Schema
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

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.warn('No token provided', { url: req.url, method: req.method });
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
      });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Root route
app.get('/', (req, res) => {
  console.log('Root endpoint accessed', { ip: req.ip, time: new Date().toISOString() });
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AccessAI Backend API</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: linear-gradient(135deg, #667eea, #764ba2); 
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
          background: linear-gradient(135deg, #4f46e5, #7c3aed); 
          color: white; 
          padding: 3rem 2rem; 
          text-align: center; 
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 700; }
        .header p { font-size: 1.2rem; opacity: 0.9; }
        .content { padding: 3rem 2rem; }
        .endpoints { display: grid; gap: 1rem; margin: 2rem 0; }
        .endpoint { 
          background: #f8fafc; 
          padding: 1.5rem; 
          border-radius: 12px; 
          border-left: 4px solid #4f46e5; 
          transition: transform 0.2s ease, box-shadow 0.2s ease; 
        }
        .endpoint:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .endpoint strong { color: #4f46e5; font-size: 1.1rem; }
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
        .btn:hover { background: #4338ca; transform: translateY(-1px); }
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
          <p>This is the backend server powering the AccessAI chatbot platform.</p>
          <div class="endpoints">
            <div class="endpoint"><strong>GET /health</strong> - Check server status</div>
            <div class="endpoint"><strong>POST /chat</strong> - AI chat responses</div>
            <div class="endpoint"><strong>POST /signup</strong> - User registration</div>
            <div class="endpoint"><strong>POST /login</strong> - User authentication</div>
            <div class="endpoint"><strong>GET /leaderboard</strong> - Top users ranking</div>
            <div class="endpoint"><strong>POST /update-points</strong> - Update user points</div>
          </div>
        </div>
        <div class="footer">
          <a href="https://accessai-five.vercel.app/" class="btn">Access Frontend</a>
          <a href="/health" class="btn" style="background: #10b981;">Check API Health</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested', { ip: req.ip, time: new Date().toISOString() });
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  res.status(200).json(healthcheck);
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  console.log('Signup request:', { email: req.body.email, ip: req.ip });
  const { email, password } = req.body;

  if (!email || !password) {
    console.warn('Invalid signup data', { email, hasPassword: !!password });
    return res.status(400).json({ 
      error: 'Validation failed',
      details: 'Email and password are required'
    });
  }

  if (password.length < 6) {
    console.warn('Password too short', { email });
    return res.status(400).json({
      error: 'Validation failed',
      details: 'Password must be at least 6 characters long'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn('Invalid email format', { email });
    return res.status(400).json({
      error: 'Validation failed',
      details: 'Please provide a valid email address'
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.warn('User already exists', { email });
      return res.status(409).json({ 
        error: 'Registration failed',
        details: 'An account with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ 
      email: email.toLowerCase(), 
      password: hashedPassword 
    });
    
    await user.save();
    console.log('User created successfully', { email });

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
      user: { email: user.email, points: user.points, level: user.level } 
    });

  } catch (error) {
    console.error('Signup error:', {
      message: error.message,
      stack: error.stack,
      email
    });
    res.status(500).json({ 
      error: 'Registration failed',
      details: 'Internal server error. Please try again later.'
    });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  console.log('Login request:', { email: req.body.email, ip: req.ip });
  const { email, password } = req.body;

  if (!email || !password) {
    console.warn('Invalid login data', { email, hasPassword: !!password });
    return res.status(400).json({ 
      error: 'Validation failed',
      details: 'Email and password are required'
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.warn('User not found', { email });
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('Password mismatch', { email });
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Invalid email or password'
      });
    }

    user.lastActive = new Date();
    await user.save();

    const token = jwt.sign({ 
      id: user._id, 
      email: user.email 
    }, process.env.JWT_SECRET, { 
      expiresIn: '24h' 
    });

    console.log('Login successful', { email });
    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      token, 
      user: { email: user.email, points: user.points, level: user.level } 
    });

  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      email
    });
    res.status(500).json({ 
      error: 'Authentication failed',
      details: 'Internal server error. Please try again later.'
    });
  }
});

// Chat endpoint with detailed logging
app.post('/chat', async (req, res) => {
  let user = null;
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Chat request authenticated', { user: user.email, ip: req.ip });
    } catch (err) {
      console.warn('Invalid or expired token in chat request', {
        message: err.message,
        stack: err.stack,
        ip: req.ip
      });
    }
  } else {
    console.log('Guest chat request', { ip: req.ip });
  }

  req.user = user;
  const { messages, input, credits = 0 } = req.body;

  console.log('Chat request received:', {
    user: req.user?.email || 'Guest',
    messageCount: messages?.length || 0,
    inputLength: input?.length || 0,
    credits
  });

  // Input validation
  if (!input || typeof input !== 'string') {
    console.warn('Invalid chat input', { input });
    return res.status(400).json({
      error: 'Validation failed',
      details: 'Valid input message is required'
    });
  }

  if (input.length > 1000) {
    console.warn('Chat input too long', { inputLength: input.length });
    return res.status(400).json({
      error: 'Validation failed',
      details: 'Message too long. Maximum 1000 characters allowed.'
    });
  }

  if (!req.user && credits <= 0) {
    console.warn('Guest credit limit exceeded', { credits });
    return res.status(403).json({
      error: 'Credit limit exceeded',
      details: 'No credits remaining. Please sign up or log in.'
    });
  }

  try {
    const systemPrompt = "You are a helpful coding tutor specializing in programming education. Provide accurate, clear, and concise responses.";
    
    // Ensure messages are in the correct format for OpenRouter
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: input }
    ];

    console.log('Sending request to OpenRouter:', {
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messageCount: fullMessages.length,
      inputLength: input.length
    });

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: fullMessages,
        max_tokens: 1024,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL,
          'X-Title': 'AccessAI'
        },
        timeout: 30000 // 30-second timeout
      }
    );

    console.log('OpenRouter response received:', {
      status: response.status,
      choiceCount: response.data.choices?.length
    });

    if (!response.data.choices?.[0]?.message?.content) {
      console.error('Invalid response from OpenRouter:', { response: response.data });
      return res.status(500).json({
        error: 'Chat processing failed',
        details: 'Invalid response from AI service'
      });
    }

    const responseText = response.data.choices[0].message.content;

    let updatedCredits = credits;
    if (req.user) {
      try {
        const dbUser = await User.findById(req.user.id);
        dbUser.points += 10;
        if (dbUser.points >= dbUser.level * 100) {
          dbUser.level += 1;
        }
        await dbUser.save();
        console.log('User points updated', { userId: req.user.id, points: dbUser.points });
      } catch (userError) {
        console.error('Error updating user points:', {
          message: userError.message,
          stack: userError.stack,
          userId: req.user.id
        });
      }
    } else {
      updatedCredits = credits - 1;
      console.log('Guest credits updated', { newCredits: updatedCredits });
    }

    res.json({
      success: true,
      response: responseText,
      credits: updatedCredits
    });

  } catch (error) {
    console.error('Chat endpoint error:', {
      message: error.message,
      stack: error.stack,
      status: error.response?.status,
      responseData: error.response?.data,
      requestData: {
        messages: messages?.length,
        inputLength: input?.length,
        credits
      }
    });

    if (error.response) {
      // Error from OpenRouter
      res.status(500).json({
        error: 'Chat processing failed',
        details: `AI service error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`
      });
    } else if (error.request) {
      // No response received
      res.status(500).json({
        error: 'Chat processing failed',
        details: 'No response from AI service. Please try again later.'
      });
    } else {
      // Other errors
      res.status(500).json({
        error: 'Chat processing failed',
        details: 'Internal server error. Please try again later.'
      });
    }
  }
});

// Update points endpoint
app.post('/update-points', authenticateToken, async (req, res) => {
  console.log('Update points request:', { userId: req.user.id, ip: req.ip });
  const { points, achievement } = req.body;

  if (typeof points !== 'number' || points < 0) {
    console.warn('Invalid points data', { points, userId: req.user.id });
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
    
    if (user.points >= user.level * 100) {
      user.level += 1;
    }
    
    await user.save();
    console.log('Points updated successfully', { userId: user._id, points: user.points });

    res.status(200).json({ 
      success: true,
      points: user.points,
      level: user.level,
      achievements: user.achievements
    });

  } catch (error) {
    console.error('Update points error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    res.status(500).json({ 
      error: 'Failed to update points',
      details: 'Internal server error'
    });
  }
});

// Leaderboard endpoint
app.get('/leaderboard', async (req, res) => {
  console.log('Leaderboard request:', { ip: req.ip });
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

    console.log('Leaderboard fetched', { count: leaderboard.length });
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
    console.error('Leaderboard error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to fetch leaderboard',
      details: 'Internal server error'
    });
  }
});

// Profile endpoint
app.get('/profile', authenticateToken, async (req, res) => {
  console.log('Profile request:', { userId: req.user.id, ip: req.ip });
  try {
    const user = await User.findById(req.user.id)
      .select('email points level achievements createdAt lastActive');
    
    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Profile error:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      details: 'Internal server error'
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.warn('404 - Route not found:', { url: req.url, method: req.method, ip: req.ip });
  res.status(404).json({ 
    error: 'Endpoint not found',
    details: `The requested resource ${req.url} was not found.`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: 'A record with this information already exists'
    });
  }

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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Starting graceful shutdown...');
  server.close(() => {
    mongoose.connection.close();
    console.log('Server shut down gracefully.');
    process.exit(0);
  });
});

// Start server
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