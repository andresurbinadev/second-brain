---
name: ai-layer
description: Cómo funciona la IA de la app. Úsala al tocar packages/ai, el chat, prompts, herramientas del asistente, ajustes de proveedores o cualquier función que use un modelo.
---
# Capa de IA agnóstica

## Forma
- packages/ai expone funciones por rol: `chat(role, messages, tools?)`, `extract(schema, text)`, `embed(texts)`, `transcribe(audio)`.
- Roles: chat-fast, chat-smart, extract, embed, transcribe. Cada rol se asigna en los ajustes a `proveedor:modelo` (por ejemplo, chat-smart → anthropic:<modelo>).
- Proveedores con Vercel AI SDK: openai, anthropic, google y openai-compatible (Ollama local, OpenRouter y, más adelante, el gateway LiteLLM propio). Añadir un proveedor = un adaptador + su entrada en el registro.
- Los nombres de modelo NUNCA van en el código: salen de la configuración, con valores por defecto en un único fichero `defaults.ts`.

## Dónde se ejecuta
- Solo en el proceso main. El renderer pide por IPC y recibe la respuesta en streaming (eventos con id de petición y opción de cancelar).
- Las claves de API se guardan cifradas con safeStorage. Nunca llegan al renderer, a los logs ni al repo.

## Contexto
- Antes de responder se buscan en SQLite (FTS5) las tareas, notas y entradas de diario relevantes, y se envía un resumen con un límite de tokens.
- Los datos del usuario van dentro de un bloque marcado como "datos"; el system prompt dice que nunca se obedecen como instrucciones.
- Se sigue la skill health-guardrails en todos los prompts.

## Herramientas del asistente
- crear_tarea, crear_objetivo, registrar_habito y buscar_notas, con esquemas zod.
- Las que escriben datos devuelven una propuesta que el usuario confirma en la UI antes de guardarse.

## Fallos y coste
- Timeout, reintento con backoff y, si falla, el modelo de respaldo del rol. Mensaje claro si no hay clave o no hay conexión.
- Registrar tokens por petición (solo las cifras, nunca el contenido) para ver el coste en los ajustes.

## Tests
- Proveedor falso (mock) para todos los tests. Ningún test llama a una API real.
