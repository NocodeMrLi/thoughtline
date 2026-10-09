# 新图标 Windows 包：独立 QA 固定入口

私有分支 `codex/thoughtline-windows-preflight-20261009`；最终打包源码冻结 **`aa23b210ce26de956f88c48851dc1681ab233f6b`**，版本 **`0.0.16-preview.6`**。后续文档/证据 HEAD 不作为打包 source。本次 QA 不继承旧图标 `.5` 包 QA 结论，也不把图标资源离线 QA 扩大为消费者 Windows 验收。

整合基线 `17823b064be8994e96e283edddea7515dc1dfc12`。只 cherry-pick 已批准图标 `9bc6ef45856090f5e74a4dac63b2a00639770178` 与清单 `70c064981c2b26505e58a8dcc72d40e96839e3e6`，本树对应 `f523039`、`0437e33`；没有 merge 图标分支的旧代码。生产唯一增量为 `src/main/index.ts` 托盘图标路径和平台尺寸处理，其余 src 与 `4400f73d430256b5731840610b9f0ccfcd0b8147` 相同，存储/契约与 `.15` 相同。

本地 Node24.19.0 verify：102unit通过/4Windows-only跳过、类型/构建通过。[日志](evidence/windows-v11/mac-verify.log)。所有资产与批准 manifest 相同；旧 `.5` 安装器反向对照被新 PE 图标检查拒绝。[对照](evidence/windows-v11/old-installer-icon-negative-control.json)。原始 1254 JPEG、alpha 规格、ICNS10表示、App/Tray ICO7帧的资产 QA 见 [固定检查点](https://github.com/NocodeMrLi/thoughtline/blob/aa23b210ce26de956f88c48851dc1681ab233f6b/acceptance/ICON-ASSET-CHECKPOINT.md) 和 [批准清单](https://github.com/NocodeMrLi/thoughtline/blob/aa23b210ce26de956f88c48851dc1681ab233f6b/acceptance/evidence/icon-final/resource-verification.json)。不重跑 exporter 覆盖冻结资产。

准确 Windows run：[37893774452](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452)。以 [交付报告](WINDOWS-V11-DELIVERY-20261009.md) 的最终结果/准确 artifact、installer hash 和下载 receipt 为准。CI 实际跑106unit/类型/构建、安装/重装/卸载合成数据保留、同 profile 单实例、已安装版保存/退出、全部编译输出及 App/Tray ICO 的 ASAR 字节比对、App/installer/uninstaller PE 各图标帧与批准 ICO 比对。PE 解析只读取资源，无修改/重新编码；不等同 Explorer/任务栏图标缓存实机表现。

建议只读核对：冻结 source 与 run headSha/version一致；`src` diff限托盘；资产清单 hash全匹配；签名 `NotSigned`；下载 exe与`SHA256SUMS`一致；实际 runner JSON passed、保留快照 hash一致；PE匹配组各尺寸/帧hash全一致；正常卸载与显式 `--delete-app-data` 区别准确；旧版 schema/source兼容与实际 `.15` 升级/降级未验边界准确；用户隔离入口精确版本 `.6`且不更改系统执行策略。

`scripts/windows-installed-preflight.cjs` 和 `windows-installer-preflight.ps1` 仅供一次性 GitHub Windows runner，不在用户 profile 或 Mac 实机运行。QA 如使用 native需独立目录并先协调，当前本轮 Mac无native启动，原安装版/原开发区进程持续运行未终止。当前独立最终整合 QA 结果 **待 QA 线程完成**；不能预写通过。物理IME/焦点/穿透、消费者Win10/11/多屏缩放、真实Agent/G7、旧版升级/回滚和完整体感仍未验，formalAcceptance=false。

当前独立只读 QA 线程：`01a11f5d-cf47-7244-a3d5-aa1d8831c0c8`。Ctrl+Enter：本run只跑单元逻辑，没有已安装Composer端到端键盘操作；物理IME和消费Windows焦点/透传留给用户实机。

## 可直接读取的最终产物

下载已完成并核验，没有阻挡。原始artifact目录 `/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.6`；完整manifest `/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.6/build-manifest.json`。installer `/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.6/Thoughtline-0.0.16-preview.6-win-x64.exe`，SHA256 `545bac65d545578653ca031861b98080d4e6ea46c94db51cd493565734289266`，112978436 bytes。artifact 11598913007，私有owner NocodeMrLi/thoughtline；[下载入口](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452/artifacts/11598913007)。完整最终报告 `/Users/lihongwei/Documents/Codex/2026-10-09/task-7/thoughtline-windows-preflight/acceptance/WINDOWS-V11-DELIVERY-20261009.md`。

原样CI JSON及download-receipt已保存在 `/Users/lihongwei/Documents/Codex/2026-10-09/task-7/thoughtline-windows-preflight/acceptance/evidence/windows-v11`；三份结果passed=true，headSha一致。安装器下载后只读PE验证见 downloaded-installer-pe-check.json；包含完整7帧，和CI一致。installer字符串FileVersion/ProductVersion=.6，PE固定数字0.0.16.0；App runtime/FileVersion=.6，numeric ProductVersion0.0.16.0。失败run37892900652/37893261320的完整日志、run JSON、第二次部分JSON、CRLF精确复现与256px红绿/旧图拒绝均在同一证据目录。
