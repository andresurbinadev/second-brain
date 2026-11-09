import { describe, it, expect } from 'vitest';
import { createPage } from './factory';
import { buildGraph, mostConnected } from './graph';
import type { Relationship } from './model';

const NOW = new Date('2026-11-09T10:00:00.000Z');
const laura = createPage({ kind: 'person', title: 'Laura Gómez' }, NOW);
const huerta = createPage({ kind: 'organization', title: 'Huerta Viva' }, NOW);
const riego = createPage({ kind: 'project', title: 'App de riego' }, NOW);
const suelta = createPage({ kind: 'note', title: 'Nota suelta' }, NOW);
const rel = (fromId: string, toId: string, relation: Relationship['relation']): Relationship => ({
  id: globalThis.crypto.randomUUID(), fromId, toId, relation, provenance: 'user', createdAt: NOW.toISOString(),
});

describe('buildGraph', () => {
  const graph = buildGraph([laura, huerta, riego, suelta], [rel(laura.id, huerta.id, 'founded'), rel(riego.id, huerta.id, 'part_of')]);

  it('cuenta las conexiones de cada página', () => {
    expect(graph.nodes.find((n) => n.id === huerta.id)?.degree).toBe(2);
    expect(graph.nodes.find((n) => n.id === laura.id)?.degree).toBe(1);
  });

  it('detecta las páginas sin conexiones', () => {
    expect(graph.orphans).toEqual([suelta.id]);
  });

  it('ignora relaciones con páginas que no están', () => {
    const g = buildGraph([laura], [rel(laura.id, huerta.id, 'founded')]);
    expect(g.edges).toHaveLength(0);
    expect(g.orphans).toEqual([laura.id]);
  });

  it('ordena por las más conectadas', () => {
    expect(mostConnected(graph, 1)[0].title).toBe('Huerta Viva');
  });
});