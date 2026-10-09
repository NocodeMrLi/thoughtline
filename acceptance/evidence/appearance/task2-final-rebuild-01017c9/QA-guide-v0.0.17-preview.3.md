# Thoughtline 0.0.17-preview.3 隔离体验与验收

本候选从同一冻结源码 `01017c9525ac971b6e97461ef2910140944eda19` 构建。227 项生产、构建、测试和交付输入的规范 Git 向量为 `72314079c3dbfb77ef813a5d4c852e9eb46fe2ab85d1b45e671acaedf49242f9`。Mac arm64 DMG 与 Windows x64 NSIS 安装器已实际生成并经过隔离自动检查。此说明由源码准备模板 `docs/delivery/README-0.0.17-preview.3-隔离体验.md` 衍生，模板 SHA256 `7a2e8f24e1c9023e1989561f05e77069e7741284797e22dda8cbf6dacc412d4d`；模板仍是准备态，实际结果以本文件、构建清单和测试回执为准。

本版在 Composer、详情和日历首层窗口的右上角提供固定 `中 / EN` 与日夜切换；设置可恢复“跟随系统”。全新隔离 profile 按系统语言选择中文或 English，已有资料且无偏好文件的 profile 保持中文。偏好独立保存，不改写念头快照；用户写下的标题、正文、项目和自定义 Agent 名称保持原文。桌面仍保留绳、夹子与哑光纸的形态。Mac/Windows 成对系统风格、原生玻璃材质和相关视频评估属于后续设计，不属于本候选的已实现内容。

## 先核对包

在本目录运行 `shasum -a 256 -c SHA256SUMS`（Windows 可用 `Get-FileHash` 对照清单）；缺少任一文件或哈希不符就停止。Mac DMG SHA256 为 `4799af1772eff9d013942d207c6235cce6a239ef89f3a2910994ef2ff5758a3d`，包内 `app.asar` 为 `72326b5e8c6fc14c6b73efe8bdfe28ce66cfd3a1f00d192c72cbfc09bfee677e`。Windows 安装器 SHA256 为 `68c6f4f1f35a5ded1c8d1a04e3c063c4d372fd003fba73ceaa4e77c7921da235`。Mac 是严格验证通过的 ad-hoc 签名，未做 Developer ID 签名或公证；Windows 应用和安装器均未签名。

## 隔离启动与手动验收

Mac：保持启动脚本与固定版本 DMG 相邻；可将这两个文件随整个验收目录搬迁或下载到新目录，从不同工作目录启动仍以脚本所在目录解析 DMG 和 `isolated-experience/user-data`。先执行 `./Start-Thoughtline-Isolated-Mac.command --check-only`，通过后执行 `./Start-Thoughtline-Isolated-Mac.command`。脚本固定核对相邻 DMG 的 SHA256、asar、版本和严格签名，从只读 DMG 启动并使用脚本所在目录 `isolated-experience/user-data`；缺失、损坏或数据目录是符号链接时拒绝启动，不回退到原制作目录。请正常退出测试 App 并弹出挂载；测试数据留作验收或手动清理。不要把 DMG 内 App 拖入现有 `/Applications` 覆盖安装。

Windows：在**独立测试环境**安装 `.exe`，退出其他 Thoughtline 后，以 PowerShell 执行 `./Start-Thoughtline-Isolated.ps1 -Executable '实际安装路径\\Thoughtline.exe' -CheckOnly`，再去掉 `-CheckOnly` 启动。脚本仅隔离笔记数据，NSIS 安装仍采用相同应用身份，可能替换本机已有安装；请勿在需要保留既有安装的日常环境试装。测试 profile 位于 `%LOCALAPPDATA%\\Thoughtline-Preflight\\0.0.17-preview.3\\user-data`。安装器的同版本重装与普通卸载保留数据已在一次性 Windows runner 中通过，仍建议对真实数据先独立备份。

建议在**各自实体设备**上按以下顺序复核：切换 English/中文、日/夜/跟随系统，确认三个首层窗口和菜单、错误提示均跟随；编辑未保存文字时切换并检查焦点、选区、输入法候选和原文；关闭重启确认偏好、日期和笔记；以 350/380/480/740 DIP、不同 DPI 和多屏检查控件无溢出与弹窗位置；用鼠标拖动、键盘方向键/Home/End、Escape 与辅助功能的减少动态效果检查手感及可操作性。Mac 可另用隔离备份验证 schema2 升级、删除恢复和备份还原。仅在自己可控的测试对话中检查微信、豆包、WorkBuddy 的接收，不要把测试内容发到真实联系人。

自动证据：Mac 实际挂载 App 的 schema2/自动保存/删除恢复/独立备份与两次恢复重启 6/6，English/夜间/编辑保持/偏好重启 3/3；Windows runner 的 230/230 单元测试、源码主 20/20 与修复 11/11、实际安装应用的 English/夜间/重启 3/3、同版本重装和普通卸载保数据均通过。完整范围与清理见同目录 `mac-package-acceptance.json`、`mac-packaged-appearance.json`、`windows-installed-preflight.json`、`windows-installer-preflight.json`、`windows-packaged-appearance.json` 和 `Windows-source-UI-evidence.zip`。这些是合成输入与托管 runner 的结果；物理输入法、DPI、多屏、焦点、自然滑动手感、系统材质和真实接收尚待实体双端独立验收。

本候选当前为未发布的私有草稿，仍待控制方完成最新实际交付复核与整体验收。旧 `.2`、`.16` 包保留供回滚；失败的 `3cb50bb`、`3fa4683`、`d9cf75b`、`4191fd8` 候选仅保留历史证据映射，不能与本次哈希混用。
