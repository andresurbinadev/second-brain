# Constitución — Second Brain

Principios innegociables. Si una spec o un plan los contradice, gana la constitución.

1. **Privacidad primero.** Los datos del usuario viven cifrados en su equipo. Nada sale sin que el usuario lo sepa: la app muestra qué proveedor de IA recibe cada petición y permite usar un modelo local.
2. **La spec manda.** No se escribe código sin una spec aprobada.
3. **Evidencia antes que interpretación.** Como en el AIOS de Manuel: se distingue lo confirmado por el usuario, lo que dice una fuente y lo que interpreta la IA. Una previsión no es un ingreso, un plan no es una tarea hecha.
4. **Modelo intercambiable.** Cambiar de proveedor o de modelo es cambiar la configuración, no el código. Las funciones piden un rol (chat-fast, chat-smart, extract, embed, transcribe), nunca un modelo concreto.
5. **Plataforma intercambiable.** La lógica vive en packages/core y la UI en packages/ui, sin depender de Electron. La web y el móvil cambian solo el adaptador PlatformApi.
6. **Seguridad de Electron por defecto.** contextIsolation y sandbox activados, sin nodeIntegration, IPC validado con zod.
7. **Sin diagnósticos.** En salud, solo información general y derivación a un profesional.
8. **Simple, probado y publicable.** La solución más simple que cumpla la spec, con tests. La rama main siempre compila y genera un instalador; se publica con un tag.
