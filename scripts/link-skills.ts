import { mkdirSync, lstatSync, readlinkSync, symlinkSync } from 'node:fs';

for (const client of ['.agents', '.claude']) {
  mkdirSync(client, { recursive: true });
  const path = `${client}/skills`;
  const target = '../.codex/skills';
  try {
    const stat = lstatSync(path);
    if (!stat.isSymbolicLink() || readlinkSync(path) !== target)
      throw new Error(
        `Conteúdo existente em ${path}; resolver conflito manualmente.`,
      );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    symlinkSync(target, path, 'dir');
  }
}
console.log(
  'Skills registradas: .agents/skills e .claude/skills → .codex/skills',
);
