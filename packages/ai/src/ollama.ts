export const OLLAMA_URL = 'http://127.0.0.1:11434';

const GB = 1024 ** 3;

// Modelo local según la RAM del ordenador. Por debajo de 16 GB no usamos local: iría lento y respondería mal.
// La prueba de las 20 preguntas decidirá si estos modelos se quedan o se cambian.
export const LOCAL_MODELS: ReadonlyArray<{ minRamGb: number; model: string }> = [
  { minRamGb: 32, model: 'qwen3:30b' },
  { minRamGb: 24, model: 'qwen3:14b' },
  { minRamGb: 16, model: 'qwen3:8b' },
];

export function pickLocalModel(totalRamBytes: number): string | null {
  const gb = totalRamBytes / GB;
  // Margen de 1 GB porque los sistemas reportan un poco menos de lo que dice la etiqueta (16 GB -> 15,8).
  return LOCAL_MODELS.find((m) => gb >= m.minRamGb - 1)?.model ?? null;
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type OllamaStatus = { running: boolean; models: string[] };

type Fetch = typeof fetch;

// ¿Está Ollama encendido y qué modelos tiene descargados?
export async function getOllamaStatus(fetchFn: Fetch = fetch, baseUrl = OLLAMA_URL): Promise<OllamaStatus> {
  try {
    const res = await fetchFn(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { running: false, models: [] };
    const data = (await res.json()) as { models?: Array<{ name?: unknown }> };
    const models = (data.models ?? []).map((m) => m.name).filter((n): n is string => typeof n === 'string');
    return { running: true, models };
  } catch {
    return { running: false, models: [] };
  }
}

// Algunos modelos (como qwen3) escriben su razonamiento entre <think> y </think>: no se lo mostramos al usuario.
export function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

export type ChatOptions = { model: string; messages: ChatMessage[]; temperature?: number; maxTokens?: number };

export async function ollamaChat(opts: ChatOptions, fetchFn: Fetch = fetch, baseUrl = OLLAMA_URL): Promise<string> {
  const res = await fetchFn(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      stream: false,
      options: { temperature: opts.temperature ?? 0.1, num_predict: opts.maxTokens ?? 800 },
    }),
  });
  if (!res.ok) {
    // Pasamos el código HTTP en el error para que runWithFallback sepa qué tipo de fallo fue.
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error(`Ollama respondió ${res.status}: ${body.slice(0, 200)}`), { status: res.status });
  }
  const data = (await res.json()) as { message?: { content?: unknown } };
  const content = data.message?.content;
  if (typeof content !== 'string') throw new Error('Ollama devolvió una respuesta sin texto');
  return stripThinking(content);
}