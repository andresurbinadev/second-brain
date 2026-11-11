import type { Page, PageKind, Relationship } from './model';
import { buildGraph, mostConnected } from './graph';

export type PageSummary = Pick<Page, 'id' | 'kind' | 'title' | 'status' | 'provenance' | 'updatedAt'>;

export type Dashboard = {
  counts: { pages: number; relationships: number; orphans: number; byKind: Record<PageKind, number> };
  toReview: PageSummary[];        // propuestas de la IA o de documentos, pendientes de aprobar
  openDecisions: PageSummary[];   // decisiones que aún no están confirmadas
  activeProjects: PageSummary[];  // proyectos no archivados, los últimos tocados primero
  recent: PageSummary[];          // lo último que cambió en el cerebro
  hubs: { id: string; title: string; degree: number }[]; // las páginas más conectadas
};

const summary = (p: Page): PageSummary => ({
  id: p.id, kind: p.kind, title: p.title, status: p.status, provenance: p.provenance, updatedAt: p.updatedAt,
});
const newestFirst = (a: Page, b: Page) => b.updatedAt.localeCompare(a.updatedAt);

// Calcula todo lo que muestra el dashboard a partir de las páginas y relaciones.
// Lógica pura: no sabe de dónde vienen los datos.
export function buildDashboard(pages: Page[], relationships: Relationship[], limit = 5): Dashboard {
  const graph = buildGraph(pages, relationships);
  const byKind = { person: 0, organization: 0, project: 0, concept: 0, decision: 0, document: 0, note: 0 };
  for (const p of pages) byKind[p.kind]++;

  return {
    counts: { pages: pages.length, relationships: graph.edges.length, orphans: graph.orphans.length, byKind },
    toReview: pages.filter((p) => p.status === 'provisional' && p.provenance !== 'user').sort(newestFirst).slice(0, limit).map(summary),
    openDecisions: pages.filter((p) => p.kind === 'decision' && (p.status === 'pending' || p.status === 'provisional')).sort(newestFirst).slice(0, limit).map(summary),
    activeProjects: pages.filter((p) => p.kind === 'project' && p.status !== 'archived').sort(newestFirst).slice(0, limit).map(summary),
    recent: [...pages].sort(newestFirst).slice(0, limit).map(summary),
    hubs: mostConnected(graph, limit).filter((n) => n.degree > 0).map((n) => ({ id: n.id, title: n.title, degree: n.degree })),
  };
}