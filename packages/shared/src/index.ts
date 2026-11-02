import { z } from 'zod';

export interface PlatformApi {
  getAppInfo(): Promise<AppInfo>;
  echo(text: string): Promise<string>;
  getVaultStatus(): Promise<VaultStatus>;
}

export const AppInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  platform: z.enum(['darwin', 'win32', 'linux']),
});
export type AppInfo = z.infer<typeof AppInfoSchema>;

// Lo único que la interfaz ve de la bóveda: números, nunca la clave ni la ruta.
export type VaultStatus = { schemaVersion: number; pages: number };

export const EchoInputSchema = z.string().min(1).max(500);

export const IPC = {
  getAppInfo: 'app:get-info',
  echo: 'app:echo',
  getVaultStatus: 'vault:status',
} as const;