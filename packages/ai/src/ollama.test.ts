import { describe, expect, it } from 'vitest';
import { getOllamaStatus, ollamaChat, pickLocalModel, stripThinking } from './ollama';

const GB = 1024 ** 3;

// Un fetch falso: devuelve lo que le digamos y guarda lo que la app le envió.
function fakeFetch(status: number, body: unknown) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe('pickLocalModel', () => {
  it('elige el modelo según la RAM', () => {
    expect(pickLocalModel(64 * GB)).toBe('qwen3:30b');
    expect(pickLocalModel(32 * GB)).toBe('qwen3:30b');
    expect(pickLocalModel(24 * GB)).toBe('qwen3:14b');
    expect(pickLocalModel(16 * GB)).toBe('qwen3:8b');
  });

  it('tolera que el sistema reporte un poco menos de RAM', () => {
    expect(pickLocalModel(15.8 * GB)).toBe('qwen3:8b');
  });

  it('no usa modelo local con menos de 16 GB', () => {
    expect(pickLocalModel(8 * GB)).toBeNull();
  });
});

describe('getOllamaStatus', () => {
  it('lista los modelos descargados', async () => {
    const { fn } = fakeFetch(200, { models: [{ name: 'qwen3:8b' }, { name: 'llama3.2:3b' }] });
    expect(await getOllamaStatus(fn)).toEqual({ running: true, models: ['qwen3:8b', 'llama3.2:3b'] });
  });

  it('dice que no está encendido si no responde', async () => {
    const fn = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
    expect(await getOllamaStatus(fn)).toEqual({ running: false, models: [] });
  });
});

describe('ollamaChat', () => {
  it('envía la conversación y devuelve el texto sin el razonamiento interno', async () => {
    const { fn, calls } = fakeFetch(200, { message: { content: '<think>pensando...</think>\nHola Manuel' } });
    const text = await ollamaChat({ model: 'qwen3:8b', messages: [{ role: 'user', content: 'hola' }] }, fn);

    expect(text).toBe('Hola Manuel');
    expect(calls[0].url).toBe('http://127.0.0.1:11434/api/chat');
    const sent = JSON.parse(String(calls[0].init?.body));
    expect(sent).toMatchObject({ model: 'qwen3:8b', stream: false, options: { temperature: 0.1 } });
  });

  it('lanza un error con el código HTTP para que el respaldo lo clasifique', async () => {
    const { fn } = fakeFetch(404, 'model not found');
    await expect(ollamaChat({ model: 'x', messages: [] }, fn)).rejects.toMatchObject({ status: 404 });
  });
});

describe('stripThinking', () => {
  it('quita varios bloques de razonamiento', () => {
    expect(stripThinking('<think>a</think>Uno <think>b</think>dos')).toBe('Uno dos');
  });
});