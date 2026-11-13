import { describe, expect, it } from 'vitest';
import { cloudChat } from './cloud';
import { classifyError } from './fallback';

function fakeFetch(status: number, body: unknown) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fn, calls };
}

const messages = [
  { role: 'system' as const, content: 'reglas' },
  { role: 'user' as const, content: 'hola' },
];

describe('cloudChat', () => {
  it('habla con Groq en formato OpenAI', async () => {
    const { fn, calls } = fakeFetch(200, { choices: [{ message: { content: ' Hola ' } }] });
    expect(await cloudChat('groq', 'gsk_test', { messages }, fn)).toBe('Hola');

    expect(calls[0].url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer gsk_test');
    expect(JSON.parse(String(calls[0].init?.body))).toMatchObject({ messages, max_tokens: 800, temperature: 0.1 });
  });

  it('a OpenAI no le manda temperature (sus modelos de razonamiento la rechazan)', async () => {
    const { fn, calls } = fakeFetch(200, { choices: [{ message: { content: 'ok' } }] });
    await cloudChat('openai', 'sk-test', { messages }, fn);
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body.temperature).toBeUndefined();
    expect(body.max_completion_tokens).toBeGreaterThan(0);
  });

  it('habla con Anthropic en su propio formato, con las reglas aparte', async () => {
    const { fn, calls } = fakeFetch(200, { content: [{ type: 'text', text: 'Hola Manuel' }] });
    expect(await cloudChat('anthropic', 'sk-ant-test', { messages }, fn)).toBe('Hola Manuel');

    expect(calls[0].url).toBe('https://api.anthropic.com/v1/messages');
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body.system).toBe('reglas');
    expect(body.messages).toEqual([{ role: 'user', content: 'hola' }]);
  });

  it('un error de saldo se clasifica como quota para pasar al siguiente proveedor', async () => {
    const { fn } = fakeFetch(429, { error: { code: 'insufficient_quota' } });
    const err = await cloudChat('openai', 'sk-test', { messages }, fn).catch((e) => e);
    expect(err.status).toBe(429);
    expect(classifyError(err)).toBe('quota');
  });

  it('una respuesta vacía es un error', async () => {
    const { fn } = fakeFetch(200, { choices: [{ message: { content: '' } }] });
    await expect(cloudChat('google', 'AIza-test', { messages }, fn)).rejects.toThrow('sin texto');
  });
});