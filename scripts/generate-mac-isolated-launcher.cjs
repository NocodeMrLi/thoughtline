// Run after freezing the source and validating the final DMG. The generated command
// binds one exact version, DMG, and packaged asar without editing this source file.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const version = require('../package.json').version;
const delivery = process.env.THOUGHTLINE_DELIVERY_DIR;
if (!delivery) throw Error('Set THOUGHTLINE_DELIVERY_DIR to the new frozen package delivery directory.');
const dmg = path.join(delivery, `Thoughtline-${version}-mac-arm64.dmg`);
const output = path.join(delivery, 'Start-Thoughtline-Isolated-Mac.command');
const q = value => `'${value.replaceAll("'", "'\\''")}'`;
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

if (process.platform !== 'darwin') throw Error('Mac launcher generation requires macOS.');
assert.equal(require('../package.json').version, version);
assert.equal(process.argv.length, 2, 'This generator accepts no hash or path overrides.');
assert(fs.statSync(dmg).isFile(), 'Frozen DMG missing');
fs.mkdirSync(delivery, { recursive: true });
const mount = fs.mkdtempSync(path.join(os.tmpdir(), 'thoughtline-launcher-check-'));
let mounted = false;
let asarHash;
try {
  run('/usr/bin/hdiutil', ['attach', dmg, '-readonly', '-nobrowse', '-noautoopen', '-mountpoint', mount]);
  mounted = true;
  const app = path.join(mount, 'Thoughtline.app');
  const actualVersion = run('/usr/bin/plutil', ['-extract', 'CFBundleShortVersionString', 'raw', '-o', '-', path.join(app, 'Contents', 'Info.plist')]);
  assert.equal(actualVersion, version);
  run('/usr/bin/codesign', ['--verify', '--deep', '--strict', app]);
  asarHash = hash(path.join(app, 'Contents', 'Resources', 'app.asar'));
} finally {
  if (mounted) run('/usr/bin/hdiutil', ['detach', mount]);
  fs.rmSync(mount, { recursive: true });
}
const dmgHash = hash(dmg);
const dataRoot = path.join(delivery, 'isolated-experience');
const command = `#!/bin/zsh
set -euo pipefail
umask 077
candidate_dmg=${q(dmg)}
expected_dmg=${q(dmgHash)}
expected_asar=${q(asarHash)}
experience_root=${q(dataRoot)}
experience_data="$experience_root/user-data"
experience_mount="$experience_root/mount"
candidate_app="$experience_mount/Thoughtline.app"
mounted_here=0
fail() { print -u2 -- "$1"; exit 1; }
cleanup_mount() {
 if (( mounted_here )); then
  if ! /usr/bin/hdiutil detach "$experience_mount" >/dev/null; then
   print -u2 -- '挂载仍被使用。请正常退出测试 App，再从 Finder 弹出；测试数据保留。'
  fi
 fi
}
trap cleanup_mount EXIT
[[ $# -eq 0 || ( $# -eq 1 && "\${1:-}" == '--check-only' ) ]] || fail '只接受 --check-only。'
[[ -f "$candidate_dmg" ]] || fail '未找到固定候选 DMG。'
actual_dmg=$(LC_ALL=C LC_CTYPE=C LANG=C /usr/bin/shasum -a 256 "$candidate_dmg")
[[ "\${actual_dmg%% *}" == "$expected_dmg" ]] || fail 'DMG 哈希不符，停止。'
for isolated_path in "$experience_root" "$experience_data" "$experience_mount"; do
 [[ ! -L "$isolated_path" ]] || fail '隔离路径存在符号链接，停止。'
done
/bin/mkdir -p "$experience_data" "$experience_mount"
[[ -z "$(/bin/ls -A "$experience_mount")" ]] || fail '挂载目录仍有内容，请正常退出先前测试 App 并弹出挂载。'
for snapshot_file in snapshot.json snapshot.bak.json snapshot.schema1.backup.json snapshot.schema2.backup.json; do
 [[ ! -L "$experience_data/$snapshot_file" ]] || fail '测试存储文件存在符号链接，停止。'
done
/usr/bin/hdiutil attach -readonly -nobrowse -noautoopen -mountpoint "$experience_mount" "$candidate_dmg" >/dev/null
mounted_here=1
[[ -f "$candidate_app/Contents/Resources/app.asar" ]] || fail '挂载中未找到候选 App。'
actual_asar=$(LC_ALL=C LC_CTYPE=C LANG=C /usr/bin/shasum -a 256 "$candidate_app/Contents/Resources/app.asar")
[[ "\${actual_asar%% *}" == "$expected_asar" ]] || fail '包内 asar 哈希不符，停止。'
actual_version=$(/usr/bin/plutil -extract CFBundleShortVersionString raw -o - "$candidate_app/Contents/Info.plist")
[[ "$actual_version" == '${version}' ]] || fail 'App 版本不符，停止。'
/usr/bin/codesign --verify --deep --strict "$candidate_app"
print -- '已核对固定 DMG、asar、版本和签名。'
print -- "本次隔离数据：$experience_data"
if [[ "\${1:-}" == '--check-only' ]]; then
 print -- '只读包检查完成；未启动 App。'
 exit 0
fi
print -- '将通过系统正常打开流程启动测试 App。若系统拦截，请自行处理安全提示。'
/usr/bin/open -n -W "$candidate_app" \\
 --env "THOUGHTLINE_DATA_DIR=$experience_data" \\
 --env 'ELECTRON_RENDERER_URL=' \\
 --env 'ELECTRON_RUN_AS_NODE=' \\
 --env 'NODE_OPTIONS='
print -- "测试 App 已正常退出。数据保留在 $experience_data。"
`;
if (fs.existsSync(output)) {
  assert.equal(fs.readFileSync(output, 'utf8'), command, 'Existing launcher has different provenance');
} else {
  fs.writeFileSync(output, command, { flag: 'wx', mode: 0o755 });
}
fs.chmodSync(output, 0o755);
console.log(JSON.stringify({ generator: __filename, version, dmg, dmgSha256: dmgHash,
  asarSha256: asarHash, launcher: output, launcherSha256: hash(output) }, null, 2));
