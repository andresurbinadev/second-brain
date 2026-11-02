const info = await window.api.getAppInfo();
const vault = await window.api.getVaultStatus();
document.querySelector('#status')!.textContent =
  `${info.name} ${info.version} en ${info.platform} · Bóveda cifrada: versión ${vault.schemaVersion}, ${vault.pages} páginas`;

export {};