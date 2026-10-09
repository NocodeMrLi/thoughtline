const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, readFileSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { verifyMacSignature } = require('../../../scripts/verify-mac-signature.cjs');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
}

try {
  if (!process.env.THOUGHTLINE_ELECTRON_ARCHIVE) throw new Error('Exact checked runtime archive required');
  if (process.platform !== 'darwin') throw new Error('Mac packaging requires macOS.');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  run(process.execPath, ['node_modules/electron-builder/cli.js', '--mac', 'dmg', '--publish', 'never', '--config.electronDist='+process.env.THOUGHTLINE_ELECTRON_ARCHIVE]);
  const builtApp = resolve('dist/mac-arm64/Thoughtline.app');
  verifyMacSignature(builtApp);
  const dmg = resolve(`dist/Thoughtline-${pkg.version}-mac-arm64.dmg`);
  const mount = mkdtempSync(join(tmpdir(), 'thoughtline-signature-'));
  let mounted = false;
  try {
    run('/usr/bin/hdiutil', ['attach', dmg, '-readonly', '-nobrowse', '-mountpoint', mount]);
    mounted = true;
    verifyMacSignature(join(mount, 'Thoughtline.app'));
  } finally {
    if (mounted) run('/usr/bin/hdiutil', ['detach', mount]);
    rmSync(mount, { recursive: true, force: true });
  }
  const report = {
    version: pkg.version,
    file: dmg,
    sha256: createHash('sha256').update(readFileSync(dmg)).digest('hex'),
    signature: 'ad-hoc, sealed resources; not Developer ID or notarization',
    builtAppStrictVerification: true,
    dmgAppStrictVerification: true,
  };
  writeFileSync('dist/mac-signature-verification.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
