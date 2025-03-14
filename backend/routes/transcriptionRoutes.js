const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Mock transcription responses
const mockTranscriptions = [
  "Today we discussed the key concepts of machine learning algorithms.",
  "The professor explained how neural networks process information through layers.",
  "Remember to complete the assignment by next Friday.",
  "The main points from today's lecture include data structures and algorithms.",
  "Make sure to review the chapter on database normalization before the exam."
];

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    // Return a random mock transcription
    const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
    const mockTranscription = mockTranscriptions[randomIndex];

    // Add a small delay to simulate processing time
    setTimeout(() => {
      res.json({ transcript: mockTranscription });
    }, 1000);
    
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio', details: error.message });
  }
});

module.exports = router; 