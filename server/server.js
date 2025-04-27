// Filename: server.js
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const winston = require('winston');

const app = express();
const port = process.env.PORT || 3001;

// Validate environment variables
const requiredEnvVars = ['GEMINI_API_KEY', 'JWT_SECRET'];
requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`${varName} is not set in the environment variables.`);
  }
});

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console(),
  ],
});

// Enable CORS for your frontend domain
app.use(cors({
  origin: 'https://access-ai-iota.vercel.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use('/chat', limiter);

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    logger.warn('Unauthorized access attempt', { ip: req.ip });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token', { ip: req.ip, error: err.message });
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    logger.info('Authenticated user', { userId: user.id, ip: req.ip });
    next();
  });
};

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Root route
app.get('/', (req, res) => {
  logger.info('Root route accessed', { ip: req.ip });
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AccessAI Backend</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
        p { color: #666; }
      </style>
    </head>
    <body>
      <h1>Welcome to the AccessAI Backend</h1>
      <p>This is the backend server for AccessAI, powered by Google Generative AI.</p>
      <p>Use the frontend at <a href="https://access-ai-iota.vercel.app">access-ai-iota.vercel.app</a> to interact with the chatbot.</p>
    </body>
    </html>
  `);
});

// Mock endpoint to save user progress (for simulation)
app.post('/save-progress', (req, res) => {
  logger.info('User progress saved', { progress: req.body, ip: req.ip });
  res.status(200).json({ message: 'Progress saved successfully' });
});

// Chat endpoint with validation and authentication
app.post(
  '/chat',
  authenticateToken,
  [
    body('input').notEmpty().withMessage('Input is required'),
    body('messages').isArray().withMessage('Messages must be an array'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors', { errors: errors.array(), ip: req.ip });
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { messages, input } = req.body;
      logger.info('Chat request received', { input, userId: req.user.id, ip: req.ip });

      // Combine previous messages and new input into a conversation history
      const conversationHistory = messages
        .map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }))
        .concat({ role: 'user', parts: [{ text: input }] });

      // Initialize the generative model
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Start a chat session with the conversation history
      const chat = model.startChat({
        history: conversationHistory,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      // Send the latest user input and get the response
      const result = await chat.sendMessage(input);
      const response = await result.response;
      const text = response.text();

      logger.info('Chat response generated', { response: text, userId: req.user.id, ip: req.ip });
      res.json({ response: text });
    } catch (error) {
      logger.error('Error in /chat endpoint', { error: error.message, userId: req.user.id, ip: req.ip });
      res.status(500).json({ error: 'Failed to process your request.' });
    }
  }
);

// Start the server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});