import type Database from 'better-sqlite3';
import { openDatabase } from './db.js';
import { IntelligenceRepository } from './intelligenceRepository.js';

export interface BackendContext {
  db: Database.Database;
  intelligenceRepository: IntelligenceRepository;
}

export function initializeBackend(): BackendContext {
  const db = openDatabase();
  const intelligenceRepository = new IntelligenceRepository(db);

  return {
    db,
    intelligenceRepository,
  };
}
