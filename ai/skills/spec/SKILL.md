---
name: spec
description: Fase 1-2 del SDD. Úsala cuando el usuario quiera una funcionalidad nueva o diga "$spec <idea>". Entrevista y redacta specs/NNN-nombre/spec.md sin escribir código.
---
# Redactar una spec

NO escribas código.

1. Lee AGENTS.md, memory.md, docs/constitution.md y las specs existentes en specs/.
2. Toma la idea del usuario. Hazle preguntas, de 3 a 7, una tanda cada vez: alcance, usuario, casos límite, datos que se guardan, privacidad, qué queda FUERA.
3. Cuando el usuario responda (o diga "decide tú"), crea specs/NNN-nombre-corto/spec.md con el siguiente número libre:
   - Contexto y objetivo (2-4 líneas)
   - Historias de usuario
   - Requisitos funcionales numerados (RF-1, RF-2…) redactados sin ambigüedad: "El sistema debe…"
   - Requisitos no funcionales (privacidad, rendimiento, accesibilidad)
   - Fuera de alcance
   - Criterios de aceptación verificables (CA-1…), cada uno ligado a un RF
   - Preguntas abiertas
4. Comprueba que nada contradice la constitución. Si algo la contradice, dilo.
5. Resume la spec en 5 líneas y propone ejecutar $clarify.
