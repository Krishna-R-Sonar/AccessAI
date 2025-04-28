// Filename: server.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: 'https://access-ai-iota.vercel.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AccessAI Backend</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
          background-color: #f4f4f4;
        }
        h1 {
          color: #333;
        }
        a {
          color: #007bff;
          text-decoration: none;
        }
        a:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <h1>Welcome to the AccessAI Backend API</h1>
      <p>This is the backend server for the AccessAI chatbot. It handles API requests for chat functionality.</p>
      <p>Visit the frontend at <a href="https://access-ai-iota.vercel.app/">https://access-ai-iota.vercel.app/</a></p>
      <p>Available endpoints:</p>
      <ul style="list-style: none;">
        <li><strong>/health</strong> - Check server status</li>
        <li><strong>/chat</strong> - POST endpoint for chat requests (used by the frontend)</li>
        <li><strong>/tts</strong> - POST endpoint for text-to-speech conversion using Eleven Labs API</li>
      </ul>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.post('/chat', async (req, res) => {
  const { messages, input } = req.body;

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

app.post('/tts', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    console.error('Invalid TTS request: Missing text');
    return res.status(400).json({ error: 'Text is required for TTS conversion' });
  }

  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      throw new Error('Eleven Labs API key is not configured');
    }

    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Eleven Labs API request failed with status ${response.status}: ${errorText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error in /tts endpoint:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to generate audio', details: error.message });
  }
});

app.use((req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message, err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});