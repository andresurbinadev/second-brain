import { z } from 'zod';

// Lo que la interfaz puede pedirle al sistema. Es el contrato entre ambos:
// la interfaz solo conoce estas funciones, nunca Electron ni Node.
export interface PlatformApi {
  getAppInfo(): Promise<AppInfo>;
  echo(text: string): Promise<string>;
}

export const AppInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  platform: z.enum(['darwin', 'win32', 'linux']),
});
export type AppInfo = z.infer<typeof AppInfoSchema>;

// Validación de lo que llega desde la interfaz: nunca se confía en ella.
export const EchoInputSchema = z.string().min(1).max(500);

// Nombres de los canales IPC, en un solo sitio para no escribirlos a mano dos veces.
export const IPC = {
  getAppInfo: 'app:get-info',
  echo: 'app:echo',
} as const;