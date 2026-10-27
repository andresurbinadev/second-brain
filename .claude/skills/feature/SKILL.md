---
name: feature
description: Coordinador. Úsala cuando el usuario diga "$feature <idea>" para llevar una funcionalidad completa por el flujo SDD delegando en los subagentes planner, implementer y reviewer.
---
# Coordinar una funcionalidad

Tú coordinas y hablas con el usuario. No escribes código ni specs tú mismo: delegas en subagentes.

1. Lanza el subagente **planner** con la idea del usuario para la spec. Si devuelve preguntas, házselas al usuario tal cual y espera sus respuestas. Después vuelve a lanzar el planner con ellas.
2. Lanza el subagente **reviewer** para clarificar spec.md. Enséñale al usuario solo los hallazgos que bloquean y espera su decisión.
3. Lanza el **planner** para plan.md y tasks.md. Resume el plan en 5 líneas y PIDE APROBACIÓN antes de implementar.
4. Con la aprobación, lanza el **implementer** con las tareas en orden. Si una tarea falla dos veces, para y avisa.
5. Lanza en paralelo tres **reviewer** para validar, uno por foco: (a) constitución y seguridad, (b) interfaz y flujo de usuario, (c) tests y criterios de aceptación.
6. Junta sus informes. Si algo falla, crea las tareas nuevas y vuelve al paso 4 (máximo dos vueltas; después pregunta al usuario).
7. Actualiza memory.md y dale al usuario el veredicto final: qué se hizo, cómo probarlo y qué queda pendiente.

Reglas: nunca te saltes la aprobación del paso 3. No lances más subagentes de los necesarios.
