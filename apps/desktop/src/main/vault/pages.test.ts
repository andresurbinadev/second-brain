import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3-multiple-ciphers';
import { createPage } from '@sb/core';
import { openVault } from './db';
import { insertPage, getPage, listPages, updatePage, deletePage, getPageHistory } from './pages';
import { addRelationship, listRelationships } from './relationships';

let dir: string;
let db: Database.Database;
const T1 = new Date('2026-11-09T10:00:00.000Z');
const T2 = new Date('2026-11-09T11:00:00.000Z');

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'vault-'));
  db = openVault(path.join(dir, 'vault.db'), randomBytes(32).toString('hex'));
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe('páginas', () => {
  it('guarda y lee una página', () => {
    const laura = createPage({ kind: 'person', title: 'Laura Gómez', body: 'Agrónoma' }, T1);
    insertPage(db, laura);
    expect(getPage(db, laura.id)).toEqual(laura);
  });

  it('lista por tipo', () => {
    insertPage(db, createPage({ kind: 'person', title: 'Laura Gómez' }, T1));
    insertPage(db, createPage({ kind: 'project', title: 'App de riego' }, T1));
    expect(listPages(db, 'person').map((p) => p.title)).toEqual(['Laura Gómez']);
    expect(listPages(db)).toHaveLength(2);
  });

  it('al actualizar guarda la versión anterior', () => {
    const p = createPage({ kind: 'note', title: 'Idea', body: 'v1' }, T1);
    insertPage(db, p);
    const updated = updatePage(db, p.id, { body: 'v2' }, T2);
    expect(updated.body).toBe('v2');
    expect(updated.updatedAt).toBe(T2.toISOString());
    expect(getPageHistory(db, p.id)).toEqual([{ title: 'Idea', body: 'v1', updatedAt: T1.toISOString() }]);
  });

  it('no deja confirmar por actualización un dato de la IA', () => {
    const p = createPage({ kind: 'note', title: 'Propuesta', provenance: 'ai' }, T1);
    insertPage(db, p);
    expect(() => updatePage(db, p.id, { status: 'confirmed' }, T2)).toThrow();
    expect(getPage(db, p.id)?.status).toBe('provisional');
    expect(getPageHistory(db, p.id)).toHaveLength(0);
  });

  it('al borrar, se van sus relaciones pero queda el historial', () => {
    const a = createPage({ kind: 'person', title: 'Laura Gómez' }, T1);
    const b = createPage({ kind: 'organization', title: 'Huerta Viva' }, T1);
    insertPage(db, a);
    insertPage(db, b);
    addRelationship(db, { id: globalThis.crypto.randomUUID(), fromId: a.id, toId: b.id, relation: 'founded', provenance: 'user', createdAt: T1.toISOString() });
    expect(listRelationships(db, b.id)).toHaveLength(1);

    deletePage(db, a.id, T2);
    expect(getPage(db, a.id)).toBeUndefined();
    expect(listRelationships(db, b.id)).toHaveLength(0);
    expect(getPageHistory(db, a.id)).toHaveLength(1);
  });

  it('no permite relaciones con páginas que no existen', () => {
    const a = createPage({ kind: 'person', title: 'Laura Gómez' }, T1);
    insertPage(db, a);
    expect(() =>
      addRelationship(db, { id: globalThis.crypto.randomUUID(), fromId: a.id, toId: globalThis.crypto.randomUUID(), relation: 'knows', provenance: 'user', createdAt: T1.toISOString() }),
    ).toThrow();
  });
});