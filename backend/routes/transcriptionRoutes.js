const express = require('express');
const router = express.Router();
const multer = require('multer');
const speech = require('@google-cloud/speech');
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

// Initialize Google Cloud Speech client
const speechClient = new speech.SpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Read the audio file
    const audioBytes = fs.readFileSync(req.file.path);

    // Configure the request
    const audio = {
      content: audioBytes.toString('base64'),
    };
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    };
    const request = {
      audio: audio,
      config: config,
    };

    // Perform the transcription
    const [response] = await speechClient.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ transcript: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

module.exports = router; 