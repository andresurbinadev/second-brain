---
name: implement
description: Fase 6 del SDD. Implementa tareas de tasks.md ("$implement 001 T1" o "$implement 001 todo").
---
# Implementar

1. Lee AGENTS.md, memory.md, docs/constitution.md, spec.md, plan.md y tasks.md.
2. Si no se indica tarea, haz SOLO la primera sin marcar. Con "todo", hazlas en orden, parando si un test falla dos veces.
3. Para cada tarea: escribe el test primero cuando sea posible → implementa → pnpm typecheck && pnpm test → marca [x] en tasks.md → commit convencional.
4. Si descubres que la spec o el plan estaban mal, PARA y explica el cambio propuesto. No improvises fuera de la spec.
5. Al terminar, actualiza memory.md (estado, decisiones, problemas) y resume qué cambió y cómo probarlo.
