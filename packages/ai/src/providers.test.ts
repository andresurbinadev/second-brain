import { describe, expect, it } from 'vitest';
import { buildChain, detectProvider } from './providers';

const pad = (prefix: string) => prefix + 'x'.repeat(30);

describe('detectProvider', () => {
  it('reconoce cada proveedor por el prefijo de la clave', () => {
    expect(detectProvider(pad('sk-ant-'))).toBe('anthropic');
    expect(detectProvider(pad('sk-or-v1-'))).toBe('openrouter');
    expect(detectProvider(pad('sk-proj-'))).toBe('openai');
    expect(detectProvider(pad('sk-'))).toBe('openai');
    expect(detectProvider(pad('AIza'))).toBe('google');
    expect(detectProvider(pad('gsk_'))).toBe('groq');
    expect(detectProvider(pad('xai-'))).toBe('xai');
  });

  it('ignora espacios al principio y al final', () => {
    expect(detectProvider(`  ${pad('gsk_')}\n`)).toBe('groq');
  });

  it('rechaza claves desconocidas, cortas o con espacios dentro', () => {
    expect(detectProvider(pad('hola'))).toBeNull();
    expect(detectProvider('gsk_corta')).toBeNull();
    expect(detectProvider('gsk_ abc def ghi jkl mno pqr')).toBeNull();
  });
});

describe('buildChain', () => {
  it('usa el orden por defecto con los proveedores que tienen clave', () => {
    expect(buildChain(['groq', 'google', 'anthropic'])).toEqual(['anthropic', 'google', 'groq']);
  });

  it('pone primero el preferido si tiene clave', () => {
    expect(buildChain(['groq', 'google'], 'groq')).toEqual(['groq', 'google']);
  });

  it('pone el modelo local primero cuando está disponible', () => {
    expect(buildChain(['groq', 'ollama'])).toEqual(['ollama', 'groq']);
  });

  it('ignora el preferido si no tiene clave', () => {
    expect(buildChain(['google'], 'openai')).toEqual(['google']);
  });
});