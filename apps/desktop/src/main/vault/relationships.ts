import type Database from 'better-sqlite3-multiple-ciphers';
import { RelationshipSchema, type Relationship } from '@sb/core';

type RelationshipRow = {
  id: string;
  from_id: string;
  to_id: string;
  relation: string;
  evidence: string | null;
  provenance: string;
  created_at: string;
};

function toRelationship(row: RelationshipRow): Relationship {
  return RelationshipSchema.parse({
    id: row.id,
    fromId: row.from_id,
    toId: row.to_id,
    relation: row.relation,
    evidence: row.evidence ?? undefined,
    provenance: row.provenance,
    createdAt: row.created_at,
  });
}

export function addRelationship(db: Database.Database, rel: Relationship): void {
  const r = RelationshipSchema.parse(rel);
  db.prepare(
    `INSERT INTO relationships (id, from_id, to_id, relation, evidence, provenance, created_at)
     VALUES (@id, @fromId, @toId, @relation, @evidence, @provenance, @createdAt)`,
  ).run({ ...r, evidence: r.evidence ?? null });
}

// Todas las relaciones en las que participa una página, salgan de ella o lleguen a ella.
export function listRelationships(db: Database.Database, pageId: string): Relationship[] {
  const rows = db
    .prepare('SELECT * FROM relationships WHERE from_id = ? OR to_id = ? ORDER BY created_at')
    .all(pageId, pageId) as RelationshipRow[];
  return rows.map(toRelationship);
}

export function deleteRelationship(db: Database.Database, id: string): void {
  db.prepare('DELETE FROM relationships WHERE id = ?').run(id);
}