# Summarizer Backend Proxy

A simple Node.js + Express backend to proxy Hugging Face summarization requests securely.

## Setup

1. Clone this repo or copy this folder into your project.
2. Run `npm install` inside the `summarizer-backend` directory.
3. Copy `.env.example` to `.env` and add your Hugging Face API token:
   
   ```
   HF_API_TOKEN=hf_...
   ```

4. Start the server:
   
   ```
   npm start
   ```

The server will run on port 3001 by default.

## Usage

Send a POST request to `/summarize` with a JSON body:

```
POST http://localhost:3001/summarize
Content-Type: application/json

{
  "note": "Your note text here."
}
```

**Response:**
```
{
  "summary": "...AI-generated summary..."
}
```

## Security
- Never commit your real API token to version control.
- Deploy this backend to a secure environment (e.g., Vercel, Heroku, AWS, etc.) 