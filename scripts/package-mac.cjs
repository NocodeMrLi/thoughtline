const { spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, readFileSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { deepStrictEqual } = require('node:assert/strict');
const { verifyMacSignature } = require('./verify-mac-signature.cjs');
const { sourceInputVector } = require('./source-input-vector.cjs');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with ${result.status}`);
}

try {
  if (process.platform !== 'darwin') throw new Error('Mac packaging requires macOS.');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const inputVector = sourceInputVector();
  run(process.execPath, ['node_modules/electron-vite/bin/electron-vite.js', 'build']);
  run(process.execPath, ['scripts/build-notification-native.cjs']);
  const builderArgs = ['node_modules/electron-builder/cli.js', '--mac', 'dmg', '--publish', 'never'];
  const localZip = process.env.THOUGHTLINE_ELECTRON_DIST_ZIP;
  if (localZip) {
    const audit = JSON.parse(readFileSync('acceptance/evidence/round1/p6-electron-cache-binding.json', 'utf8'));
    if (pkg.devDependencies.electron !== '44.7.0' || audit.version !== '44.7.0' ||
        audit.checkedEntries !== 273 || audit.mismatches.length !== 0 ||
        resolve(localZip) !== audit.cachedZip) throw new Error('Unverified local Electron distribution.');
    const zipHash = createHash('sha256').update(readFileSync(localZip)).digest('hex');
    if (zipHash !== 'e04e411b58a0a14375dd21b0ab4a378fd38930a702e4e20e322fee4849404c0b')
      throw new Error('Electron distribution ZIP hash differs from audited cache.');
    builderArgs.push(`--config.electronDist=${localZip}`);
    console.log(`Using audited Electron 44.7.0 arm64 cache ZIP: ${zipHash}`);
  }
  run(process.execPath, builderArgs);
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
  const { readdirSync, statSync } = require('node:fs');
  const { relative } = require('node:path');
  const hashes = {};
  const walk = directory => { for (const entry of readdirSync(directory)) { const file = join(directory, entry);
    if (statSync(file).isDirectory()) walk(file);
    else hashes[relative('.', file).replaceAll('\\', '/')] = createHash('sha256').update(readFileSync(file)).digest('hex');
  } };
  walk('out'); walk('assets');
  const asar = resolve('dist/mac-arm64/Thoughtline.app/Contents/Resources/app.asar');
  const buildManifest = { version: pkg.version, arch: 'arm64', target: 'dmg',
    actualMacBuildSource: inputVector.headSha, inputVector, hashes,
    appAsarSha256: createHash('sha256').update(readFileSync(asar)).digest('hex'),
    dmgSha256: report.sha256, signature: report.signature,
    physicalMacAcceptance: false, formalAcceptance: false };
  let finalInputVector;
  try {
    finalInputVector = sourceInputVector();
    deepStrictEqual(finalInputVector, inputVector, 'Production/build/test inputs changed during Mac packaging');
  } catch (error) {
    const failurePath = `dist/mac-source-freeze-failed-${Date.now()}-${process.pid}.json`;
    writeFileSync(failurePath, JSON.stringify({ stage: 'post-build-source-check',
      initialInputVector: inputVector, observedInputVector: finalInputVector ?? null,
      error: String(error?.stack || error), outputNotApproved: true }, null, 2) + '\n', { flag: 'wx' });
    throw new Error(`Mac source freeze check failed; retained ${failurePath}: ${error.message}`);
  }
  writeFileSync('dist/mac-signature-verification.json', JSON.stringify(report, null, 2) + '\n');
  writeFileSync('dist/mac-build-manifest.json', JSON.stringify(buildManifest, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) { console.error(error.message); process.exitCode = 1; }
