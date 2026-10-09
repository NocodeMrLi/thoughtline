# Windows 交付准备：旧图标功能预检

优先结论：`0.0.16-preview.5` 是沿用现有旧图标的 Windows x64 功能预检，不是 v11 最终图标交付。所有 `src/**`、`assets/**` 与已复验的 `4400f73d430256b5731840610b9f0ccfcd0b8147` 相同。本轮仅更改版本、Windows CI/检查脚本、增加 Windows 存储重试测试与交付文档；没有 main 合并、release 发布、自动更新、安装版替换或系统安全设置修改。

冻结预检分支 `codex/thoughtline-windows-preflight-20261009`；打包 source `7a76da608a77332d0260a45f53ff20915c0305d0`。[修复后 run 37888897337](https://github.com/NocodeMrLi/thoughtline/actions/runs/37888897337) **成功**，Windows Server 2025 runner（image `windows-2025-vs2026`）106 单测/25 文件、类型/构建、NSIS 与实际安装器/包预检均通过。

下载产物 `Thoughtline-0.0.16-preview.5-win-x64.exe`，111,271,333 字节；独立 Mac 下载 SHA256 与 CI `SHA256SUMS.txt` 一致：`07da3119a9931c469b1a3aa42129c08dc79cc4d1b92bcab53bfdfbcc3234e982`。[下载核验](evidence/windows-preflight/download-verification.json)、[完整 CI](evidence/windows-preflight/final-run.json)、[实际安装器保留结果](evidence/windows-preflight/windows-installer-preflight.json)、[实际包结果](evidence/windows-preflight/windows-installed-preflight.json)、[来源与构建输出绑定](evidence/windows-preflight/build-manifest.json)。Artifact ID `11597516717`，私有登录下载，保留至 `2026-11-08T05:33:37Z`。GitHub artifact ZIP digest 与 exe hash 是不同对象，不互换。

当前用户首次安装保留已存在的合成 snapshot/bak；运行后正文/草稿/clip 保持并完成一次设置提交；同版本重装和普通卸载对 snapshot/bak/marker hash 完全不变。App/installer 均 `NotSigned`，精确 App 版本 `0.0.16-preview.5`、x64。隔离脚本 manifest hash 一致；Windows checkout 的 CRLF 与仓库 LF 仅换行差异，按原始下载字节校验 manifest，按规范化换行校验源码内容。用户隔离脚本实际启动和物理桌面表现仍待实机。

## 关键核查

- x64 NSIS，一个安装器；Node 24.19.0、Electron 44.7.0、electron-builder 26.15.3 锁定。版本在 package/lock 一致，安装后 `app.getVersion()` 精确核对 preview 版本。原生 PE 的 FileVersion 是 preview 文本，ProductVersion 可能只显示 `0.0.16.0`，因此不能只凭数字产品版本区分 preview。
- `appId=com.nocodemrli.thoughtline`、`productName=Thoughtline` 与旧版一致。默认数据在 `%APPDATA%\Thoughtline`，启动前可通过 `THOUGHTLINE_DATA_DIR` 指定隔离目录。隔离笔记不等于并排安装身份；安装器可能替换既有同身份安装。
- 已有 `requestSingleInstanceLock()`，同数据路径只让一个进程持有；没有 second-instance 打开新建窗口逻辑，第二次启动不会成为新建入口。不同隔离目录可取得各自锁，验收时不得混用。
- assisted 安装向导 `perMachine:false` 允许当前用户/所有用户选择；不是强制 per-user。本轮实际预检只使用 `/currentuser`，全用户安装/权限仍未验。
- 普通卸载数据保留：`deleteAppDataOnUninstall:false`、无自定义卸载钩子。锁定 builder 的 NSIS 模板仍接受显式 `--delete-app-data`，会递归删除 APPDATA 应用目录；本轮没有传该删除参数，不宣称所有参数都保留。自定义数据放在安装目录内部亦不作保留保证。[NSIS 文档](https://www.electron.build/docs/nsis/)。
- `.15` source `61a6837dbde290041a13226596baad5b21249fc1` 的契约、校验、clipModel 和存储文件与本轮逐字节相同；仍为 schema2，没有新增格式迁移。schema1 留原始升级前备份；未知 schema 拒绝覆盖；损坏主文件有备份恢复/原件保留规则。来源见 [代码兼容比对](evidence/windows-preflight/schema-compatibility.json)。这不是 `.15→.16→.15` 物理安装证明。
- Windows Ctrl+Enter 提交、Enter 换行，IME `isComposing/229` 和字段合成 owner 保持既有保护。材料策略 Win11 build≥22621 且聚焦可 acrylic；旧 build、失焦、低透明/高对比/forced colors 不透明。纯逻辑/既有 synthetic 证据保留，物理 IME/焦点/颜色/缩放需用户实机。
- 无 Authenticode：App 和 installer 预期 `NotSigned`。SmartScreen、Smart App Control、企业策略可能阻止执行；不保证绕过弹窗，不要求关闭安全机制。[Microsoft 说明](https://learn.microsoft.com/en-us/windows/security/operating-system-security/virus-and-threat-protection/microsoft-defender-smartscreen/)。
- 正常退出等待保存，但 Windows 注销/关机不触发正常 before-quit/will-quit；未 ACK 草稿尾部、未提交编辑、强制终止或断电不能承诺零丢失。[Electron 事件说明](https://www.electronjs.org/docs/latest/api/app#event-before-quit)。

## 测试与首轮失败

隔离 Mac 使用既有 Node 24.19.0/依赖链接：102 现有单测、类型和构建通过；4 个新增 Windows-only 原子重命名测试在 Mac 明确跳过。新 Windows 测试直接走 `process.platform==='win32'`，分别覆盖 EPERM/EBUSY/EACCES 三次失败后第四次成功，以及耗尽重试时保留旧文件、只清临时文件；不伪造 Mac 的 platform 结果。[本地最终 verify](evidence/windows-preflight/mac-verify-final.log)。

首轮 [run 37888408557](https://github.com/NocodeMrLi/thoughtline/actions/runs/37888408557)，冻结 `37471400c7b46c557f8d598baee2d09ca5eff35c`，**整体失败**：verify/NSIS、安装保留 fixture、实际读取 schema2、单实例、packaged 保存/正常退出成功；新增脚本 ASAR 成员读取使用 `/` 导致 Windows API 找不到文件。未完成重装/卸载/最终 hash/upload，通过项不得扩大。[首轮日志](evidence/windows-preflight/attempt-1-failure.log)、[部分实际包检查](evidence/windows-preflight/attempt-1/windows-installed-preflight.json)、[安装器部分报告](evidence/windows-preflight/attempt-1/windows-installer-preflight.json)。修复仅改为 `path.join(...)` 原生分隔符，保留失败原证据。

修复后预检会在一次性 Windows runner 上：种下合成数据→实际当前用户安装→核数据不变→实际启动安装版→同 profile 第二进程退出→设置保存不丢正文/草稿/clip→正常退出→ASAR 编译/图标字节与构建一致→同版本重装不改数据→普通卸载保留 snapshot/bak/marker。该检查脚本只允许 `GITHUB_ACTIONS=true + RUNNER_OS=Windows`，既有安装/数据存在立即拒绝；只清本任务 marker 的合成 profile。并校验隔离启动脚本语法及 `-CheckOnly` 不创建数据、不启动 App。

## 实机、备份与回滚入口

用户可按 [Windows 操作清单](../docs/WINDOWS-ACCEPTANCE-20261009.md) 下载校验、退出/备份正常 profile、当前用户安装、取消安装完成页自动运行，再用 hash 绑定的 `Start-Thoughtline-Isolated.ps1` 打开自造文本目录。脚本使用精确 FileVersion 拒绝误启动 `.15`，发现已有 Thoughtline 时不终止而拒绝；只对子进程暂设数据环境，不修改系统执行策略。

回滚保留新旧两份数据和旧 `.15` 已校验安装包；退出 preview、备份 preview、普通卸载、安装旧版、先用副本隔离验证。禁止覆盖唯一新数据；rollback 撤回这轮组合输入/延迟续作保护。schema2 源码兼容已核，实际旧版升级/降级/全用户安装、消费者 Windows10/11 设备矩阵、物理 IME/快捷键/穿透、真实 Agent/G7/整体体感仍待验；`formalAcceptance=false`。图标 v11 源材 403 是最终图标包阻挡，不阻挡上述旧图标功能预检。

收尾协调更新：用户已将选定图标保存为 `/Users/lihongwei/Desktop/TL品牌LOGO.jpg`，图标线程 `01a11eb6-5f7f-75f8-ae51-f02e6b1e10ee` 正做本地质量检查和正式资源固定；Library403 不再是唯一取件路径。本预检没有读取/导入未核图。最终图标包待资产 SHA/QA 固定后，基于本分支集成资产提交、选新 preview 版本并重新冻结构建；不要直接覆盖7a76da6对应旧图标安装器或把其成功 CI 复用为新图标包通过。
