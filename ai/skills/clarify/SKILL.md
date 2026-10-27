---
name: clarify
description: Fase 3 del SDD. Úsala para revisar una spec o un plan como un QA exigente antes de implementar ("$clarify 001").
---
# Clarificar

NO escribas código.

1. Lee docs/constitution.md y el spec.md (y plan.md si existe) de la carpeta indicada.
2. Revisa como QA profesional y lista, ordenado por gravedad:
   - Ambigüedades (palabras como "rápido", "fácil", "algunos")
   - Contradicciones entre requisitos o con la constitución
   - Requisitos sin criterio de aceptación, y criterios que no se pueden probar
   - Casos límite olvidados (vacío, error, sin conexión, datos grandes, borrar cuenta)
   - Riesgos de privacidad o de seguridad
3. Marca cuáles BLOQUEAN la implementación.
4. Propón una corrección concreta para cada hallazgo. Aplícala al fichero solo cuando el usuario la apruebe o diga "decide tú".
