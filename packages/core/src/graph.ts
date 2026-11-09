import type { Page, PageKind, Relationship } from './model';

export type GraphNode = { id: string; title: string; kind: PageKind; degree: number };
export type GraphEdge = { id: string; source: string; target: string; relation: string };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[]; orphans: string[] };

// Construye el grafo del cerebro: cada página es un nodo y cada relación una arista.
// Es la misma idea que wiki-adapter.mjs del AIOS de Manuel, pero leyendo datos ya validados.
export function buildGraph(pages: Page[], relationships: Relationship[]): Graph {
  const degree = new Map<string, number>(pages.map((p) => [p.id, 0]));
  const edges: GraphEdge[] = [];

  for (const r of relationships) {
    // Una relación que apunta a una página que no está en la lista se ignora.
    if (!degree.has(r.fromId) || !degree.has(r.toId)) continue;
    edges.push({ id: r.id, source: r.fromId, target: r.toId, relation: r.relation });
    degree.set(r.fromId, degree.get(r.fromId)! + 1);
    degree.set(r.toId, degree.get(r.toId)! + 1);
  }

  const nodes = pages.map((p) => ({ id: p.id, title: p.title, kind: p.kind, degree: degree.get(p.id)! }));
  const orphans = nodes.filter((n) => n.degree === 0).map((n) => n.id);
  return { nodes, edges, orphans };
}

// Las páginas más conectadas: suelen ser las más importantes del cerebro.
export function mostConnected(graph: Graph, limit = 5): GraphNode[] {
  return [...graph.nodes].sort((a, b) => b.degree - a.degree || a.title.localeCompare(b.title)).slice(0, limit);
}