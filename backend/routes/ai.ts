import express from 'express';
import axios from 'axios';

const router = express.Router();

// Workaround: require express-rate-limit only where used to avoid type conflicts
const rateLimitImport = require('express-rate-limit');
const limiter = rateLimitImport({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many AI requests from this IP, please try again later.'
});

// In-memory cache: { [cacheKey]: { result, timestamp } }
const aiCache: Record<string, { result: any; timestamp: number }> = {};
const CACHE_TTL = 60 * 1000; // 1 minute

// POST /ai/nlp - Proxy to Hugging Face Inference API
router.post('/nlp', (req: any, res: any, next: any) => limiter(req, res, next), async (req: any, res: any) => {
  const { text, model = 'distilbert-base-uncased-finetuned-sst-2-english', user = 'anonymous' } = req.body;
  if (!text) return res.status(400).json({ message: 'Text is required.' });

  // Log the request
  console.log(`[AI] User: ${user}, Model: ${model}, Text length: ${text.length}, Time: ${new Date().toISOString()}`);

  // Caching
  const cacheKey = `${model}:${text}`;
  const cached = aiCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json({ result: cached.result, cached: true });
  }

  try {
    const hfResponse = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer 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`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    aiCache[cacheKey] = { result: hfResponse.data, timestamp: Date.now() };
    res.json({ result: hfResponse.data, cached: false });
  } catch (error: any) {
    const msg = error.response?.data?.error || error.message || 'AI request failed.';
    res.status(500).json({ message: `Hugging Face API error: ${msg}` });
  }
});

export default router;
