#!/bin/zsh
set -euo pipefail
umask 077
# Local-only launcher. No fallback to installed App or production data.
candidate_dmg='/Users/lihongwei/Documents/Codex/2026-10-09/task/thoughtline/dist/Thoughtline-0.0.13-mac-arm64.dmg'
expected_dmg='63abca7db97acbde1876b26cf7f4394bb4e09a0888c38a72320cc1f7fe431f9c'
expected_asar='4af1687daa8725dbbaa6793245a68aa4ed6681c5034197c7e30b39e917ae220e'
experience_root='/Users/lihongwei/Documents/Codex/2026-10-09/task/delivery/isolated-experience-0.0.13'
experience_data="$experience_root/user-data"
experience_mount="$experience_root/mount"
candidate_app="$experience_mount/Thoughtline.app"
mounted_here=0
fail() { print -u2 -- "$1"; exit 1; }
cleanup_mount() {
 if (( mounted_here )); then
  if ! /usr/bin/hdiutil detach "$experience_mount" >/dev/null; then
   print -u2 -- '挂载仍被使用，未强制卸载。退出测试 App 后可在 Finder 弹出；测试数据会保留。'
  fi
 fi
}
trap cleanup_mount EXIT
[[ $# -eq 0 || ( $# -eq 1 && "${1:-}" == '--check-only' ) ]] || fail '只接受 --check-only，默认双击启动隔离体验。'
[[ -f "$candidate_dmg" ]] || fail '未找到固定候选 DMG；不会改用已安装版本。'
actual_dmg=$(LC_ALL=C LC_CTYPE=C LANG=C /usr/bin/shasum -a 256 "$candidate_dmg")
[[ "${actual_dmg%% *}" == "$expected_dmg" ]] || fail 'DMG 哈希不符，停止。'
for isolated_path in "$experience_root" "$experience_data" "$experience_mount"; do
 [[ ! -L "$isolated_path" ]] || fail '隔离路径存在符号链接，停止；不会沿链接读写。'
done
/bin/mkdir -p "$experience_data" "$experience_mount"
[[ -z "$(/bin/ls -A "$experience_mount")" ]] || fail '隔离挂载目录已有内容或仍在挂载。请退出先前测试 App 并弹出挂载；本脚本不会删除或替换。'
for snapshot_file in snapshot.json snapshot.bak.json snapshot.schema1.backup.json; do
 [[ ! -L "$experience_data/$snapshot_file" ]] || fail '测试存储文件存在符号链接，停止；不会沿链接读写。'
done
/usr/bin/hdiutil attach -readonly -nobrowse -noautoopen -mountpoint "$experience_mount" "$candidate_dmg" >/dev/null
mounted_here=1
[[ -f "$candidate_app/Contents/Resources/app.asar" ]] || fail '固定挂载中未找到候选 App。'
actual_asar=$(LC_ALL=C LC_CTYPE=C LANG=C /usr/bin/shasum -a 256 "$candidate_app/Contents/Resources/app.asar")
[[ "${actual_asar%% *}" == "$expected_asar" ]] || fail '包内 asar 哈希不符，停止。'
actual_version=$(/usr/bin/plutil -extract CFBundleShortVersionString raw -o - "$candidate_app/Contents/Info.plist")
[[ "$actual_version" == '0.0.13' ]] || fail 'App 版本不是 0.0.13，停止。'
/usr/bin/codesign --verify --deep --strict "$candidate_app"
print -- '已核对 0.0.13 DMG、asar、版本和签名。'
print -- "本次独立测试数据：$experience_data"
print -- '请先从旧版托盘退出旧实例，避免热键冲突或认错托盘。不会替换安装版，也不会发送任何内容。'
if [[ "${1:-}" == '--check-only' ]]; then
 print -- '仅完成只读包检查，未启动 App。'
 exit 0
fi
print -- '现在通过系统正常打开流程启动测试 App。若系统拦截，请自行处理安全提示；本脚本不绕过。'
# --env is supported by this Mac open; do not rely on shell environment inheritance.
# -n selects this exact candidate; -W keeps the read-only mount until it exits.
/usr/bin/open -n -W "$candidate_app" \
 --env "THOUGHTLINE_DATA_DIR=$experience_data" \
 --env 'ELECTRON_RENDERER_URL=' \
 --env 'ELECTRON_RUN_AS_NODE=' \
 --env 'NODE_OPTIONS='
print -- "打开流程已结束。测试数据保留在 $experience_data；下次仍使用同一脚本恢复。"
