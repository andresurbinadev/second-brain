---
name: plan
description: Fase 4 del SDD. Úsala cuando la spec esté aprobada y haya que decidir cómo implementarla ("$plan 001"). Genera plan.md sin escribir código.
---
# Planificar

NO escribas código de producción.

1. Lee AGENTS.md, docs/constitution.md, memory.md, el spec.md y el código actual relacionado.
2. Crea plan.md en la misma carpeta con:
   - Enfoque técnico en pocas líneas
   - Ficheros a crear o modificar (ruta + qué cambia)
   - Cambios de base de datos (tablas, migración, índices)
   - API del preload/IPC nueva (firma tipada + validación)
   - Estrategia de tests: qué RF/CA cubre cada test
   - Riesgos y alternativas descartadas
   - Dependencias nuevas (justificadas) o "ninguna"
3. Comprueba la constitución punto por punto y deja una línea por principio: cumple / no cumple / no aplica.
4. Propón ejecutar $clarify sobre el plan o pasar a $tasks.
