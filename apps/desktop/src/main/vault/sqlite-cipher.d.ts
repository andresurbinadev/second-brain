// El paquete trae sus tipos pero su package.json no los publica bien ("exports").
// Su API es la misma que la de better-sqlite3, así que reutilizamos esos tipos.
declare module 'better-sqlite3-multiple-ciphers' {
  import Database from 'better-sqlite3';
  export = Database;
}