// Runs Vitest from the project folder's true-case path, passing any arguments through.
//
// On Windows, a terminal opened at c:\… (a lower-case drive letter, which is what VS Code does) makes Node load
// Vitest twice, once as c:\… and once as C:\…, and every test file then fails with
// "TypeError: Cannot read properties of undefined (reading 'config')". Elsewhere this is a plain `vitest`.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { join } from 'node:path';

const root = realpathSync.native(process.cwd());
const cli = join(root, 'node_modules', 'vitest', 'vitest.mjs');
const { status, signal } = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(status ?? (signal ? 1 : 0));
