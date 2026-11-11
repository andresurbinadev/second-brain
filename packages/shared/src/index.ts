import { z } from 'zod';
import { PageKindSchema, type Dashboard, type Page, type PageKind } from '@sb/core';

// Lo que la interfaz puede pedirle al sistema. Es el contrato entre ambos:
// la interfaz solo conoce estas funciones, nunca Electron ni Node.
export interface PlatformApi {
  getAppInfo(): Promise<AppInfo>;
  getVaultStatus(): Promise<VaultStatus>;
  getDashboard(): Promise<Dashboard>;
  search(query: string): Promise<SearchResult[]>;
  getPage(id: string): Promise<Page | null>;
  createPage(input: NewPageInput): Promise<Page>;
}

export const AppInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  platform: z.enum(['darwin', 'win32', 'linux']),
});
export type AppInfo = z.infer<typeof AppInfoSchema>;

// Lo único que la interfaz ve de la bóveda: números, nunca la clave ni la ruta.
export type VaultStatus = { schemaVersion: number; pages: number };

export type SearchResult = { id: string; kind: PageKind; title: string; snippet: string };

// ── Validación de lo que llega desde la interfaz ────────────────
export const SearchInputSchema = z.string().max(200);
export const PageIdSchema = z.uuid();
export const NewPageInputSchema = z.object({
  kind: PageKindSchema,
  title: z.string().trim().min(1).max(200),
  body: z.string().max(200_000).optional(),
});
export type NewPageInput = z.infer<typeof NewPageInputSchema>;

// Nombres de los canales IPC, en un solo sitio para no escribirlos a mano dos veces.
export const IPC = {
  getAppInfo: 'app:get-info',
  getVaultStatus: 'vault:status',
  getDashboard: 'brain:dashboard',
  search: 'brain:search',
  getPage: 'brain:get-page',
  createPage: 'brain:create-page',
} as const;