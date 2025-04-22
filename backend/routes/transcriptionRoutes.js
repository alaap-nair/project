const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
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

    console.log('Processing audio file:', req.file.path);

    // Spawn Python process to handle transcription
    const pythonProcess = spawn('/Library/Frameworks/Python.framework/Versions/3.9/bin/python3', [
      path.join(__dirname, '..', 'transcribe.py'),
      req.file.path
    ]);

    let transcriptionData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      transcriptionData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        // Clean up the uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        if (code === 0 && transcriptionData) {
          try {
            const result = JSON.parse(transcriptionData);
            res.json(result);
          } catch (parseError) {
            reject(new Error('Failed to parse transcription result'));
          }
        } else {
          reject(new Error(errorData || 'Transcription failed'));
        }
        resolve();
      });
    });

  } catch (error) {
    console.error('Route error:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to transcribe audio', 
      details: error.message 
    });
  }
});

module.exports = router; 