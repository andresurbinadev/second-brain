import { defineConfig } from 'electron-vite';

// electron-vite compila las tres partes de la app por separado:
// main (Node, acceso total), preload (puente) y renderer (la interfaz, como un navegador).
export default defineConfig({
  main: {
    // Nuestros paquetes del monorepo están en TypeScript: se incluyen en el compilado.
    build: { externalizeDeps: { exclude: ['@sb/shared'] } },
  },
  preload: {
    // El preload corre en sandbox y no puede cargar node_modules: todo va dentro del compilado.
    build: { externalizeDeps: false },
  },
  renderer: {},
});