---
name: encrypted-storage
description: Cómo guardar datos del usuario en SQLite cifrado. Úsala al crear tablas, migraciones, consultas, exportar/importar o borrar datos.
---
# Almacenamiento cifrado

- Driver: better-sqlite3-multiple-ciphers. Abre la DB y ejecuta `PRAGMA cipher='sqlcipher'` + `PRAGMA key=...` antes de cualquier otra consulta.
- Clave: 32 bytes aleatorios generados la primera vez, guardados cifrados con safeStorage.encryptString en userData. Nunca en texto plano, logs ni repo.
- Solo consultas preparadas con parámetros. Nunca concatenes SQL.
- Migraciones numeradas en main/db/migrations, aplicadas en transacción, con una tabla schema_version.
- Todas las tablas: id (uuid), created_at, updated_at (ISO). Borrado real cuando el usuario borra (no "soft delete" de datos personales).
- Exportar = JSON legible que el usuario controla. "Borrar mis datos" elimina la DB y la clave.
- Tests con una DB temporal cifrada; comprueba que abrirla sin clave falla.
