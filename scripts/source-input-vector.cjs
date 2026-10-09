const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');

const include = file => /^(src|assets|scripts|tests|licenses|\.github|docs\/delivery)\//.test(file) ||
  /^(package\.json|package-lock\.json|THIRD_PARTY_NOTICES\.md|tsconfig[^/]*|electron\.vite[^/]*|vitest\.config\.[^/]*|\.gitattributes|\.gitignore|acceptance\/evidence\/round1\/p6-electron-cache-binding\.json|acceptance\/evidence\/icon-final\/resource-verification\.json)$/.test(file);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

function sourceInputVector() {
  const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const records = execFileSync('git', ['ls-files', '--stage', '-z']).toString('utf8').split('\0').filter(Boolean);
  const files = {};
  for (const record of records) {
    const match = /^(\d{6}) ([0-9a-f]{40,64}) 0\t(.+)$/.exec(record);
    if (!match) throw Error(`Unrecognized Git index entry: ${record}`);
    const [, mode, blob, file] = match;
    if (!include(file)) continue;
    if (mode !== '100644' && mode !== '100755' && mode !== '120000') throw Error(`Unexpected input mode: ${file}`);
    const bytes = mode === '120000' ? Buffer.from(fs.readlinkSync(file)) : fs.readFileSync(file);
    files[file] = { mode, blob, sha256: sha256(bytes) };
  }
  if (!files['package.json'] || !files['package-lock.json'] || !files['scripts/package-mac.cjs'] ||
      !files['docs/delivery/Start-Thoughtline-Isolated.ps1']) throw Error('Required delivery inputs missing from Git index.');
  const changed = execFileSync('git', ['diff', 'HEAD', '--name-only', '-z']).toString('utf8').split('\0').filter(include);
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z']).toString('utf8').split('\0').filter(include);
  if (changed.length || untracked.length) throw Error(`Production or build inputs are not frozen: ${[...changed, ...untracked].join(', ')}`);
  const gitObjects = Object.fromEntries(Object.entries(files).map(([file, value]) => [file, { mode: value.mode, blob: value.blob }]));
  const vectorSha256 = sha256(Buffer.from(JSON.stringify(gitObjects)));
  const worktreeSha256 = sha256(Buffer.from(JSON.stringify(files)));
  return { headSha, count: Object.keys(files).length, vectorSha256, worktreeSha256, files };
}

module.exports = { sourceInputVector };
