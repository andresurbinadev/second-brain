# Roadmap

Objetivo: reproducir el second brain de Manuel (AIOS de Codex) como app de escritorio para Mac,
con IA multi-modelo integrada y sin depender de Codex.

## Fase 1 — Escritorio macOS (27 oct – 21 nov) → v0.1 para Manuel
- S1: 001-base (monorepo, ventana segura, bóveda SQLite cifrada) · 002-release-mac (CI + DMG + auto-actualización)
- S2: 003-importar-cerebro (wiki, relationships.json, intake, decisiones, manual de operación) · 004-dashboard (prioridades, decisiones y puertas, preguntas abiertas, búsqueda, lector de notas)
- S3: 005-asistente (packages/ai: roles, proveedores, claves cifradas, chat con la wiki como contexto) · 006-agentes-aios (onboard, grill-me, level-up, audit y link como agentes de la app)
- S4: 007-cerebro-3d (reutiliza apps/3d-brain) · 008-google (Calendar y Gmail en modo prueba: calendario e inbox intelligence) · v0.1

## Fase 2 — Web (meses 2-3)
- Servidor en Hetzner (API + Postgres + LiteLLM), cuentas, sincronización cifrada, ingesta automática desde Drive, multi-cliente

## Fase 3 — Móvil (meses 4-5)
- Expo reutilizando core, shared y el gateway: captura rápida, voz a texto, Hoy y el asistente
