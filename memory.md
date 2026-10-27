# memory.md — estado del proyecto (máx. 50 líneas)

## Estado actual
- Fase 1 (escritorio macOS), semana 1 (27-31 oct). Harness creado: agentes agnósticos y skills.
- Siguiente: spec 001-base y después 002-release-mac.

## Decisiones
- La app reproduce el AIOS de Manuel (wiki, dashboard, agentes onboard/grill-me/level-up/audit/link/3d-brain) sin depender de Codex.
- Monorepo pensado para escritorio, web y móvil: core/ui/ai/shared compartidos.
- IA agnóstica por roles con Vercel AI SDK; claves del usuario cifradas o Ollama local. El gateway propio llega en la fase 2.
- Agentes y skills de desarrollo en ai/; pnpm sync:agents genera Codex, Claude Code y OpenCode.
- El desarrollo se hace en Windows; los builds de Mac salen de GitHub Actions (macos-latest) y los prueba Manuel.

## Problemas conocidos
- Sin certificado de Apple Developer, el DMG no está notarizado y macOS lo bloquea la primera vez.

## Última tarea
- Estructura del monorepo y agentes agnósticos.
