import { describe, expect, it } from 'vitest';
import type { Page, Relationship } from '@sb/core';
import { buildMessages, checkAnswer, extractKeywords, formatContext, NO_DATA_ANSWER, selectContext } from './grounding';

// Cerebro de prueba con datos inventados.
const now = '2026-11-01T10:00:00.000Z';
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const page = (kind: Page['kind'], title: string, body = '', status: Page['status'] = 'confirmed'): Page => ({
  id: uuid(), kind, title, body, status, provenance: status === 'confirmed' ? 'user' : 'ai', createdAt: now, updatedAt: now,
});
const rel = (from: Page, relation: Relationship['relation'], to: Page): Relationship => ({
  id: uuid(), fromId: from.id, toId: to.id, relation, provenance: 'user', createdAt: now,
});

const laura = page('person', 'Laura Gómez', 'Directora de compras. Interesada en contratos de salud.');
const clinica = page('organization', 'Clínica Norte', 'Red de clínicas privadas.');
const juan = page('person', 'Juan Pérez', 'Inversor en longevidad.');
const huerta = page('project', 'Huerta Viva', 'Proyecto de agricultura urbana.');
const viejo = page('person', 'Contacto antiguo', '', 'archived');
const pages = [laura, clinica, juan, huerta, viejo];
const rels = [rel(laura, 'works_at', clinica), rel(juan, 'knows', laura)];

describe('extractKeywords', () => {
  it('quita palabras vacías y tildes', () => {
    expect(extractKeywords('¿A quién debería llamar para conseguir contratos de salud?')).toEqual(['llamar', 'contratos', 'salud']);
  });
});

describe('selectContext', () => {
  it('incluye lo encontrado y sus vecinos, sin páginas archivadas', () => {
    const ctx = selectContext([laura.id], pages, rels, 3);
    expect(ctx.pages.map((c) => c.page.title)).toEqual(['Laura Gómez', 'Clínica Norte', 'Juan Pérez']);
    expect(ctx.pages.map((c) => c.ref)).toEqual(['p1', 'p2', 'p3']);
    expect(ctx.relationships).toHaveLength(2);
  });

  it('nunca incluye páginas archivadas', () => {
    const ctx = selectContext([viejo.id], pages, rels);
    expect(ctx.pages.some((c) => c.page.id === viejo.id)).toBe(false);
  });
});

describe('formatContext', () => {
  it('escribe páginas y relaciones con referencias cortas', () => {
    const text = formatContext(selectContext([laura.id], pages, rels, 3));
    expect(text).toContain('[p1] Persona: Laura Gómez — Directora de compras');
    expect(text).toContain('[r1] Laura Gómez [p1] trabaja en Clínica Norte [p2]');
    expect(text).toContain('[r2] Juan Pérez [p3] conoce a Laura Gómez [p1]');
  });

  it('marca lo que no está confirmado', () => {
    const idea = page('note', 'Idea sin revisar', 'algo', 'provisional');
    expect(formatContext(selectContext([idea.id], [idea], []))).toContain('Idea sin revisar (sin confirmar)');
  });

  it('el prompt lleva las reglas y los datos', () => {
    const [system, user] = buildMessages('¿A quién llamo?', selectContext([laura.id], pages, rels, 3));
    expect(system.content).toContain('Usa SOLO la información de DATOS');
    expect(user.content).toContain('PREGUNTA: ¿A quién llamo?');
  });
});

describe('checkAnswer', () => {
  const ctx = selectContext([laura.id], pages, rels, 3);

  it('acepta una respuesta con todas las fuentes reales', () => {
    const out = checkAnswer(
      'Recomendación: llama a Laura Gómez [p1].\nPor qué:\n- Trabaja en Clínica Norte [r1].\n- Juan Pérez te la puede presentar [r2].',
      ctx,
    );
    expect(out.grounded).toBe(true);
    expect(out.citedPageIds).toEqual([laura.id, clinica.id, juan.id]);
  });

  it('detecta fuentes inventadas', () => {
    const out = checkAnswer('Llama a Pedro, socio de Laura Gómez [p9].', ctx);
    expect(out.unknownRefs).toEqual(['p9']);
    expect(out.grounded).toBe(false);
  });

  it('detecta frases con datos pero sin fuente', () => {
    const out = checkAnswer('Llama a Laura Gómez [p1].\n- Además Juan es socio de la Clínica Norte desde 2020.', ctx);
    expect(out.unsupported).toEqual(['Además Juan es socio de la Clínica Norte desde 2020.']);
    expect(out.grounded).toBe(false);
  });

  it('reconoce cuando no hay datos', () => {
    const out = checkAnswer(`No tengo información sobre eso en tu cerebro`, ctx);
    expect(out).toMatchObject({ noData: true, grounded: true, text: NO_DATA_ANSWER });
  });

  it('una respuesta sin ninguna cita no es fiable', () => {
    expect(checkAnswer('Te recomiendo llamar a alguien del sector salud.', ctx).grounded).toBe(false);
  });
});