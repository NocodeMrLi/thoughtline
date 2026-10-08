const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

function verifyMacSignature(appPath) {
  if (process.platform !== 'darwin') throw new Error('Mac signature verification requires macOS.');
  const result = spawnSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', resolve(appPath)], { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Mac package signature is invalid:\n${result.stderr || result.stdout}`);
  return { app: resolve(appPath), verification: 'codesign --verify --deep --strict', passed: true };
}

module.exports = { verifyMacSignature };
if (require.main === module) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node scripts/verify-mac-signature.cjs /path/Thoughtline.app');
    console.log(JSON.stringify(verifyMacSignature(process.argv[2]), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
