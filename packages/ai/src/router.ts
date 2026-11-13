import { cloudChat, CLOUD } from './cloud';
import { Cooldowns, runWithFallback } from './fallback';
import { LOCAL_MODELS, ollamaChat, pickLocalModel, type ChatMessage } from './ollama';
import { buildChain, type KeyProviderId, type ProviderId } from './providers';

export type AiSettings = {
  allowCloud: boolean; // interruptor "Permitir IA en la nube"
  preferred?: ProviderId; // "Modelo preferido" (opcional)
  keys: Partial<Record<KeyProviderId, string>>;
};

export type LocalChoice = {
  model: string | null; // el modelo local que se va a usar (null = no hay ninguno usable)
  recommended: string | null; // el que corresponde por RAM
  missing: boolean; // true si el recomendado no está descargado (la app ofrecerá descargarlo)
};

// Usa el modelo recomendado si está descargado; si no, el mejor descargado que quepa en la RAM.
export function chooseLocalModel(totalRamBytes: number, installed: readonly string[]): LocalChoice {
  const recommended = pickLocalModel(totalRamBytes);
  if (!recommended) return { model: null, recommended: null, missing: false };
  const start = LOCAL_MODELS.findIndex((m) => m.model === recommended);
  const model = LOCAL_MODELS.slice(start).find((m) => installed.includes(m.model))?.model ?? null;
  return { model, recommended, missing: model !== recommended };
}

// Proveedores que se pueden usar ahora: el local si hay modelo, y las APIs solo si la nube está permitida.
export function availableProviders(localModel: string | null, settings: AiSettings): ProviderId[] {
  const out: ProviderId[] = [];
  if (localModel) out.push('ollama');
  if (settings.allowCloud) {
    for (const [provider, key] of Object.entries(settings.keys) as Array<[KeyProviderId, string | undefined]>) {
      if (key) out.push(provider);
    }
  }
  return out;
}

export type ChatResult = { provider: ProviderId; model: string; local: boolean; text: string };

export async function chat(params: {
  messages: ChatMessage[];
  localModel: string | null;
  settings: AiSettings;
  cooldowns: Cooldowns;
  fetchFn?: typeof fetch;
}): Promise<ChatResult> {
  const { messages, localModel, settings, cooldowns, fetchFn = fetch } = params;
  const chain = buildChain(availableProviders(localModel, settings), settings.preferred);

  const { provider, result } = await runWithFallback(
    chain,
    async (p): Promise<Omit<ChatResult, 'provider'>> => {
      if (p === 'ollama') {
        const text = await ollamaChat({ model: localModel!, messages }, fetchFn);
        return { model: localModel!, local: true, text };
      }
      const text = await cloudChat(p, settings.keys[p]!, { messages }, fetchFn);
      return { model: CLOUD[p].model, local: false, text };
    },
    cooldowns,
  );
  return { provider, ...result };
}