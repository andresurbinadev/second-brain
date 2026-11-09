import type Database from 'better-sqlite3-multiple-ciphers';

// Cada migración cambia la estructura de la base de datos una sola vez, en orden.
// Nunca se edita una migración ya publicada: si hay que cambiar algo, se añade otra nueva.
const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE pages (
        id          TEXT PRIMARY KEY,
        kind        TEXT NOT NULL,
        title       TEXT NOT NULL,
        body        TEXT NOT NULL DEFAULT '',
        status      TEXT,
        provenance  TEXT NOT NULL DEFAULT 'user',
        created_at  TEXT NOT NULL,
        updated_at  TEXT NOT NULL
      );
      CREATE TABLE relationships (
        id          TEXT PRIMARY KEY,
        from_id     TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        to_id       TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
        relation    TEXT NOT NULL,
        evidence    TEXT,
        created_at  TEXT NOT NULL
      );
      CREATE TABLE settings (
        key    TEXT PRIMARY KEY,
        value  TEXT NOT NULL
      );
    `,
  },
    {
    version: 2,
    sql: `
      ALTER TABLE pages ADD COLUMN source_ref TEXT;
      ALTER TABLE relationships ADD COLUMN provenance TEXT NOT NULL DEFAULT 'user';
      CREATE TABLE page_versions (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        page_id     TEXT NOT NULL,
        title       TEXT NOT NULL,
        body        TEXT NOT NULL,
        status      TEXT NOT NULL,
        provenance  TEXT NOT NULL,
        source_ref  TEXT,
        updated_at  TEXT NOT NULL,
        saved_at    TEXT NOT NULL
      );
      CREATE INDEX idx_page_versions_page ON page_versions(page_id);
      CREATE INDEX idx_relationships_from ON relationships(from_id);
      CREATE INDEX idx_relationships_to ON relationships(to_id);
    `,
  },
];

export const LATEST_VERSION = MIGRATIONS.at(-1)!.version;

export function migrate(db: Database.Database): number {
  db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  const row = db.prepare('SELECT version FROM schema_version').get() as { version: number } | undefined;
  let current = row?.version ?? 0;

  for (const m of MIGRATIONS) {
    if (m.version <= current) continue;
    // Todo o nada: si una migración falla a medias, la base de datos queda como estaba.
    db.transaction(() => {
      db.exec(m.sql);
      db.prepare('DELETE FROM schema_version').run();
      db.prepare('INSERT INTO schema_version (version) VALUES (?)').run(m.version);
    })();
    current = m.version;
  }
  return current;
}