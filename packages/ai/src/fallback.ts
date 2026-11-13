import type { ProviderId } from './providers';

export type FailureKind = 'rate_limit' | 'quota' | 'auth' | 'bad_request' | 'other';

// Cuánto tiempo se deja descansar un proveedor después de cada tipo de fallo.
export const COOLDOWN_MS: Record<FailureKind, number> = {
  rate_limit: 60_000, // demasiadas peticiones por minuto
  quota: 60 * 60_000, // sin saldo o límite diario agotado
  auth: 24 * 60 * 60_000, // clave inválida o revocada
  bad_request: 0,
  other: 0,
};

function field(err: unknown, name: string): unknown {
  return typeof err === 'object' && err !== null ? (err as Record<string, unknown>)[name] : undefined;
}

export function classifyError(err: unknown): FailureKind {
  const status = Number(field(err, 'status') ?? field(err, 'statusCode'));
  const text = `${String(field(err, 'message') ?? '')} ${String(field(err, 'responseBody') ?? '')}`.toLowerCase();

  if (text.includes('insufficient_quota') || text.includes('quota') || text.includes('billing') || text.includes('credit')) {
    return 'quota';
  }
  if (status === 429 || text.includes('rate limit') || text.includes('rate_limit')) return 'rate_limit';
  if (status === 401 || status === 403) return 'auth';
  if (status === 400 || status === 413 || status === 422) return 'bad_request';
  return 'other';
}

export class Cooldowns {
  private until = new Map<ProviderId, number>();

  constructor(private now: () => number = Date.now) {}

  isCooling(provider: ProviderId): boolean {
    return (this.until.get(provider) ?? 0) > this.now();
  }

  mark(provider: ProviderId, kind: FailureKind): void {
    const ms = COOLDOWN_MS[kind];
    if (ms > 0) this.until.set(provider, this.now() + ms);
  }

  clear(provider: ProviderId): void {
    this.until.delete(provider);
  }
}

export type Attempt = { provider: ProviderId; kind: FailureKind; message: string };

export class AllProvidersFailedError extends Error {
  constructor(public attempts: Attempt[]) {
    super(
      attempts.length === 0
        ? 'No hay ningún proveedor de IA disponible. Añade una clave en Ajustes.'
        : `Todos los proveedores de IA fallaron: ${attempts.map((a) => `${a.provider} (${a.kind})`).join(', ')}`,
    );
    this.name = 'AllProvidersFailedError';
  }
}

// Prueba cada proveedor de la cadena en orden hasta que uno responda.
export async function runWithFallback<T>(
  chain: readonly ProviderId[],
  call: (provider: ProviderId) => Promise<T>,
  cooldowns: Cooldowns,
): Promise<{ provider: ProviderId; result: T; attempts: Attempt[] }> {
  const attempts: Attempt[] = [];
  for (const provider of chain) {
    if (cooldowns.isCooling(provider)) continue;
    try {
      const result = await call(provider);
      return { provider, result, attempts };
    } catch (err) {
      const kind = classifyError(err);
      // Una petición mal formada falla igual en todos los proveedores: no tiene sentido seguir.
      if (kind === 'bad_request') throw err;
      cooldowns.mark(provider, kind);
      attempts.push({ provider, kind, message: String(field(err, 'message') ?? err) });
    }
  }
  throw new AllProvidersFailedError(attempts);
}