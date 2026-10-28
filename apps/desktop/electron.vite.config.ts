import { defineConfig } from 'electron-vite';

// electron-vite compila las tres partes de la app por separado:
// main (Node, acceso total), preload (puente) y renderer (la interfaz, como un navegador).
export default defineConfig({
  main: {},
  preload: {},
  renderer: {},
});