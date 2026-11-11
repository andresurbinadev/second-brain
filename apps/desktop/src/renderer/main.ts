const info = await window.api.getAppInfo();
const dash = await window.api.getDashboard();
document.querySelector('#status')!.textContent =
  `${info.name} ${info.version} · ${dash.counts.pages} páginas, ${dash.counts.relationships} relaciones`;

export {};