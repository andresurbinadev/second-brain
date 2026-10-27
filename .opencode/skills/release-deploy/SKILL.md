---
name: release-deploy
description: Empaquetado, CI/CD y deploy. Úsala al tocar electron-builder, GitHub Actions, auto-actualización, Docker, el servidor de Hetzner, variables de entorno o versiones.
---
# Release y deploy

## Regla principal
Todo deploy sale de GitHub Actions a partir de un tag `vX.Y.Z`. Nada se publica a mano desde un portátil.

## App de escritorio
- Empaquetado con electron-builder: DMG + zip universal para macOS (el zip lo necesita la auto-actualización). Windows (NSIS) llegará más adelante.
- Workflow `.github/workflows/release.yml`: en cada tag hace typecheck y test, compila en macos-latest (DMG universal arm64 + x64), firma si hay certificados y sube a GitHub Releases. Windows se añadirá más adelante.
- Auto-actualización con electron-updater leyendo GitHub Releases. El usuario recibe la nueva versión sin reinstalar.
- Firma y notarización: los certificados van SOLO en GitHub Secrets (CSC_LINK, CSC_KEY_PASSWORD, APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID). Si no existen, el workflow genera builds sin firmar y lo avisa en el log, sin fallar.
- La versión sale de package.json y se sube con `pnpm version patch|minor`. CHANGELOG.md se genera a partir de los commits convencionales.

## Servidor (cuando exista)
- apps/server con Dockerfile multi-stage y un usuario no root.
- infra/docker-compose.yml: server, postgres, litellm y caddy (HTTPS automático). Volúmenes con nombre y backups diarios de postgres.
- Deploy: workflow `deploy.yml` que construye la imagen, la sube a GHCR y por SSH hace `docker compose pull && docker compose up -d` en Hetzner.
- Migraciones de la DB al arrancar, de forma idempotente. Endpoint /health que el workflow comprueba después del deploy; si falla, vuelve a la imagen anterior.

## Configuración
- `.env.example` con todas las variables, sin valores reales. `.env` está en .gitignore.
- Los secretos solo en GitHub Secrets y en el `.env` del servidor (chmod 600). Nunca en el repo ni en el código del cliente.
- La URL del servidor y los entornos (dev/staging/prod) se configuran por variable, nunca hardcodeados.

## CI en cada push
- `.github/workflows/ci.yml`: pnpm install --frozen-lockfile, lint, typecheck y test. Una PR que no pasa no se fusiona.
