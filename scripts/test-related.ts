import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = process.argv.slice(2);
const tooling =
  files.length === 0 ||
  files.some((file) =>
    /^(scripts\/|tests\/unit\/)|(^|\/)(package(-lock)?\.json|tsconfig\.json)$/.test(
      file,
    ),
  );
if (tooling) {
  const tests = readdirSync('tests/unit')
    .filter((file) => file.endsWith('.test.ts'))
    .map((file) => `tests/unit/${file}`);
  const result = spawnSync(process.execPath, ['--test', ...tests], {
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}
console.log(
  'Nenhum teste unitário relacionado identificado. Para mudança visual: npm run test:e2e.',
);
