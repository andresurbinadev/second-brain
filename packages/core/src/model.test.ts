import { describe, it, expect } from 'vitest';
import { PageSchema, RelationshipSchema } from './model';
import { createPage } from './factory';

const NOW = new Date('2026-11-03T10:00:00.000Z');
const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';

describe('createPage', () => {
  it('crea una página del usuario confirmada', () => {
    const p = createPage({ kind: 'person', title: 'Laura Gómez' }, NOW, ID_A);
    expect(p).toMatchObject({ provenance: 'user', status: 'confirmed', body: '', createdAt: NOW.toISOString() });
  });

  it('lo que propone la IA nace provisional', () => {
    const p = createPage({ kind: 'organization', title: 'Huerta Viva', provenance: 'ai' }, NOW, ID_B);
    expect(p.status).toBe('provisional');
  });

  it('rechaza un título vacío', () => {
    expect(() => createPage({ kind: 'note', title: '   ' }, NOW, ID_A)).toThrow();
  });
});

describe('PageSchema', () => {
  const base = createPage({ kind: 'project', title: 'App de riego' }, NOW, ID_A);

  it('rechaza un tipo desconocido', () => {
    expect(() => PageSchema.parse({ ...base, kind: 'planeta' })).toThrow();
  });

  it('no deja confirmar un dato que viene de la IA', () => {
    expect(() => PageSchema.parse({ ...base, provenance: 'ai', status: 'confirmed' })).toThrow('Solo un dato del usuario');
  });
});

describe('RelationshipSchema', () => {
  const rel = { id: ID_A, fromId: ID_A, toId: ID_B, relation: 'founded', provenance: 'user', createdAt: NOW.toISOString() };

  it('acepta una relación válida', () => {
    expect(RelationshipSchema.parse(rel).relation).toBe('founded');
  });

  it('rechaza que una página se relacione consigo misma', () => {
    expect(() => RelationshipSchema.parse({ ...rel, toId: ID_A })).toThrow('consigo misma');
  });
});