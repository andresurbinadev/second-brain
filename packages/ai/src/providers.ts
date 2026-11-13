export const PROVIDERS = ['ollama', 'anthropic', 'openai', 'google', 'openrouter', 'groq', 'xai'] as const;
export type ProviderId = (typeof PROVIDERS)[number];

// Proveedores que necesitan clave. Ollama corre en el ordenador del usuario y no usa clave.
export type KeyProviderId = Exclude<ProviderId, 'ollama'>;

// Orden de respaldo por defecto: primero el modelo local (privacidad), luego las APIs si alguien añadió una clave.
export const DEFAULT_ORDER: readonly ProviderId[] = ['ollama', 'anthropic', 'openai', 'google', 'openrouter', 'groq', 'xai'];

// El orden de las reglas importa: "sk-ant-" y "sk-or-" también empiezan por "sk-".
const PREFIXES: ReadonlyArray<[string, KeyProviderId]> = [
  ['sk-ant-', 'anthropic'],
  ['sk-or-', 'openrouter'],
  ['sk-', 'openai'],
  ['AIza', 'google'],
  ['gsk_', 'groq'],
  ['xai-', 'xai'],
];

export function detectProvider(key: string): KeyProviderId | null {
  const clean = key.trim();
  if (clean.length < 20 || /\s/.test(clean)) return null;
  for (const [prefix, provider] of PREFIXES) {
    if (clean.startsWith(prefix)) return provider;
  }
  return null;
}

// Cadena de proveedores a probar: el preferido primero (si tiene clave), luego el orden por defecto.
export function buildChain(available: Iterable<ProviderId>, preferred?: ProviderId): ProviderId[] {
  const has = new Set(available);
  const chain = DEFAULT_ORDER.filter((p) => has.has(p));
  if (preferred && has.has(preferred)) {
    return [preferred, ...chain.filter((p) => p !== preferred)];
  }
  return chain;
}