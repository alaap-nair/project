import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const HF_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

app.post('/summarize', async (req, res) => {
  const { note } = req.body;
  if (!note) {
    return res.status(400).json({ error: 'Missing note text.' });
  }
  try {
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: note }),
    });
    const data = await response.json();
    console.log('Hugging Face response:', data);
    if (Array.isArray(data) && data[0] && data[0].summary_text) {
      res.json({ summary: data[0].summary_text });
    } else if (data.error) {
      res.status(500).json({ error: 'Failed to generate summary.', details: data.error });
    } else {
      res.status(500).json({ error: 'Failed to generate summary.', details: data });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error.', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Summarizer backend running on port ${PORT}`)); 