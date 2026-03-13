# intelligencehub

## Backend SQLite storage

A TypeScript backend scaffold is available under `backend/` with:

- `better-sqlite3` local database support.
- Startup migration runner with `schema_migrations` tracking.
- An `intelligence` table and indexes for common query paths.
- A repository implementation for insert/list/search/ranking queries.
- A forward-compatible migration example (`002_add_source_and_quality.sql`).

### Quick start

```bash
cd backend
npm install
npm run typecheck
```
