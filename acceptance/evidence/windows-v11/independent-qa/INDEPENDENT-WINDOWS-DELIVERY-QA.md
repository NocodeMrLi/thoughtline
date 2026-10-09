# Thoughtline Windows 私有候选：独立交付 QA

2026-10-09 UTC。本阶段只读生产源码、现有证据和安装器，不运行 Electron、不安装、不改变系统设置或生产数据。只在 task-8 保存本报告。

结论：可以进入用户的 Windows 隔离实测。源码、批准图标、最新 CI、实际下载 installer、manifest 和预检 JSON 的交付绑定均通过本阶段独立复核，未发现阻挡。本报告审查进入 Windows 隔离实测的准备程度，不代表整产品全部场景最终验收；formalAcceptance=false。

## 唯一候选身份

- Windows x64，NSIS 私有候选 `0.0.16-preview.6`。
- 打包源码 `aa23b210ce26de956f88c48851dc1681ab233f6b`；分支 `codex/thoughtline-windows-preflight-20261009`。后续文档提交不作为打包 SHA。
- [实际 CI 37893774452](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452)，job `113700359470`。独立 GitHub connector 查询：验证、打包、清单、隔离入口语法检查、安装数据保留、安装器 hash、上传全部 success。
- [准确 artifact 下载入口](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452/artifacts/11598913007)，名称 `Thoughtline-Windows-x64-aa23b210ce26de956f88c48851dc1681ab233f6b`。私有仓库登录下载；独立查询已连接用户为 owner NocodeMrLi，repo admin/pull 权限，artifact 未 expired，expires_at `2026-11-08T06:31:52Z`。
- ZIP 上传 digest `03bd16a2c26f0624e7ac8a6f8983712226e7d142bdbf64bcf12bf44f5cc57f67`；这是 GitHub artifact ZIP 的 digest，不能替代 installer SHA256。
- installer `Thoughtline-0.0.16-preview.6-win-x64.exe`，112,978,436 bytes，独立复算 SHA256 **`545bac65d545578653ca031861b98080d4e6ea46c94db51cd493565734289266`**，与下载包 `SHA256SUMS.txt` 及 CI PE 报告对应。
- 实际 [manifest](/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.6/build-manifest.json)、[installer](/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.6/Thoughtline-0.0.16-preview.6-win-x64.exe)、[独立校验 receipt](INDEPENDENT-WINDOWS-DELIVERY-QA.json)。三份 Windows 预检 JSON 均 passed=true、绑定相同冻结 source。
- App runtime / FileVersion `0.0.16-preview.6`，App ProductVersion 数值 `0.0.16.0`；独立读取 installer PE 的 FileVersion / ProductVersion 字符串均为 `0.0.16-preview.6`，fixed numeric 为 `0.0.16.0`。App 与 installer 在 Windows runner 的 Authenticode 均 `NotSigned`；独立 installer PE 证书表也为空。

## 已完成的独立核验

1. 冻结源码与 `4400f73d430256b5731840610b9f0ccfcd0b8147` 比较，src 唯一增量是 main 托盘路径及平台处理；renderer、shared、preload、composer window 字节不变。实际源码包含固定 480×260、132px 正文内滚动、名称铅笔、默认 general/通用和用户主动 Agent 选择。组合 owner、失焦回退、旧节点拒绝、flush 后与延迟 info 后 live/composing/session 守卫都仍在。
2. 资产与 `9bc6ef45856090f5e74a4dac63b2a00639770178` Git 对象逐字节相同；清单与 `70c064981c2b26505e58a8dcc72d40e96839e3e6` 相同。独立 Pillow/numpy 读取批准 JPEG/透明源：1254×1254，全图 RGB 精确相同，部分 alpha 边缘 3423 像素，清单资产 hash 全匹配。没有重画或覆盖批准资产。
3. 新源码与 `.15` 冻结 `61a6837` 的 store/contracts/ideaCommands 无 diff；这证明存储/格式代码兼容，不证明实际 `.15→.16` 升级或降级已验。
4. 独立 GitHub job 日志确认 Windows Server 2025 / windows-2025-vs2026、106 tests / 25 files 通过、准确 source checkout、NSIS 构建、签名跳过、artifact 上传成功。消费者 Windows 10/11 实机行为不能由此推断。
5. 独立纯源码针对性执行 Windows Ctrl+Enter、Enter、isComposing、keyCode229 判断，以及 composition owner 切换、迟到 end、blur 回退与重新聚焦输入断言，全部通过；无 native 启动。现有 Mac 隔离合成 DOM/IPC 证据包含20项合成路径和4项延迟 info 红绿对照，范围明确为受控 harness。最新 Windows installer preflight 未执行 Composer Ctrl+Enter 端到端，更未测试物理 IME。
6. 最新 PE 检查器只读取资源，仍要求批准7帧的尺寸与 payload hash 一致，含相同帧数。独立读取实际旧 `.5` installer，当前检查器正确拒绝旧图标。实际下载新 installer 的16/24/32/48/64/128/256七帧全部与批准 ICO 精确一致，且完整匹配 CI installer PE 记录。App 与 uninstaller 的三方帧报告已核相同批准资源，native 执行证据来自实际 Windows runner，未在 Mac 重放。
7. 最终 installed-preflight 的全部 out 编译输出和 App/Tray ICO hash 与 manifest 匹配，manifest 中批准资产与本地批准字节匹配，隔离脚本 hash 匹配 manifest 且与冻结源码只差 checkout 换行。源码/资产/脚本/测试/版本/工作流等打包输入与冻结 source 无 diff。
8. 从真实预检脚本重建合成 fixture 及 revision8/settings 保存后状态，其 SHA256 分别精确等于最终报告中的 snapshot.bak.json 与 snapshot.json；marker 也匹配。安装、同版本重装、普通卸载保留断言均 true；同时保留笔记、草稿、clip，只有预期设置和 revision 改动。没有把 CI 的合成 profile 冒称用户生产数据或旧版本迁移。

## 前两轮失败和修正

- run `37892900652` / source `74bcda4`：严格资产清单在 mask JSON 遭 Windows checkout CRLF 转换后失败。独立把批准 LF 转 CRLF，精确复现失败 hash。`cb8ff51` 仅加仓库 `assets/** -text`，没有放宽清单校验或改全局 Git 设置。
- run `37893261320` / source `cb8ff51`：实际安装后 PE 检查误拒绝256帧；PE group 字节0代表256，reader 保留0而 ICO reader返回256。`aa23b21` diff仅尺寸0→256规范化，帧数量/尺寸/payload hash断言及 CI 调用保留。离线红绿证据和旧图拒绝记录仍保留，最新 CI 重新执行实际 App、installer、uninstaller 校验步骤。

## 进入实测的重要边界

包未签名；如 SmartScreen/SAC/企业策略阻挡，记录并停止该项，不修改安全设置。保留旧 `.15` 安装包，先退出并备份整个默认数据目录，再选择当前用户安装并取消完成页自动运行。相同 appId 可能替换旧安装；数据隔离不等于并排安装身份。

使用 artifact 中绑定的 `Start-Thoughtline-Isolated.ps1` 和准确 `.6` executable；隔离 profile 为 `%LOCALAPPDATA%\Thoughtline-Preflight\0.0.16-preview.6\user-data`。仅使用合成笔记。不要在用户机器运行 disposable runner 的 installer/installed-preflight 脚本。

普通卸载保留默认数据；NSIS 模板独立读取确认显式 `--delete-app-data` 会删默认 APPDATA，不能宣称所有参数都保留。同版本重装不证明跨版本升级；全用户安装与安装目录内自定义数据未验。正常保存/退出只证明完成的检查点；未 ACK 尾部、未提交编辑、强退/断电不保证零丢失。

物理 Windows IME（名称/正文/项目）、Ctrl+Enter、跨应用焦点、热键、空白穿透、真实任务栏/托盘图标缓存、多屏缩放、真实 Agent/G7、旧版升级回滚仍待用户。按 builder 的 [Windows 实机清单](/Users/lihongwei/Documents/Codex/2026-10-09/task-7/thoughtline-windows-preflight/docs/WINDOWS-ACCEPTANCE-V11-20261009.md) 逐项填写。
