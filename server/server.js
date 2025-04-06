// Filename: server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001; // Use Render's PORT env variable

// Enable CORS for your frontend domain
app.use(cors({
  origin: 'https://access-ai-iota.vercel.app', // Allow requests from your frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// Initialize Google Generative AI with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.post('/chat', async (req, res) => {
  const { messages, input } = req.body;

  // Validate request body
  if (!messages || !input) {
    console.error('Invalid request: Missing messages or input');
    return res.status(400).json({ error: 'Messages and input are required' });
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
    console.log('Request processed successfully:', { input, response: responseText });
    res.json({ response: responseText });
  } catch (error) {
    console.error('Error processing request:', error.message, error.stack);
    res.status(500).json({ error: 'Something went wrong', details: error.message });
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
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});