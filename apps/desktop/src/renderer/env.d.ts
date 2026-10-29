import type { PlatformApi } from '@sb/shared';

declare global {
  interface Window {
    api: PlatformApi;
  }
}
export {};