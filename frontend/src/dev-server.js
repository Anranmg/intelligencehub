import { createServer } from 'http';
import { submitText, fetchHistory, fetchRanking, ApiError } from './apiClient.js';

const port = Number(process.env.FRONTEND_PORT || 5173);

const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>IntelligenceHub</title></head>
  <body>
    <h1>IntelligenceHub frontend dev server</h1>
    <p>This lightweight server validates frontend API wiring at runtime.</p>
  </body>
</html>`;

async function warmup() {
  try {
    const submission = await submitText('Sample startup submission');

    if (submission.fallbackUsed) {
      console.warn(
        JSON.stringify({
          type: 'UI_NOTICE',
          level: 'warning',
          message: 'Gemini is unavailable. Showing fallback extraction from backend.'
        })
      );
    }

    await Promise.all([fetchHistory(), fetchRanking()]);
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn(
        JSON.stringify({
          type: 'UI_NOTICE',
          level: 'error',
          message: error.message,
          code: error.code
        })
      );
      return;
    }

    console.error('Unexpected frontend startup error', error);
  }
}

createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => {
  console.log(`Frontend running on http://localhost:${port}`);
  warmup();
});
