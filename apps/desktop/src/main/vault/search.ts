import type Database from 'better-sqlite3-multiple-ciphers';
import type { PageKind } from '@sb/core';

export type SearchResult = { id: string; kind: PageKind; title: string; snippet: string };

// Convierte lo que escribe el usuario en una consulta FTS5 segura.
// Cada palabra va entre comillas (así ningún símbolo se interpreta como operador)
// y con * al final (busca también palabras que empiezan así: "regad" encuentra "regadío").
export function toFtsQuery(input: string): string {
  const words = input.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.slice(0, 12).map((w) => `"${w}"*`).join(' ');
}

export function searchPages(db: Database.Database, input: string, limit = 20): SearchResult[] {
  const query = toFtsQuery(input);
  if (!query) return [];
  return db
    .prepare(
      `SELECT p.id, p.kind, p.title,
              snippet(pages_fts, 1, '[', ']', '…', 12) AS snippet
       FROM pages_fts
       JOIN pages p ON p.rowid = pages_fts.rowid
       WHERE pages_fts MATCH ?
       ORDER BY bm25(pages_fts, 10.0, 1.0)
       LIMIT ?`,
    )
    .all(query, Math.min(Math.max(limit, 1), 100)) as SearchResult[];
}