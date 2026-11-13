import { describe, expect, it } from 'vitest';
import { Cooldowns } from './fallback';
import { availableProviders, chat, chooseLocalModel, type AiSettings } from './router';

const GB = 1024 ** 3;

describe('chooseLocalModel', () => {
  it('usa el recomendado si está descargado', () => {
    expect(chooseLocalModel(32 * GB, ['qwen3:30b', 'qwen3:8b'])).toEqual({ model: 'qwen3:30b', recommended: 'qwen3:30b', missing: false });
  });

  it('si falta el recomendado usa el mejor que sí está descargado', () => {
    expect(chooseLocalModel(32 * GB, ['qwen3:8b'])).toEqual({ model: 'qwen3:8b', recommended: 'qwen3:30b', missing: true });
  });

  it('nunca usa un modelo más grande del que cabe en la RAM', () => {
    expect(chooseLocalModel(16 * GB, ['qwen3:30b']).model).toBeNull();
  });

  it('sin RAM suficiente no hay modelo local', () => {
    expect(chooseLocalModel(8 * GB, ['qwen3:8b'])).toEqual({ model: null, recommended: null, missing: false });
  });
});

describe('availableProviders', () => {
  const keys = { groq: 'gsk_x', google: 'AIza_x' };

  it('con la nube apagada solo usa el modelo local', () => {
    expect(availableProviders('qwen3:8b', { allowCloud: false, keys })).toEqual(['ollama']);
  });

  it('con la nube encendida añade las APIs con clave', () => {
    expect(availableProviders('qwen3:8b', { allowCloud: true, keys })).toEqual(['ollama', 'groq', 'google']);
  });

  it('sin modelo local y sin nube no hay nada', () => {
    expect(availableProviders(null, { allowCloud: false, keys })).toEqual([]);
  });
});

describe('chat', () => {
  const settings: AiSettings = { allowCloud: true, keys: { groq: 'gsk_x' } };
  const messages = [{ role: 'user' as const, content: 'hola' }];

  it('responde con el modelo local cuando funciona', async () => {
    const fetchFn = (async () => new Response(JSON.stringify({ message: { content: 'local ok' } }))) as unknown as typeof fetch;
    const out = await chat({ messages, localModel: 'qwen3:8b', settings, cooldowns: new Cooldowns(), fetchFn });
    expect(out).toEqual({ provider: 'ollama', model: 'qwen3:8b', local: true, text: 'local ok' });
  });

  it('si Ollama está apagado pasa a la nube y lo marca como no local', async () => {
    const fetchFn = (async (url: string) => {
      if (url.includes('11434')) throw new Error('fetch failed');
      return new Response(JSON.stringify({ choices: [{ message: { content: 'nube ok' } }] }));
    }) as unknown as typeof fetch;
    const out = await chat({ messages, localModel: 'qwen3:8b', settings, cooldowns: new Cooldowns(), fetchFn });
    expect(out).toMatchObject({ provider: 'groq', local: false, text: 'nube ok' });
  });

  it('con la nube apagada nunca envía datos fuera aunque falle lo local', async () => {
    const urls: string[] = [];
    const fetchFn = (async (url: string) => {
      urls.push(url);
      throw new Error('fetch failed');
    }) as unknown as typeof fetch;
    await expect(
      chat({ messages, localModel: 'qwen3:8b', settings: { ...settings, allowCloud: false }, cooldowns: new Cooldowns(), fetchFn }),
    ).rejects.toThrow();
    expect(urls.every((u) => u.startsWith('http://127.0.0.1:11434'))).toBe(true);
  });
});