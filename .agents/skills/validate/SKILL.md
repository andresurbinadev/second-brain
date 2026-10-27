---
name: validate
description: Fase 7 del SDD. Comprueba que la spec está cumplida de punta a punta ("$validate 001").
---
# Validar

1. Ejecuta pnpm typecheck, pnpm lint, pnpm test y los e2e de Playwright.
2. Recorre cada CA del spec.md y deja en la carpeta un validation.md con una tabla: CA | cómo se verificó | resultado (✅/❌) | evidencia.
3. Si hay UI: abre la app, recorre el flujo, revisa la consola y haz capturas (si está el MCP de Chrome DevTools, úsalo).
4. Revisa las reglas de electron-security y health-guardrails sobre los ficheros tocados.
5. Veredicto final: "Spec cumplida" o la lista de lo que falta, con las tareas nuevas añadidas a tasks.md.
6. Actualiza memory.md.
