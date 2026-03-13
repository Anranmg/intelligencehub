# intelligencehub

## Install and start

```bash
npm install
npm run dev
```

Useful alternatives:

```bash
npm run dev:backend
npm run dev:frontend
npm run start
```

## Environment configuration

Copy `.env.example` to `.env` and fill values:

- `GEMINI_API_KEY`: API key for Gemini extraction.
- `SERVER_URL`: backend URL used by frontend API client (default `http://localhost:4000`).
- `CLIENT_URL`: frontend URL used by backend CORS policy (default `http://localhost:5173`).
- `DB_PATH`: SQLite file location for persistent storage.

## API contract normalization

All backend endpoints return a normalized envelope:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

Errors use:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "message": "...",
    "code": "...",
    "details": {}
  }
}
```

The frontend `apiClient` consumes this envelope and throws a typed `ApiError` when `ok` is `false`.

## Data flow

1. **Submission**: frontend calls `POST /api/submissions` with `rawText`.
2. **Gemini extraction**: backend attempts extraction through Gemini.
3. **Storage**: backend stores `rawText`, extraction metadata, and timestamps.
4. **History**: frontend calls `GET /api/history` to list newest submissions first.
5. **Ranking**: frontend calls `GET /api/ranking` for computed scores.

## Gemini fallback behavior

When Gemini is unavailable (e.g., missing `GEMINI_API_KEY`), backend:

- Stores the submission anyway.
- Marks `fallbackUsed: true` and `reason: "GEMINI_UNAVAILABLE"`.
- Returns a clear normalized response so UI can notify users.

Frontend behavior:

- Detects `fallbackUsed` from submission response.
- Emits a UI notice warning that fallback extraction is shown.
- Continues loading history and ranking using stored fallback data.
