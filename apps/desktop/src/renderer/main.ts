const info = await window.api.getAppInfo();
const reply = await window.api.echo('hola desde la interfaz');
document.querySelector('#status')!.textContent = `${info.name} ${info.version} en ${info.platform} · ${reply}`;

export {};