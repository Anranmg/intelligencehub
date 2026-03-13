import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

const records = [];

const success = (data) => ({ ok: true, data, error: null });
const failure = (message, code, details = null) => ({
  ok: false,
  data: null,
  error: { message, code, details }
});

async function extractWithGemini(rawText) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      fallbackUsed: true,
      reason: 'GEMINI_UNAVAILABLE',
      extraction: {
        title: rawText.split('\n')[0]?.slice(0, 120) || 'Untitled submission',
        summary: 'Gemini is unavailable. Stored original submission only.',
        tags: ['unprocessed'],
        entities: []
      }
    };
  }

  // Placeholder for real Gemini integration.
  return {
    fallbackUsed: false,
    reason: null,
    extraction: {
      title: rawText.split('\n')[0]?.slice(0, 120) || 'Submission',
      summary: `Simulated Gemini extraction for ${rawText.length} characters.`,
      tags: ['gemini', 'extracted'],
      entities: []
    }
  };
}

app.get('/api/health', (_req, res) => {
  res.json(success({ status: 'ok' }));
});

app.post('/api/submissions', async (req, res) => {
  const { rawText } = req.body || {};

  if (!rawText || typeof rawText !== 'string') {
    return res.status(400).json(failure('rawText is required.', 'VALIDATION_ERROR'));
  }

  try {
    const extractionResult = await extractWithGemini(rawText);
    const stored = {
      id: records.length + 1,
      createdAt: new Date().toISOString(),
      rawText,
      ...extractionResult
    };

    records.push(stored);

    return res.status(201).json(success(stored));
  } catch (error) {
    return res
      .status(503)
      .json(
        failure('Gemini extraction failed. Please try again later.', 'GEMINI_REQUEST_FAILED', {
          message: error.message
        })
      );
  }
});

app.get('/api/history', (_req, res) => {
  const history = [...records].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  res.json(success(history));
});

app.get('/api/ranking', (_req, res) => {
  const ranking = records
    .map((record) => ({
      id: record.id,
      title: record.extraction.title,
      score: record.extraction.tags.length
    }))
    .sort((a, b) => b.score - a.score);

  res.json(success(ranking));
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
