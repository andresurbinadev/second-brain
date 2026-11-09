import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3-multiple-ciphers';
import { createPage } from '@sb/core';
import { openVault } from './db';
import { insertPage, updatePage, deletePage } from './pages';
import { searchPages, toFtsQuery } from './search';

let dir: string;
let db: Database.Database;
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'vault-'));
  db = openVault(path.join(dir, 'vault.db'), randomBytes(32).toString('hex'));
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('searchPages', () => {
  it('encuentra por título y por contenido, con el título primero', () => {
    insertPage(db, createPage({ kind: 'project', title: 'App de riego', body: 'Sensores de humedad' }));
    insertPage(db, createPage({ kind: 'note', title: 'Ideas', body: 'Mejorar el riego por goteo' }));
    const results = searchPages(db, 'riego');
    expect(results.map((r) => r.title)).toEqual(['App de riego', 'Ideas']);
  });

  it('ignora mayúsculas y tildes, y busca por prefijo', () => {
    insertPage(db, createPage({ kind: 'person', title: 'Laura Gómez', body: 'Agrónoma' }));
    expect(searchPages(db, 'gomez')).toHaveLength(1);
    expect(searchPages(db, 'AGRON')).toHaveLength(1);
  });

  it('se mantiene al día al actualizar y al borrar', () => {
    const p = createPage({ kind: 'note', title: 'Borrador', body: 'tomates' });
    insertPage(db, p);
    updatePage(db, p.id, { body: 'pimientos' });
    expect(searchPages(db, 'tomates')).toHaveLength(0);
    expect(searchPages(db, 'pimientos')).toHaveLength(1);
    deletePage(db, p.id);
    expect(searchPages(db, 'pimientos')).toHaveLength(0);
  });

  it('no se rompe con símbolos ni con intentos de inyección', () => {
    insertPage(db, createPage({ kind: 'note', title: 'Nota' }));
    expect(() => searchPages(db, `" OR 1=1; DROP TABLE pages; --`)).not.toThrow();
    expect(searchPages(db, '***')).toEqual([]);
    expect(toFtsQuery('hola "mundo"')).toBe('"hola"* "mundo"*');
  });
});