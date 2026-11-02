import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { openVault } from './db';
import { LATEST_VERSION } from './migrations';

let dir: string;
let file: string;
const key = randomBytes(32).toString('hex');

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'vault-'));
  file = path.join(dir, 'vault.db');
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('openVault', () => {
  it('crea la bóveda y aplica las migraciones', () => {
    const db = openVault(file, key);
    const row = db.prepare('SELECT version FROM schema_version').get() as { version: number };
    expect(row.version).toBe(LATEST_VERSION);
    db.close();
  });

  it('guarda los datos cifrados en disco', () => {
    const db = openVault(file, key);
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('nombre', 'dato-secreto');
    db.close();
    expect(readFileSync(file).includes('dato-secreto')).toBe(false);
  });

  it('no abre con una clave incorrecta', () => {
    openVault(file, key).close();
    const otra = randomBytes(32).toString('hex');
    expect(() => openVault(file, otra)).toThrow();
  });

  it('rechaza una clave con formato inválido', () => {
    expect(() => openVault(file, "abc' ; DROP TABLE pages; --")).toThrow('formato inválido');
  });

  it('reabrir no vuelve a aplicar migraciones', () => {
    openVault(file, key).close();
    const db = openVault(file, key);
    const rows = db.prepare('SELECT * FROM schema_version').all();
    expect(rows).toHaveLength(1);
    db.close();
  });
});