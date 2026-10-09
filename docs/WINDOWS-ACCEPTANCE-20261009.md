# Windows 功能预检与用户实机验收

本轮包为 **0.0.16-preview.5 / x64 / 旧图标功能预检**，含 `4400f73` 延迟提交续作修复和此前组合输入保护。v11 已选素材仍由另线程取得；本包没有集成 v11，不是最终图标交付。安装、卸载、物理 IME 和桌面表现的结果分别记录，不能用打包通过替代实机验收。

## 下载和核验

从本轮准确 CI run 的 **Artifacts** 下载 `Thoughtline-Windows-x64-<打包SHA>`，需要私有仓库登录。解压后应有一个 `Thoughtline-0.0.16-preview.5-win-x64.exe`、`SHA256SUMS.txt`、`build-manifest.json`、两份 runner 预检 JSON，以及 `Start-Thoughtline-Isolated.ps1`。脚本来源见 [仓库文件](delivery/Start-Thoughtline-Isolated.ps1)，hash 绑定在 manifest。本轮 run、冻结 SHA 和下载 hash 以[阶段报告](../acceptance/WINDOWS-PREFLIGHT-20261009.md)为准。

在 PowerShell 对解压文件运行：

```powershell
Get-FileHash .\Thoughtline-0.0.16-preview.5-win-x64.exe -Algorithm SHA256
Get-Content .\SHA256SUMS.txt
Get-Content .\build-manifest.json
Get-AuthenticodeSignature .\Thoughtline-0.0.16-preview.5-win-x64.exe | Select-Object Status
```

hash 必须与清单和阶段报告一致，manifest 的 `headSha` 必须对应该 run。预期签名 `NotSigned`；hash 是完整性证据，不是发布者证书。当前没有 Authenticode 签名或信誉保证，Windows SmartScreen、Smart App Control、企业策略可能拦截。记录弹窗和错误原文；受阻时停止该项，不关闭安全机制、不修改执行策略。签名也不能保证所有设备不受提示。[Microsoft SmartScreen 说明](https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/)。

## 安装前备份与隔离启动

1. 先从托盘退出所有 Thoughtline，并保留旧 `.15` 安装包。复制整个 `%APPDATA%\Thoughtline` 到另一个备份目录，包含 `snapshot.json`、`snapshot.bak.json`、可能已有的 schema1/corrupt 备份。没有既有数据目录时记为首次安装。不要在运行时复制后声称取得一致性快照。
2. 本包 `appId/productName` 与旧版一致；安装会升级/替换相同安装身份。**指定不同目录与隔离数据不等于并排安装两个版本**。先记录旧安装路径与版本。
3. 运行安装向导，选择“仅为我安装”及期望目录；完成页取消“运行 Thoughtline”。向导 `oneClick:false, perMachine:false` 也允许所有用户选项，本轮 runner 仅覆盖 `/currentuser`。未经此项验收，不推断全用户安装路径/权限已通过。[NSIS 安装模式说明](https://www.electron.build/docs/nsis/)。
4. 用解压的隔离脚本明确选择实际安装文件，可先只检查：

```powershell
.\Start-Thoughtline-Isolated.ps1 -Executable 'C:\实际安装目录\Thoughtline.exe' -CheckOnly
.\Start-Thoughtline-Isolated.ps1 -Executable 'C:\实际安装目录\Thoughtline.exe'
```

隔离数据固定为 `%LOCALAPPDATA%\Thoughtline-Preflight\0.0.16-preview.5\user-data`，跨退出保留以便续测。脚本不会停止其他进程；有 Thoughtline 运行时会拒绝启动。脚本被执行策略拦截时不要修改策略，可在 PowerShell 手工输入同等的临时环境命令：

```powershell
# 先确认其他 Thoughtline 已从托盘退出。
$previous = $env:THOUGHTLINE_DATA_DIR
try {
  $env:THOUGHTLINE_DATA_DIR = Join-Path $env:LOCALAPPDATA 'Thoughtline-Preflight\0.0.16-preview.5\user-data'
  Start-Process -FilePath 'C:\实际安装目录\Thoughtline.exe'
} finally {
  if ($null -eq $previous) { Remove-Item Env:THOUGHTLINE_DATA_DIR -ErrorAction SilentlyContinue } else { $env:THOUGHTLINE_DATA_DIR = $previous }
}
```

以后用此入口继续隔离验收。普通快捷方式启动使用 `%APPDATA%\Thoughtline`；不能用普通快捷方式代替隔离入口。第一轮只用自造文本，核对隔离 `snapshot.json` 发生变化，正常数据目录保持备份前状态。

## 实机记录表

先记录 OS 完整版本/build、x64/ARM64、屏幕数、分辨率/缩放、输入法名称/版本、App 版本、run/SHA。此包仅构建 x64；ARM64 模拟运行、原生 ARM64、x86、Windows 10 和各 Windows 11 build 不互相代替。本轮 CI 具体 OS 以 runner 日志为准。

| 项目 | 操作与预期 | 当前实机状态 |
|---|---|---|
| 安装/首次启动 | 仅为我安装；无常驻主窗口，有托盘；隐藏挂绳不挡下方鼠标 | 待用户实机 |
| 快捷键/焦点 | Ctrl+Alt+N 唤出正文并能立即输入；冲突时提示并可改键；关闭回到原应用 | 待用户实机 |
| 单实例 | 同一隔离数据下再启动一次，只有一个主实例/托盘；第二次启动不自动新建念头；不同数据路径不能当同一实例测试 | 待用户实机 |
| 换行/提交 | 普通 Enter 换行；Ctrl+Enter 一次提交一次；Win+Enter 不提交；空白正文拒绝 | 待用户实机 |
| 物理中文 IME | 名称/正文/项目各自选字时试 Ctrl+Enter、Esc、切字段；不保存未确认中间值、不误提交；正常确认后最终中文完整 | 待用户实机 |
| 缺 end/失焦 | IME 未确认时切焦点/关闭再打开，观察是否按保护规则回退该字段到合成前值；记录实际事件/文字，不把回退当最终中文保存 | 待用户实机 |
| 草稿/退出 | 新建 Esc 存草稿，正常托盘退出并重开保持已保存中文；编辑 Esc 保持旧念头；保存错误保留浮层和文字 | 待用户实机 |
| UI 及系统材料 | 480×260 紧凑浮层、可选名称提示、项目/Agent/挂上；长文滚动不挤页脚；深浅主题、焦点、缩放/多屏无裁切 | 待用户实机 |
| fallback | Windows 11 build≥22621 聚焦时可用 acrylic；旧 build/失焦/系统低透明/高对比/forced colors 用不透明背景；主题变化跟随。只观察已有系统状态，不为测试擅改设置 | 待用户实机 |
| 挂绳/全文 | 顶边展开与离开收回、空白穿透、固定绳形、合夹/拆夹/归档/撤销/搜索、Agent 筛选；正文逐字节保留 | 待用户实机 |
| 复制/真实拖入 | 复制中文多行；逐个真实 Agent 输入框测试，区分纯正文与 txt 附件，不自动发送 | 待用户实机 |
| 休眠/锁屏/全屏 | 恢复后快捷键、浮层与显示器正常；全屏/G7 单独记录，既有原型不算已交付 | 待用户实机 |
| 旧版升级 | 先把旧版已退出的数据副本放入专用隔离目录；预检首次打开核对正文/草稿/Agent/分组/归档/位置和设置；再新增/重开核对。runner 重装相同版本不是 `.15→.16` 实机升级证明 | 待用户实机 |
| 卸载/重装 | 仅用合成数据，正常退出后从 Windows 已安装应用卸载；`%APPDATA%\Thoughtline` 和隔离数据应保持；重装后内容保持 | 待用户实机 |

每项填：通过/失败/未做，附操作步骤、预期、实际、截图或视频、发生时刻。失败时先退出并复制数据与错误；不覆盖原文件，不删除重建来掩盖问题。

## 数据保留规则与回滚

普通升级/普通卸载保留 `%APPDATA%\Thoughtline`，数据路径不随安装位置或版本号改变。`deleteAppDataOnUninstall:false`；当前 assisted NSIS 模板无自动删除 define，也无自定义卸载钩子。**原生卸载器显式 `--delete-app-data` 会触发删除 APPDATA 应用目录，本轮不传、不测试该删除开关**；不能把“普通卸载保留”写成所有参数下永不删除。用户指定在安装目录内部的自定义数据目录不受普通默认路径保留保证，应事先备份。

schema2 与 `.15` 的契约/校验/存储代码逐字节一致；schema1 首次读取只在内存转换、首次成功提交前留 `snapshot.schema1.backup.json`。未知 schema 拒绝启动而不拿旧备份覆盖；损坏主文件可读取有效 bak，后续提交另存 corrupt 原件。bak 是上一版快照，可能较旧，不能替代退出后的独立目录备份。

回滚步骤：正常退出 preview，先复制 preview 数据另存；普通卸载 preview；安装已校验旧 `.15`，不自动运行；先用新的隔离目录和备份副本验证；确认旧版可读后才恢复需要的数据。不要把旧备份直接盖到唯一新数据上，保留新旧两份和各自版本/hash。无自动更新，本轮未发布 release/合并 main；`.15` 没有这轮组合输入及延迟续作修复，回滚意味着相应保护撤回。

正常退出会等待已发出的保存；新建输入依赖节流草稿保存，编辑只有提交时写入。Windows 注销/关机不触发正常 `before-quit/will-quit`，强制终止、断电及未 ACK 尾部/未提交编辑不能承诺零丢失。[Electron 退出事件说明](https://www.electronjs.org/docs/latest/api/app#event-before-quit)。
