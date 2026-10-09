# Windows 新图标私有候选交付

版本 **0.0.16-preview.6 / Windows x64**；整合用户批准的红夹 TL v11 图标和 `4400f73` 组合输入/延迟续作保护，保留本轮 Windows 安装器数据保留检查。此包与旧图标 `.5` 区分；没有公开 release、main 合并、自动更新或替换用户 Mac 安装版。

最终打包源码冻结 **`aa23b210ce26de956f88c48851dc1681ab233f6b`**，私有分支 `codex/thoughtline-windows-preflight-20261009`。[最终 CI run 37893774452](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452)。后续文档/证据 HEAD 不作为 installer 打包 source，以本 run 的 `headSha`、manifest 和下载 receipt 绑定。

## 整合与修复范围

整合起点 `17823b064be8994e96e283edddea7515dc1dfc12`；依次 cherry-pick 图标资产 `9bc6ef45856090f5e74a4dac63b2a00639770178` 与准确清单 `70c064981c2b26505e58a8dcc72d40e96839e3e6`，本树为 `f523039`、`0437e33`。审过两个提交范围，不 merge 图标分支旧代码。生产仅改变 main 托盘的 Mac template/Windows ICO 路由和尺寸处理；Composer、数据存储、IPC、合成保护、布局与原已测4400f73相同。schema/存储与 `.15` 逐字节相同，没有新增数据格式迁移。

批准原始 JPEG 保留、1254 alpha源图/1440透明画布母版、ICNS、主图与托盘 ICO 均按清单完整集成，未重新导出/重画。配置：Mac ICNS，Windows App、NSIS installer/uninstaller/header 指向 App ICO；托盘用独立7帧 ICO。小图视觉来自资产线程已看实际解码图，本轮另看16/32解码图；物理系统图标缓存/托盘感受仍需用户。

资产 `assets/** -text` 通过仓库 `.gitattributes` 保持批准的精确字节，未改任何系统或全局 Git 设置。首轮 `.6` [run37892900652](https://github.com/NocodeMrLi/thoughtline/actions/runs/37892900652)、source74bcda4，整体失败：unit/type/build/NSIS成功，严格清单比对发现 Windows checkout 将 mask JSON 转成 CRLF。将LF转CRLF所得hash精确重现失败值；只固定checkout，不放宽hash校验，资产和生产字节不变。[失败日志](evidence/windows-v11/attempt-1-failure.log)、[原因复现](evidence/windows-v11/asset-checkout-crlf-diagnosis.json)。失败候选没有作为可用下载包交付。

第二轮 `.6` [run37893261320](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893261320)、sourcecb8ff51，资产/类型/单测/NSIS通过，但新 PE 检查器误拒绝256px帧，整体失败。PE group尺寸字节0表示256，resedit的PE reader返回0、ICO reader返回256；同builder API创建的受控PE保持全部7帧payload精确一致却重现误拒绝。修复只规范化0→256，所有帧hash仍严格要求一致；正确7帧对照通过、旧 `.5` 安装器仍拒绝。不是改变批准图标或跳过校验。[失败记录](evidence/windows-v11/attempt-2-failure.log)、[旧检查器红复现](evidence/windows-v11/pe-256-dimension-reproduction.json)、[新检查器绿/旧图拒绝](evidence/windows-v11/pe-256-dimension-green.json)。实际已安装包、installer及uninstaller仍由新run重新检查，以最终结果为准。

## 验证范围

Mac Node24.19.0 verify：102unit通过、4Windows-only跳过、类型/构建通过。[日志](evidence/windows-v11/mac-verify.log)。所有整合 assets 与批准manifest hash一致；旧图标 `.5` 安装器作为反向对照被新 PE 图标检查明确拒绝。[记录](evidence/windows-v11/old-installer-icon-negative-control.json)。Mac 没有本轮 native 启动，不终止原开发区/安装版进程，不访问真实笔记。

最终 run 在 Windows Server 2025（windows-2025-vs2026）检查106unit/类型/构建/NSIS；实际安装当前用户候选并核 App 精确版本/x64、同 profile 第二进程退出、已有合成 snapshot/bak 保留、正常设置保存保全正文/草稿/clip、正常退出、同版本重装与普通卸载 snapshot/bak/marker hash不变。检查是一次性 runner，禁止在用户 profile 运行这些测试脚本；不是 `.15→.16` 实机升级或消费者桌面验收。

新增只读 PE 资源检查覆盖 **Thoughtline.exe、installer.exe、Uninstall Thoughtline.exe**：RT_GROUP_ICON/RT_ICON 的全部批准7帧尺寸/原始payload hash匹配 App ICO，并记录全部资源组。只读 PE，不修改/重新编码 executable。ASAR 比对所有 out编译文件（含 renderer JS/CSS）及 App PNG/ICO、Tray ICO；编译路径确认使用 `tray-win.ico`。隔离启动脚本语法、精确FileVersion和CheckOnly不启动/不建profile检查保留。

本 run 的 Ctrl+Enter 只在 Composer 单元逻辑中覆盖 Ctrl/Meta、isComposing 与 keyCode229；安装版预检没有打开 Composer 或发送 Ctrl+Enter，也没有物理输入法。先前4400f73的Mac合成/延迟续作专项仅证明该固定源码的合成事件路径，不能作为当前Windows端到端或物理IME验收。

## 安装、数据和回滚边界

实际下载入口/安装器hash以最终结果段为准。用户按 [新图标 Windows 实机清单](../docs/WINDOWS-ACCEPTANCE-V11-20261009.md) 先退出、备份 `%APPDATA%\Thoughtline` 并保留旧 `.15` 包；选择当前用户安装、取消完成页自动运行，再用 artifact 内绑定的隔离脚本指定准确 `.6` executable 启动 `%LOCALAPPDATA%\Thoughtline-Preflight\0.0.16-preview.6\user-data`。相同 appId 仍可替换旧安装，隔离笔记不代表并排安装身份。

普通卸载保留默认 profile；显式 `--delete-app-data` 能删除默认应用数据，本轮不传。全用户安装未验；自定义数据放在安装目录内部不作保留保证。回滚先退出和保留新旧两份完整数据，普通卸载、安装旧 `.15`，先用副本隔离验证；不能盖到唯一新数据，也不能把源码 schema兼容称实际升级/降级通过。`.15` 缺这轮合成/延迟续作保护。

App/installer 未签名，SmartScreen、SAC、企业策略可能阻止运行，不关闭安全机制/不修改系统执行策略。正常退出等待保存；Windows 注销/关机不触发正常退出回调，未 ACK 草稿尾部/未提交编辑/强退或断电无法承诺零丢失。物理IME/CtrlEnter/焦点/穿透、消费者Win10/11/ARM64/多屏缩放、真实Agent/G7、旧版升级/回滚、OS图标缓存/任务栏视觉仍需用户实机；`formalAcceptance=false`。

准确源码及独立复核事项见 [QA 固定入口](WINDOWS-V11-QA-HANDOFF-20261009.md)。独立最终整合 QA 结论待专门 QA 线程完成，本文不提前宣称其通过。

## 最终下载与原始结果

最终 run **37893774452 success**；artifact **11598913007**，名称 `Thoughtline-Windows-x64-aa23b210ce26de956f88c48851dc1681ab233f6b`，owner `NocodeMrLi/thoughtline`（私有）。登录有该仓库访问权的账号，在 [run页面](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452) 下载，或用 [artifact入口](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452/artifacts/11598913007)；有效期至 **2026-11-08 06:31:52 UTC**。没有公开release，失效后须重新确认准确构建。

本地 installer：`/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.6/Thoughtline-0.0.16-preview.6-win-x64.exe`，**112,978,436 bytes**。SHA256：

```text
545bac65d545578653ca031861b98080d4e6ea46c94db51cd493565734289266
```

下载后与 `SHA256SUMS.txt` 及CI PE报告内installer hash完全相同；artifact ZIP的GitHub digest是另一对象，不可当成exe hash。原始 [download receipt](evidence/windows-v11/download-receipt.json) 保留全部文件hash、下载路径及安装器只读版本资源；下载后又只读比对installer PE7帧，与CI记录相同，未执行/修改exe。

准确 manifest 原始文件绝对路径：`/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.6/build-manifest.json`；仓库原样副本 [build-manifest.json](evidence/windows-v11/build-manifest.json)。内容：headSha `aa23b210ce26de956f88c48851dc1681ab233f6b`、runId `37893774452`、attempt `1`、ref `refs/heads/codex/thoughtline-windows-preflight-20261009`、version `0.0.16-preview.6`、Node `v24.19.0`、x64/NSIS、signed=false、批准资产9bc6ef4/manifest70c0649、physicalWindowsAcceptance=false/formalAcceptance=false；完整hashes保存在原始JSON中（全部out/资产/package/lock/隔离脚本）。下载脚本hash符合manifest；Windows CRLF源文本标准化后与冻结源码完全相同。

- [安装版实际启动报告](evidence/windows-v11/windows-installed-preflight.json)：passed=true；runtime/FileVersion为 `0.0.16-preview.6`，x64/win32/Electron44.7.0；默认profile、隐藏不可focus shelf、同profile第二进程退出、设置真实提交/正常退出、ASAR全部输出及图标匹配均通过。没有Composer Ctrl+Enter端到端操作。
- [安装器数据保持报告](evidence/windows-v11/windows-installer-preflight.json)：passed=true；现存合成数据在当前用户安装前后保持、同版本重装/普通卸载保持、CheckOnly无profile副作用；App及installer均NotSigned。App numeric ProductVersion为 `0.0.16.0`，App FileVersion为 `.6`；下载installer的字符串FileVersion/ProductVersion均 `.6`，PE固定数字version为 `0.0.16.0`。
- [PE嵌入报告](evidence/windows-v11/windows-pe-icons.json)：passed=true；App、installer和uninstaller均有完整匹配group，7帧尺寸16/24/32/48/64/128/256与批准App ICO逐帧原始payload hash相同。图标缓存/物理视觉仍未验。

独立最终只读 QA 线程 `01a11f5d-cf47-7244-a3d5-aa1d8831c0c8` 已有准确固定入口；其结果待该线程报告，本线程不提前代签。后续文档HEAD与上面的打包source分开。
