import { describe, it, expect } from 'vitest';
import { EchoInputSchema, AppInfoSchema } from './index';

describe('EchoInputSchema', () => {
  it('acepta un texto normal', () => {
    expect(EchoInputSchema.parse('hola')).toBe('hola');
  });

  it('rechaza lo que no es texto', () => {
    expect(() => EchoInputSchema.parse(123)).toThrow();
    expect(() => EchoInputSchema.parse({ cmd: 'rm -rf /' })).toThrow();
  });

  it('rechaza el texto vacío y el demasiado largo', () => {
    expect(() => EchoInputSchema.parse('')).toThrow();
    expect(() => EchoInputSchema.parse('a'.repeat(501))).toThrow();
  });
});

describe('AppInfoSchema', () => {
  it('rechaza un sistema operativo desconocido', () => {
    expect(() => AppInfoSchema.parse({ name: 'x', version: '1', platform: 'android' })).toThrow();
  });
});