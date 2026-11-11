import { describe, it, expect } from 'vitest';
import { createPage } from './factory';
import { buildDashboard } from './dashboard';

const t = (h: number) => new Date(`2026-11-09T${String(h).padStart(2, '0')}:00:00.000Z`);
const laura = createPage({ kind: 'person', title: 'Laura Gómez' }, t(8));
const riego = createPage({ kind: 'project', title: 'App de riego' }, t(9));
const viejo = createPage({ kind: 'project', title: 'Proyecto cerrado', status: 'archived' }, t(10));
const decision = createPage({ kind: 'decision', title: '¿Contratar a un agrónomo?', status: 'pending' }, t(11));
const propuesta = createPage({ kind: 'organization', title: 'Huerta Viva', provenance: 'ai' }, t(12));

const dash = buildDashboard([laura, riego, viejo, decision, propuesta], [
  { id: globalThis.crypto.randomUUID(), fromId: laura.id, toId: riego.id, relation: 'member_of', provenance: 'user', createdAt: t(13).toISOString() },
]);

describe('buildDashboard', () => {
  it('cuenta páginas, relaciones, huérfanas y tipos', () => {
    expect(dash.counts).toMatchObject({ pages: 5, relationships: 1, orphans: 3 });
    expect(dash.counts.byKind.project).toBe(2);
  });

  it('separa lo que hay que revisar: lo propuesto por la IA', () => {
    expect(dash.toReview.map((p) => p.title)).toEqual(['Huerta Viva']);
  });

  it('muestra las decisiones abiertas y los proyectos activos', () => {
    expect(dash.openDecisions.map((p) => p.title)).toEqual(['¿Contratar a un agrónomo?']);
    expect(dash.activeProjects.map((p) => p.title)).toEqual(['App de riego']);
  });

  it('ordena lo reciente y las páginas más conectadas', () => {
    expect(dash.recent[0].title).toBe('Huerta Viva');
    expect(dash.hubs.map((h) => h.title)).toEqual(['App de riego', 'Laura Gómez']);
  });
});