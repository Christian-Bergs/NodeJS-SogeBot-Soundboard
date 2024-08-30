const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from the "public" directory
app.use(express.static('public'));

// Function to handle playing sound
const handlePlaySound = (req, res) => {
  const sound = req.query.sound;
  const volume = parseFloat(req.query.volume);

  if (!sound) {
    return res.status(400).send('Sound query parameter is required');
  }

  // Broadcast the sound and volume to all connected WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ action: 'playSound', sound: sound, volume: volume }));
    }
  });

  res.sendStatus(200);
};

// API endpoint to trigger sound (POST)
app.post('/api/play-sound', handlePlaySound);

// API endpoint to trigger sound (GET)
app.get('/api/play-sound', handlePlaySound);

// API endpoint to get the list of sound files
app.get('/api/sounds', (req, res) => {
  const soundsDir = path.join(__dirname, 'public', 'sounds');
  fs.readdir(soundsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to read sounds directory' });
    }
    const soundFiles = files.filter(file => path.extname(file) === '.mp3');
    res.json(soundFiles);
  });
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`New client connected from IP: ${ip}`);
  
  ws.on('close', () => {
    console.log(`Client from IP ${ip} disconnected`);
  });
});

// Start the server with configurable IP and PORT
const IP = process.env.SERVER_IP || '127.0.0.1';
const PORT = process.env.SERVER_PORT || 3000;
server.listen(PORT, IP, () => {
  console.log(`Server is running on ${IP}:${PORT}`);
});