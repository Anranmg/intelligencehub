import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export interface MigrationRecord {
  id: number;
  migration_name: string;
  applied_at: string;
}

export interface DbOptions {
  dbFilePath?: string;
  migrationsPath?: string;
}

function ensureSchemaMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      migration_name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);
}

function getMigrationFiles(migrationsPath: string): string[] {
  return fs
    .readdirSync(migrationsPath)
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));
}

function runMigrations(db: Database.Database, migrationsPath: string): void {
  ensureSchemaMigrationsTable(db);

  const migrationFiles = getMigrationFiles(migrationsPath);
  const appliedRows = db
    .prepare<[string], MigrationRecord>(
      'SELECT id, migration_name, applied_at FROM schema_migrations WHERE migration_name = ?'
    );

  const insertApplied = db.prepare(
    'INSERT INTO schema_migrations (migration_name) VALUES (?)'
  );

  const applyMigration = db.transaction((migrationName: string, sql: string) => {
    db.exec(sql);
    insertApplied.run(migrationName);
  });

  for (const migrationFile of migrationFiles) {
    const alreadyApplied = appliedRows.get(migrationFile);
    if (alreadyApplied) {
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsPath, migrationFile), 'utf8');
    applyMigration(migrationFile, sql);
  }
}

export function openDatabase(options: DbOptions = {}): Database.Database {
  const dbFilePath =
    options.dbFilePath ?? path.resolve(process.cwd(), 'backend', 'data', 'intelligencehub.db');
  const migrationsPath =
    options.migrationsPath ?? path.resolve(process.cwd(), 'backend', 'migrations');

  fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });

  const db = new Database(dbFilePath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db, migrationsPath);
  return db;
}
