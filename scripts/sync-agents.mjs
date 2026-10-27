// Genera la configuración de cada herramienta de IA a partir de una sola fuente: ai/.
// Uso: pnpm sync:agents
import { promises as fs } from 'node:fs';
import path from 'node:path';

const HEADER = 'GENERADO por scripts/sync-agents.mjs desde ai/. No editar a mano.';

// Traduce cada nivel de acceso al sistema de permisos de cada herramienta.
const ACCESS = {
  read:  { codex: 'read-only',       claude: 'Read, Grep, Glob, Bash',             opencode: { edit: 'deny',  bash: 'allow' } },
  specs: { codex: 'workspace-write', claude: 'Read, Grep, Glob, Edit, Write',       opencode: { edit: 'allow', bash: 'deny'  } },
  write: { codex: 'workspace-write', claude: 'Read, Grep, Glob, Edit, Write, Bash', opencode: { edit: 'allow', bash: 'allow' } },
};

// Separa la ficha (entre ---) del cuerpo del agente.
function parseAgent(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${file}: falta la cabecera ---`);
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  for (const key of ['name', 'description', 'access']) {
    if (!meta[key]) throw new Error(`${file}: falta "${key}"`);
  }
  if (!ACCESS[meta.access]) throw new Error(`${file}: access debe ser read, specs o write`);
  return { ...meta, body: match[2].trim() };
}

const quote = s => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';

// Formato de Codex: TOML.
const toCodex = a =>
  `# ${HEADER}\nname = ${quote(a.name)}\ndescription = ${quote(a.description)}\n` +
  `sandbox_mode = "${ACCESS[a.access].codex}"\ndeveloper_instructions = """\n${a.body}\n"""\n`;

// Formato de Claude Code: markdown con lista de herramientas permitidas.
const toClaude = a =>
  `---\nname: ${a.name}\ndescription: ${a.description}\ntools: ${ACCESS[a.access].claude}\n---\n<!-- ${HEADER} -->\n${a.body}\n`;

// Formato de OpenCode: markdown con permisos de edición y terminal.
const toOpenCode = a => {
  const p = ACCESS[a.access].opencode;
  return `---\ndescription: ${a.description}\nmode: subagent\npermission:\n  edit: ${p.edit}\n  bash: ${p.bash}\n---\n<!-- ${HEADER} -->\n${a.body}\n`;
};

async function write(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

// 1. Lee todos los agentes de ai/agents.
const files = (await fs.readdir('ai/agents')).filter(f => f.endsWith('.md'));
const agents = [];
for (const f of files) agents.push(parseAgent(await fs.readFile(path.join('ai/agents', f), 'utf8'), f));

// 2. Borra lo generado antes (así un agente eliminado desaparece) y lo vuelve a crear.
for (const dir of ['.codex/agents', '.claude/agents', '.opencode/agents']) {
  await fs.rm(dir, { recursive: true, force: true });
}
for (const a of agents) {
  await write(`.codex/agents/${a.name}.toml`, toCodex(a));
  await write(`.claude/agents/${a.name}.md`, toClaude(a));
  await write(`.opencode/agents/${a.name}.md`, toOpenCode(a));
}

// 3. SKILL.md es un formato abierto: se copia tal cual a donde lo busca cada herramienta.
for (const dir of ['.agents/skills', '.claude/skills', '.opencode/skills']) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.cp('ai/skills', dir, { recursive: true });
}

// 4. Claude Code lee CLAUDE.md; lo apuntamos a AGENTS.md para tener una sola fuente.
await write('CLAUDE.md', `<!-- ${HEADER} -->\n@AGENTS.md\n`);

console.log(`Sincronizados ${agents.length} agentes para Codex, Claude Code y OpenCode.`);