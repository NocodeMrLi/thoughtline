#!/bin/zsh
set -euo pipefail
umask 077
launcher_dir=${0:A:h}
candidate_dmg="$launcher_dir/Thoughtline-0.0.19-mac-arm64.dmg"
expected_dmg='eb25b47bac3fd9b2bb59408277a5d5a26b440103ab1ba608a75aab0421f87b59'
expected_asar='6871aa7f91876a31fd96bd286d6f42aad92f492016d7afef13e711b041050c1f'
experience_root="$launcher_dir/isolated-experience"
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
[[ $# -eq 0 || ( $# -eq 1 && "${1:-}" == '--check-only' ) ]] || fail '只接受 --check-only。'
[[ -f "$candidate_dmg" ]] || fail '未找到固定候选 DMG。'
actual_dmg=$(LC_ALL=C LC_CTYPE=C LANG=C /usr/bin/shasum -a 256 "$candidate_dmg")
[[ "${actual_dmg%% *}" == "$expected_dmg" ]] || fail 'DMG 哈希不符，停止。'
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
[[ "${actual_asar%% *}" == "$expected_asar" ]] || fail '包内 asar 哈希不符，停止。'
actual_version=$(/usr/bin/plutil -extract CFBundleShortVersionString raw -o - "$candidate_app/Contents/Info.plist")
[[ "$actual_version" == '0.0.19' ]] || fail 'App 版本不符，停止。'
/usr/bin/codesign --verify --deep --strict "$candidate_app"
print -- '已核对固定 DMG、asar、版本和签名。'
print -- "本次隔离数据：$experience_data"
if [[ "${1:-}" == '--check-only' ]]; then
 print -- '只读包检查完成；未启动 App。'
 exit 0
fi
print -- '将通过系统正常打开流程启动测试 App。若系统拦截，请自行处理安全提示。'
/usr/bin/open -n -W "$candidate_app" \
 --env "THOUGHTLINE_DATA_DIR=$experience_data" \
 --env 'ELECTRON_RENDERER_URL=' \
 --env 'ELECTRON_RUN_AS_NODE=' \
 --env 'NODE_OPTIONS='
print -- "测试 App 已正常退出。数据保留在 $experience_data。"
