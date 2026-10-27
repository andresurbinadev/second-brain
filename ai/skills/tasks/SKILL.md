---
name: tasks
description: Fase 5 del SDD. Convierte plan.md en una lista de tareas pequeñas en tasks.md ("$tasks 001").
---
# Crear tareas

1. Lee spec.md y plan.md de la carpeta indicada.
2. Crea tasks.md con tareas T1, T2… en orden de dependencia. Cada una:
   - `- [ ] T1 — título` + ficheros + qué RF/CA cubre + cómo se verifica
   - Tamaño: un commit revisable (menos de ~200 líneas cambiadas)
3. Primero la base (tipos, DB, lógica + tests), después IPC/preload, después UI y al final e2e.
4. No implementes nada todavía.
