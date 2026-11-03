import { PageSchema, type Page, type PageKind, type Provenance, type Status } from './model';

export type NewPage = {
  kind: PageKind;
  title: string;
  body?: string;
  provenance?: Provenance;
  status?: Status;
  sourceRef?: string;
};

// Crea una página válida con valores por defecto.
// `now` e `id` se pueden pasar desde fuera para que los tests sean repetibles.
export function createPage(
  input: NewPage,
  now: Date = new Date(),
  id: string = globalThis.crypto.randomUUID(),
): Page {
  const provenance = input.provenance ?? 'user';
  const stamp = now.toISOString();
  return PageSchema.parse({
    id,
    kind: input.kind,
    title: input.title,
    body: input.body ?? '',
    provenance,
    // Lo que escribe el usuario nace confirmado; lo demás, provisional.
    status: input.status ?? (provenance === 'user' ? 'confirmed' : 'provisional'),
    sourceRef: input.sourceRef,
    createdAt: stamp,
    updatedAt: stamp,
  });
}