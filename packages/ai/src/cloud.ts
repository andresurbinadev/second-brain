import type { ChatMessage } from './ollama';
import type { KeyProviderId } from './providers';

// Cómo hablar con cada API. Casi todas copian el formato de OpenAI; Anthropic tiene el suyo.
// Los modelos cambian a menudo: si un proveedor retira uno, solo hay que cambiarlo aquí.
export const CLOUD: Record<KeyProviderId, { baseUrl: string; model: string; format: 'openai' | 'anthropic'; reasoning?: boolean }> = {
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-5-5', format: 'anthropic' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-5-mini', format: 'openai', reasoning: true },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-3.8-flash', format: 'openai' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', model: 'openrouter/auto', format: 'openai' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b', format: 'openai' },
  xai: { baseUrl: 'https://api.x.ai/v1', model: 'grok-4', format: 'openai' },
};

export type CloudChatOptions = { messages: ChatMessage[]; temperature?: number; maxTokens?: number; model?: string };

type Fetch = typeof fetch;

async function fail(res: Response, provider: KeyProviderId): Promise<never> {
  const responseBody = (await res.text().catch(() => '')).slice(0, 500);
  // status y responseBody los usa classifyError para saber si fue límite, saldo o clave mala.
  throw Object.assign(new Error(`${provider} respondió ${res.status}`), { status: res.status, responseBody });
}

export async function cloudChat(provider: KeyProviderId, apiKey: string, opts: CloudChatOptions, fetchFn: Fetch = fetch): Promise<string> {
  const cfg = CLOUD[provider];
  const model = opts.model ?? cfg.model;
  const maxTokens = opts.maxTokens ?? 800;
  const temperature = opts.temperature ?? 0.1;

  if (cfg.format === 'anthropic') {
    const system = opts.messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    const res = await fetchFn(`${cfg.baseUrl}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model,
        system,
        messages: opts.messages.filter((m) => m.role !== 'system'),
        max_tokens: maxTokens,
        temperature,
      }),
    });
    if (!res.ok) return fail(res, provider);
    const data = (await res.json()) as { content?: Array<{ type?: string; text?: unknown }> };
    const text = (data.content ?? []).filter((c) => c.type === 'text' && typeof c.text === 'string').map((c) => c.text).join('');
    if (!text) throw new Error(`${provider} devolvió una respuesta sin texto`);
    return text.trim();
  }

  // Los modelos de razonamiento de OpenAI no aceptan temperature y usan max_completion_tokens.
  const limits = cfg.reasoning ? { max_completion_tokens: maxTokens * 4 } : { max_tokens: maxTokens, temperature };
  const res = await fetchFn(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages: opts.messages, ...limits }),
  });
  if (!res.ok) return fail(res, provider);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new Error(`${provider} devolvió una respuesta sin texto`);
  return content.trim();
}