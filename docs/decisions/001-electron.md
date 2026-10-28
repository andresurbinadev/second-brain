# 001 · Electron para la app de escritorio

**Fecha:** 2026-10-28 · **Estado:** aceptada

## Contexto
La app debe funcionar en Mac primero, después en web y móvil, reutilizando la misma interfaz y lógica en TypeScript.

## Decisión
Electron + electron-vite, con contextIsolation, sandbox y sin nodeIntegration desde el primer día.

## Alternativas descartadas
- **Tauri:** instalador mucho más pequeño (~10 MB frente a ~100 MB) y menos memoria, pero el backend se escribe en Rust. Aprender Rust a la vez que el resto no cabe en un mes.
- **App nativa (Swift):** solo Mac; no se reutiliza nada para web ni móvil.

## Consecuencias
- Instalador pesado (~100 MB) y más consumo de RAM.
- El mismo React y TypeScript sirven para la versión web.
- La seguridad depende de configurar bien Electron: ver la skill electron-security.