import { describe, it, expect } from 'vitest';
import { AppInfoSchema, NewPageInputSchema, PageIdSchema, SearchInputSchema } from './index';

describe('NewPageInputSchema', () => {
  it('acepta una página nueva válida', () => {
    expect(NewPageInputSchema.parse({ kind: 'project', title: 'App de riego' }).title).toBe('App de riego');
  });

  it('rechaza un título vacío o un tipo desconocido', () => {
    expect(() => NewPageInputSchema.parse({ kind: 'project', title: '  ' })).toThrow();
    expect(() => NewPageInputSchema.parse({ kind: 'planeta', title: 'Marte' })).toThrow();
  });
});

describe('SearchInputSchema y PageIdSchema', () => {
  it('rechaza búsquedas que no son texto o son demasiado largas', () => {
    expect(() => SearchInputSchema.parse(123)).toThrow();
    expect(() => SearchInputSchema.parse('a'.repeat(201))).toThrow();
  });

  it('rechaza un id que no es un UUID', () => {
    expect(() => PageIdSchema.parse("1'; DROP TABLE pages; --")).toThrow();
  });
});

describe('AppInfoSchema', () => {
  it('rechaza un sistema operativo desconocido', () => {
    expect(() => AppInfoSchema.parse({ name: 'x', version: '1', platform: 'android' })).toThrow();
  });
});