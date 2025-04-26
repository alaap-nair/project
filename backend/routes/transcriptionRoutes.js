const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    console.log('Upload directory:', uploadsDir);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and correct extension
    const filename = `${Date.now()}-recording.m4a`;
    console.log('Generated filename:', filename);
    console.log('Original file details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer ? 'Present' : 'Not present'
    });
    cb(null, filename);
  }
});

// Configure multer
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    console.log('Received file in filter:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer ? 'Present' : 'Not present'
    });
    
    // Accept common audio formats
    const validMimeTypes = [
      'audio/mp4',
      'audio/x-m4a',
      'audio/m4a',
      'audio/aac',
      'audio/mpeg',
      'audio/mp3',
      'audio/vnd.wave',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'application/octet-stream'  // For raw data from mobile
    ];

    if (validMimeTypes.includes(file.mimetype)) {
      console.log('File type accepted:', file.mimetype);
      cb(null, true);
    } else {
      console.log('Rejected file type:', file.mimetype);
      cb(new Error(`Invalid file type: ${file.mimetype}. Supported types: ${validMimeTypes.join(', ')}`));
    }
  }
}).single('audio');

// Mock transcription responses
const mockTranscriptions = [
  "Today we discussed the key concepts of machine learning algorithms.",
  "The professor explained how neural networks process information through layers.",
  "Remember to complete the assignment by next Friday.",
  "The main points from today's lecture include data structures and algorithms.",
  "Make sure to review the chapter on database normalization before the exam."
];

router.post('/transcribe', (req, res) => {
  upload(req, res, async (err) => {
    try {
      // Handle multer errors
      if (err instanceof multer.MulterError) {
        console.error('Multer error:', err);
        return res.status(400).json({ 
          error: 'File upload error',
          details: err.message
        });
      } else if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          error: err.message || 'File upload failed'
        });
      }

      // Check if file was provided
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      // Validate file size
      if (!req.file.size) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Audio file is empty' });
      }

      console.log('File received:', {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const audioPath = req.file.path;
      
      // Verify the file exists and is readable
      try {
        await fs.promises.access(audioPath, fs.constants.R_OK);
        const stats = await fs.promises.stat(audioPath);
        if (!stats.size) {
          throw new Error('Audio file is empty');
        }
        console.log('Audio file stats:', {
          size: stats.size,
          path: audioPath
        });
      } catch (error) {
        console.error('File validation error:', error);
        return res.status(400).json({ error: 'Invalid or unreadable audio file' });
      }
      
      // Run the Python transcription script
      const pythonProcess = spawn('python3', [
        path.join(__dirname, '..', 'transcribe.py'),
        audioPath
      ]);

      let transcriptionData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        transcriptionData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
        console.error('Python error:', data.toString());
      });

      await new Promise((resolve, reject) => {
        pythonProcess.on('close', (code) => {
          // Clean up the uploaded file
          fs.unlink(audioPath, (err) => {
            if (err) console.error('Error deleting audio file:', err);
          });

          if (code !== 0) {
            console.error('Transcription process error:', errorData);
            reject(new Error(`Transcription process failed with code ${code}: ${errorData}`));
            return;
          }

          try {
            const result = JSON.parse(transcriptionData);
            if (result.error) {
              reject(new Error(result.error));
            } else {
              resolve(result);
            }
          } catch (err) {
            console.error('Error parsing transcription result:', err);
            reject(new Error('Invalid transcription result'));
          }
        });

        // Handle process errors
        pythonProcess.on('error', (err) => {
          console.error('Failed to start Python process:', err);
          reject(new Error('Failed to start transcription process'));
        });
      })
      .then(result => {
        res.json({ text: result.transcript });
      })
      .catch(error => {
        throw error;
      });

    } catch (error) {
      console.error('Transcription error:', error);
      // Clean up the uploaded file if it exists
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting audio file:', err);
        });
      }
      res.status(500).json({ 
        error: error.message || 'Failed to transcribe audio',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
});

module.exports = router; 