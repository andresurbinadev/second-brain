import { safeStorage } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

export async function getOrCreateVaultKey(dir: string): Promise<string> {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) {
    throw new Error('Este sistema no ofrece almacenamiento seguro de claves');
  }
  const file = path.join(dir, 'vault.key');

  if (existsSync(file)) {
    const { result, shouldReEncrypt } = await safeStorage.decryptStringAsync(readFileSync(file));
    // Si el sistema rotó su clave, se vuelve a cifrar con la nueva.
    if (shouldReEncrypt) {
      writeFileSync(file, await safeStorage.encryptStringAsync(result), { mode: 0o600 });
    }
    return result;
  }

  const key = randomBytes(32).toString('hex');
  writeFileSync(file, await safeStorage.encryptStringAsync(key), { mode: 0o600 });
  return key;
}