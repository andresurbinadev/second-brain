import Database from 'better-sqlite3-multiple-ciphers';
import { migrate } from './migrations';

// Abre (o crea) la bóveda cifrada. keyHex = 64 caracteres hexadecimales (32 bytes).
export function openVault(file: string, keyHex: string): Database.Database {
  if (!/^[0-9a-f]{64}$/.test(keyHex)) throw new Error('Clave de la bóveda con formato inválido');

  const db = new Database(file);
  try {
    // El cifrado se configura ANTES de cualquier otra consulta.
    db.pragma(`cipher='sqlcipher'`);
    db.pragma('legacy=4');
    db.pragma(`key="x'${keyHex}'"`);
    // Primera lectura real: si la clave es incorrecta, aquí falla con "file is not a database".
    db.prepare('SELECT count(*) FROM sqlite_master').get();
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate(db);
    return db;
  } catch (err) {
    db.close();
    throw err;
  }
}