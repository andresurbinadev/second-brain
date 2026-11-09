import type Database from 'better-sqlite3-multiple-ciphers';
import { PageSchema, type Page, type PageKind } from '@sb/core';

// Cómo es una fila de la tabla pages (nombres en snake_case, como en SQL).
type PageRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  status: string;
  provenance: string;
  source_ref: string | null;
  created_at: string;
  updated_at: string;
};

// De fila de SQL a Page. Se valida al leer: si algo inválido llegara a la base de datos, se detecta aquí.
function toPage(row: PageRow): Page {
  return PageSchema.parse({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    status: row.status,
    provenance: row.provenance,
    sourceRef: row.source_ref ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function insertPage(db: Database.Database, page: Page): void {
  const p = PageSchema.parse(page);
  db.prepare(
    `INSERT INTO pages (id, kind, title, body, status, provenance, source_ref, created_at, updated_at)
     VALUES (@id, @kind, @title, @body, @status, @provenance, @sourceRef, @createdAt, @updatedAt)`,
  ).run({ ...p, sourceRef: p.sourceRef ?? null });
}

export function getPage(db: Database.Database, id: string): Page | undefined {
  const row = db.prepare('SELECT * FROM pages WHERE id = ?').get(id) as PageRow | undefined;
  return row ? toPage(row) : undefined;
}

export function listPages(db: Database.Database, kind?: PageKind): Page[] {
  const rows = kind
    ? db.prepare('SELECT * FROM pages WHERE kind = ? ORDER BY title').all(kind)
    : db.prepare('SELECT * FROM pages ORDER BY title').all();
  return (rows as PageRow[]).map(toPage);
}

export type PageChanges = Partial<Pick<Page, 'title' | 'body' | 'status' | 'provenance' | 'sourceRef'>>;

// Actualiza una página y guarda antes su versión anterior en page_versions.
// Las dos cosas van en una transacción: o se hacen ambas o ninguna.
export function updatePage(db: Database.Database, id: string, changes: PageChanges, now: Date = new Date()): Page {
  return db.transaction(() => {
    const current = getPage(db, id);
    if (!current) throw new Error(`No existe la página ${id}`);

    const next = PageSchema.parse({ ...current, ...changes, updatedAt: now.toISOString() });

    db.prepare(
      `INSERT INTO page_versions (page_id, title, body, status, provenance, source_ref, updated_at, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(current.id, current.title, current.body, current.status, current.provenance, current.sourceRef ?? null, current.updatedAt, now.toISOString());

    db.prepare(
      `UPDATE pages SET title = @title, body = @body, status = @status, provenance = @provenance,
         source_ref = @sourceRef, updated_at = @updatedAt WHERE id = @id`,
    ).run({ ...next, sourceRef: next.sourceRef ?? null });

    return next;
  })();
}

// Borra la página. Sus relaciones se borran solas (ON DELETE CASCADE).
// Su historial se conserva en page_versions, guardando antes la última versión.
export function deletePage(db: Database.Database, id: string, now: Date = new Date()): void {
  db.transaction(() => {
    const current = getPage(db, id);
    if (!current) return;
    db.prepare(
      `INSERT INTO page_versions (page_id, title, body, status, provenance, source_ref, updated_at, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(current.id, current.title, current.body, current.status, current.provenance, current.sourceRef ?? null, current.updatedAt, now.toISOString());
    db.prepare('DELETE FROM pages WHERE id = ?').run(id);
  })();
}

export function getPageHistory(db: Database.Database, id: string): { title: string; body: string; updatedAt: string }[] {
  return db
    .prepare('SELECT title, body, updated_at AS updatedAt FROM page_versions WHERE page_id = ? ORDER BY id')
    .all(id) as { title: string; body: string; updatedAt: string }[];
}