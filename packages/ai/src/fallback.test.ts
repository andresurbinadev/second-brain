import { describe, expect, it } from 'vitest';
import { AllProvidersFailedError, classifyError, Cooldowns, runWithFallback } from './fallback';
import type { ProviderId } from './providers';

const httpError = (status: number, message = 'error') => Object.assign(new Error(message), { status });

describe('classifyError', () => {
  it('distingue los tipos de fallo', () => {
    expect(classifyError(httpError(429))).toBe('rate_limit');
    expect(classifyError(httpError(429, 'You exceeded your current quota (insufficient_quota)'))).toBe('quota');
    expect(classifyError(httpError(401))).toBe('auth');
    expect(classifyError(httpError(400))).toBe('bad_request');
    expect(classifyError(httpError(500))).toBe('other');
    expect(classifyError(new Error('fetch failed'))).toBe('other');
  });
});

describe('runWithFallback', () => {
  it('usa el primer proveedor si responde', async () => {
    const out = await runWithFallback(['google', 'groq'], async (p) => `hola desde ${p}`, new Cooldowns());
    expect(out.provider).toBe('google');
    expect(out.result).toBe('hola desde google');
  });

  it('pasa al siguiente cuando uno se queda sin cuota', async () => {
    const out = await runWithFallback(
      ['google', 'groq'],
      async (p) => {
        if (p === 'google') throw httpError(429, 'quota exceeded');
        return 'ok';
      },
      new Cooldowns(),
    );
    expect(out.provider).toBe('groq');
    expect(out.attempts).toEqual([{ provider: 'google', kind: 'quota', message: 'quota exceeded' }]);
  });

  it('no vuelve a llamar a un proveedor en reposo hasta que pasa el tiempo', async () => {
    let t = 0;
    const cooldowns = new Cooldowns(() => t);
    const called: ProviderId[] = [];
    const call = async (p: ProviderId) => {
      called.push(p);
      if (p === 'google' && t === 0) throw httpError(429);
      return p;
    };

    await runWithFallback(['google', 'groq'], call, cooldowns);
    await runWithFallback(['google', 'groq'], call, cooldowns);
    t = 61_000;
    const last = await runWithFallback(['google', 'groq'], call, cooldowns);

    expect(called).toEqual(['google', 'groq', 'groq', 'google']);
    expect(last.provider).toBe('google');
  });

  it('no prueba otros proveedores si la petición está mal formada', async () => {
    const called: ProviderId[] = [];
    await expect(
      runWithFallback(['google', 'groq'], async (p) => {
        called.push(p);
        throw httpError(400);
      }, new Cooldowns()),
    ).rejects.toThrow();
    expect(called).toEqual(['google']);
  });

  it('avisa con un error claro si todos fallan o no hay claves', async () => {
    await expect(runWithFallback(['google'], async () => { throw httpError(401); }, new Cooldowns()))
      .rejects.toBeInstanceOf(AllProvidersFailedError);
    await expect(runWithFallback([], async () => 'x', new Cooldowns()))
      .rejects.toThrow('Añade una clave en Ajustes');
  });
});