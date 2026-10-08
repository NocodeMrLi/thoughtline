const { spawnSync } = require('node:child_process');
for (const script of ['typecheck', 'test', 'build']) {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', script], { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) { console.error(result.error); process.exit(1); }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
