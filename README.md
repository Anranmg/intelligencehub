# intelligencehub

Express API for submitting and ranking intelligence reports.

## Endpoints

- `POST /api/intelligence`
  - Body: `{ "text": "...", "contributor": "optional", "image": { "mimeType": "image/png", "data": "<base64>" } }`
- `GET /api/intelligence?q=...&category=...&entity=keyword1,keyword2`
- `GET /api/rankings`

All responses are JSON envelopes with:

- success: `{"success": true, "data": ...}`
- error: `{"success": false, "error": {"code":"...","message":"..."}}`

## Run

```bash
npm install
npm start
```

Set `GEMINI_API_KEY` to enable Gemini-powered analysis through `@google/genai`.
