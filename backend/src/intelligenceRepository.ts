import type Database from 'better-sqlite3';

export interface IntelligenceRecord {
  id: number;
  created_at: string;
  content: string;
  image_data: Buffer | null;
  structured_json: string | null;
  summary: string | null;
  contributor_name: string;
  category: string | null;
  rank_score: number;
  source_url: string | null;
  quality_score: number;
}

export interface CreateIntelligenceInput {
  content: string;
  image_data?: Buffer | null;
  structured_json?: string | null;
  summary?: string | null;
  contributor_name: string;
  category?: string | null;
  rank_score?: number;
  source_url?: string | null;
  quality_score?: number;
}

export interface SearchIntelligenceInput {
  query?: string;
  contributorName?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ContributorRanking {
  contributor_name: string;
  entries: number;
  avg_rank_score: number;
  avg_quality_score: number;
}

export class IntelligenceRepository {
  constructor(private readonly db: Database.Database) {}

  insert(input: CreateIntelligenceInput): IntelligenceRecord {
    const stmt = this.db.prepare(`
      INSERT INTO intelligence (
        content,
        image_data,
        structured_json,
        summary,
        contributor_name,
        category,
        rank_score,
        source_url,
        quality_score
      ) VALUES (
        @content,
        @image_data,
        @structured_json,
        @summary,
        @contributor_name,
        @category,
        @rank_score,
        @source_url,
        @quality_score
      )
    `);

    const result = stmt.run({
      content: input.content,
      image_data: input.image_data ?? null,
      structured_json: input.structured_json ?? null,
      summary: input.summary ?? null,
      contributor_name: input.contributor_name,
      category: input.category ?? null,
      rank_score: input.rank_score ?? 0,
      source_url: input.source_url ?? null,
      quality_score: input.quality_score ?? 0,
    });

    const inserted = this.db
      .prepare<[number], IntelligenceRecord>('SELECT * FROM intelligence WHERE id = ?')
      .get(Number(result.lastInsertRowid));

    if (!inserted) {
      throw new Error('Failed to retrieve inserted intelligence record.');
    }

    return inserted;
  }

  list(limit = 50, offset = 0): IntelligenceRecord[] {
    return this.db
      .prepare<[number, number], IntelligenceRecord>(
        'SELECT * FROM intelligence ORDER BY created_at DESC LIMIT ? OFFSET ?'
      )
      .all(limit, offset);
  }

  search(input: SearchIntelligenceInput): IntelligenceRecord[] {
    const whereClauses: string[] = [];
    const params: Record<string, unknown> = {
      limit: input.limit ?? 50,
      offset: input.offset ?? 0,
    };

    if (input.query) {
      whereClauses.push('(content LIKE @query OR summary LIKE @query OR structured_json LIKE @query)');
      params.query = `%${input.query}%`;
    }

    if (input.contributorName) {
      whereClauses.push('contributor_name = @contributorName');
      params.contributorName = input.contributorName;
    }

    if (input.category) {
      whereClauses.push('category = @category');
      params.category = input.category;
    }

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    return this.db
      .prepare<Record<string, unknown>, IntelligenceRecord>(`
        SELECT *
        FROM intelligence
        ${where}
        ORDER BY rank_score DESC, quality_score DESC, created_at DESC
        LIMIT @limit OFFSET @offset
      `)
      .all(params);
  }

  getContributorRankings(limit = 20): ContributorRanking[] {
    return this.db
      .prepare<[number], ContributorRanking>(`
        SELECT
          contributor_name,
          COUNT(*) AS entries,
          AVG(rank_score) AS avg_rank_score,
          AVG(quality_score) AS avg_quality_score
        FROM intelligence
        GROUP BY contributor_name
        ORDER BY entries DESC, avg_rank_score DESC
        LIMIT ?
      `)
      .all(limit);
  }
}
