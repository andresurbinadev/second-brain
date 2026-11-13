import { describe, expect, it } from 'vitest';
import type { Page, Relationship } from '@sb/core';
import { buildMessages, checkAnswer, extractKeywords, selectContext } from './grounding';
import { getOllamaStatus, ollamaChat } from './ollama';

// Prueba con el modelo de verdad. No corre con "pnpm test": solo si OLLAMA_LIVE=1.
const LIVE = process.env.OLLAMA_LIVE === '1';
const MODEL = process.env.OLLAMA_MODEL ?? 'qwen3:8b';

// Cerebro de prueba con datos inventados.
const now = '2026-11-01T10:00:00.000Z';
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const page = (kind: Page['kind'], title: string, body: string): Page => ({
  id: uuid(), kind, title, body, status: 'confirmed', provenance: 'user', createdAt: now, updatedAt: now,
});
const rel = (from: Page, relation: Relationship['relation'], to: Page, evidence?: string): Relationship => ({
  id: uuid(), fromId: from.id, toId: to.id, relation, evidence, provenance: 'user', createdAt: now,
});

const laura = page('person', 'Laura Gómez', 'Directora de compras en una red de clínicas. Busca proveedores de programas de bienestar para empleados. Último contacto: octubre 2026.');
const clinica = page('organization', 'Clínica Norte', 'Red de 12 clínicas privadas en el norte de España.');
const juan = page('person', 'Juan Pérez', 'Inversor en salud y longevidad. Conoce a Manuel desde 2023. Muy buena relación.');
const sofia = page('person', 'Sofía Martín', 'Diseñadora freelance. Hizo la web de Huerta Viva.');
const huerta = page('project', 'Huerta Viva', 'Proyecto de agricultura urbana. Busca financiación.');
const fondo = page('organization', 'Fondo Verde', 'Fondo de inversión en proyectos sostenibles.');
const marta = page('person', 'Marta Ruiz', 'Socia de Fondo Verde. Interesada en agricultura y alimentación.');
const pages = [laura, clinica, juan, sofia, huerta, fondo, marta];
const rels = [
  rel(laura, 'works_at', clinica),
  rel(juan, 'knows', laura, 'Juan presentó a Laura en un evento en 2025'),
  rel(sofia, 'part_of', huerta),
  rel(marta, 'works_at', fondo),
];

// Búsqueda simple para la prueba (en la app la hace SQLite con FTS5).
const strip = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
function seeds(question: string): string[] {
  const words = extractKeywords(question);
  return pages.filter((p) => words.some((w) => strip(`${p.title} ${p.body}`).includes(w))).map((p) => p.id);
}

async function ask(question: string) {
  const ctx = selectContext(seeds(question), pages, rels);
  const start = Date.now();
  const text = await ollamaChat({ model: MODEL, messages: buildMessages(question, ctx) });
  const checked = checkAnswer(text, ctx);
  console.log(
    `\n──────── ${question}\n${text}\n\n` +
      `fiable: ${checked.grounded} | sin datos: ${checked.noData} | fuentes inventadas: ${checked.unknownRefs.join(', ') || 'ninguna'}\n` +
      `frases sin fuente: ${checked.unsupported.length ? checked.unsupported.join(' | ') : 'ninguna'}\n` +
      `tiempo: ${((Date.now() - start) / 1000).toFixed(1)} s`,
  );
  return checked;
}

describe.skipIf(!LIVE)(`Ollama en vivo (${MODEL})`, () => {
  it('Ollama está encendido y tiene el modelo', async () => {
    const status = await getOllamaStatus();
    expect(status.running).toBe(true);
    expect(status.models).toContain(MODEL);
  });

  it('recomienda a quién llamar usando solo datos del cerebro', async () => {
    const out = await ask('¿A quién debería llamar para conseguir contratos con clínicas?');
    expect(out.unknownRefs).toEqual([]);
    expect(out.citedPageIds).toContain(laura.id);
  }, 180_000);

  it('encuentra quién puede hacer una presentación', async () => {
    const out = await ask('¿Quién me puede presentar a Laura Gómez?');
    expect(out.unknownRefs).toEqual([]);
    expect(out.citedPageIds).toContain(juan.id);
  }, 180_000);

  it('dice que no sabe cuando no hay datos', async () => {
    const out = await ask('¿Qué sabes de Pedro Ramírez, el abogado de Madrid?');
    expect(out.unknownRefs).toEqual([]);
    expect(out.citedPageIds).not.toContain(laura.id);
  }, 180_000);
});