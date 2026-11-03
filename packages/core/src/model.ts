import { z } from 'zod';

// ── Tipos de página ──────────────────────────────────────────────
// Adaptados del esquema de la wiki de Manuel: personas, organizaciones,
// proyectos, conceptos, decisiones y documentos. "note" para lo demás.
export const PAGE_KINDS = ['person', 'organization', 'project', 'concept', 'decision', 'document', 'note'] as const;
export const PageKindSchema = z.enum(PAGE_KINDS);
export type PageKind = z.infer<typeof PageKindSchema>;

// ── De dónde viene cada dato (regla de evidencia del AIOS) ───────
// user   = lo dijo o lo escribió el usuario
// source = sale de un documento (PDF, DOCX...)
// ai     = lo interpretó o propuso la IA
export const ProvenanceSchema = z.enum(['user', 'source', 'ai']);
export type Provenance = z.infer<typeof ProvenanceSchema>;

// ── En qué estado está ───────────────────────────────────────────
export const StatusSchema = z.enum(['confirmed', 'provisional', 'pending', 'archived']);
export type Status = z.infer<typeof StatusSchema>;

// ── Página ───────────────────────────────────────────────────────
export const PageSchema = z
  .object({
    id: z.uuid(),
    kind: PageKindSchema,
    title: z.string().trim().min(1).max(200),
    body: z.string().max(200_000),
    status: StatusSchema,
    provenance: ProvenanceSchema,
    sourceRef: z.string().max(500).optional(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  // Solo el usuario puede confirmar un dato. Lo que dice una fuente o la IA
  // queda provisional hasta que el usuario lo apruebe.
  .refine((p) => p.status !== 'confirmed' || p.provenance === 'user', {
    message: 'Solo un dato del usuario puede estar confirmado',
    path: ['status'],
  });
export type Page = z.infer<typeof PageSchema>;

// ── Relación entre dos páginas ───────────────────────────────────
export const RELATIONS = ['founded', 'works_at', 'member_of', 'part_of', 'knows', 'decided_in', 'mentions', 'related_to'] as const;
export const RelationSchema = z.enum(RELATIONS);

export const RelationshipSchema = z
  .object({
    id: z.uuid(),
    fromId: z.uuid(),
    toId: z.uuid(),
    relation: RelationSchema,
    evidence: z.string().max(2_000).optional(),
    provenance: ProvenanceSchema,
    createdAt: z.iso.datetime(),
  })
  .refine((r) => r.fromId !== r.toId, { message: 'Una página no puede relacionarse consigo misma', path: ['toId'] });
export type Relationship = z.infer<typeof RelationshipSchema>;