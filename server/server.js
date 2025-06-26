// Filename: server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// MongoDB connection with error handling
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware setup
app.use(cors({
  origin: 'https://access-ai-iota.vercel.app', // Frontend URL (update if different)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' },
}));

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// User Schema for MongoDB
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.model('User', userSchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return next(); // Allow unauthenticated requests to proceed

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err.message);
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Root route with simple HTML response
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AccessAI Backend</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; }
        h1 { color: #333; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Welcome to the AccessAI Backend API</h1>
      <p>This is the backend server for the AccessAI chatbot.</p>
      <p>Visit the frontend at <a href="https://access-ai-iota.vercel.app/">https://access-ai-iota.vercel.app/</a></p>
      <p>Available endpoints:</p>
      <ul style="list-style: none;">
        <li><strong>/health</strong> - Check server status</li>
        <li><strong>/chat</strong> - POST endpoint for chat requests</li>
        <li><strong>/signup</strong> - POST endpoint for user signup</li>
        <li><strong>/login</strong> - POST endpoint for user login</li>
        <li><strong>/leaderboard</strong> - GET endpoint for leaderboard data</li>
      </ul>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Signup endpoint
app.post('/signup', async (req, res) => {
  console.log('Signup request received:', req.body);
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    console.error('Signup error: Email and password are required');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error('Signup error: Email already exists');
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password and save new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    console.log('User created successfully:', email);

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, user: { email: user.email, points: user.points } });
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to sign up', details: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    console.error('Login error: Email and password are required');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error('Login error: Invalid email or password');
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error('Login error: Invalid email or password');
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token, user: { email: user.email, points: user.points } });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// Chat endpoint with credit system
app.post('/chat', authenticateToken, async (req, res) => {
  console.log('Chat request received:', req.body);
  const { messages, input, credits } = req.body;

  // Input validation
  if (!messages || !input) {
    console.error('Chat error: Missing messages or input');
    return res.status(400).json({ error: 'Messages and input are required' });
  }

  // Check credits for non-logged-in users
  if (!req.user) {
    if (credits <= 0) {
      console.error('Chat error: No credits left');
      return res.status(403).json({ error: 'No credits left. Please sign up or log in to continue.' });
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const chat = model.startChat({
      history: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
    });
    const result = await chat.sendMessage(input);
    const responseText = result.response.text();
    console.log('Chat request processed successfully:', { input, response: responseText });

    // Decrement credits for non-logged-in users
    const updatedCredits = req.user ? credits : credits - 1;
    res.json({ response: responseText, credits: updatedCredits });
  } catch (error) {
    console.error('Chat error:', error.message, error.stack);
    res.status(500).json({ error: 'Something went wrong', details: error.message });
  }
});

// Update user points endpoint
app.post('/update-points', authenticateToken, async (req, res) => {
  if (!req.user) {
    console.error('Update points error: Unauthorized');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { points } = req.body;
  try {
    const user = await User.findById(req.user.id);
    user.points += points;
    await user.save();
    console.log('Points updated successfully for user:', user.email);
    res.status(200).json({ points: user.points });
  } catch (error) {
    console.error('Error updating points:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update points', details: error.message });
  }
});

// Leaderboard endpoint
app.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 }).limit(5);
    const leaderboard = users.map(user => ({
      username: user.email.split('@')[0],
      points: user.points,
    }));
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
  }
});

// Handle 404 errors
app.use((req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});