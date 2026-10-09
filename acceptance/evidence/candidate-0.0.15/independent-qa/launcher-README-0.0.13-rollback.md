# 0.0.13 隔离体验入口

请双击本机入口：

`/Users/lihongwei/Documents/Codex/2026-10-09/task/delivery/启动0.0.13隔离体验.command`

也可在 Terminal 执行以上路径。保持该 Terminal 窗口到退出 App；重新体验/恢复仍从同一脚本启动。无需安装替换，不要把 App 拖到 Applications，不要从 Dock 旧图标或挂载卷直接双击 App。

脚本核对固定 0.0.13 DMG SHA、包内 asar SHA、版本和签名；以只读方式挂载，经系统正常 `open -n -W --env` 流程启动。不会删除隔离目录现有内容、沿存储符号链接读写、强制卸载或停止其他进程。若系统安全提示拦截，请由用户按正常流程处理；脚本不移除 quarantine、不禁用 Gatekeeper、不申请新权限。

固定测试数据目录：

`/Users/lihongwei/Documents/Codex/2026-10-09/task/delivery/isolated-experience-0.0.13/user-data`

这是新的独立便签/草稿/Chromium缓存目录，不从正式目录复制数据。请只写测试内容；脚本不会发送任何内容。数据保留以便下次从同一入口恢复，脚本不自动重置。

**直接双击 App 不保证隔离。** 当前生产代码 `src/main/index.ts:19` 未指定 `THOUGHTLINE_DATA_DIR` 时，使用正式 `~/Library/Application Support/Thoughtline`。本脚本明确覆盖这个环境变量，也明确清空开发 renderer URL；不依赖普通 shell 环境经 LaunchServices 继承。此前“直接从DMG双击作隔离体验”的说明已撤回。

建议先从旧版托盘退出旧实例，仅为了避免两个版本抢同一系统快捷键或认错同名托盘；脚本不会替你终止旧版。数据隔离由固定环境路径实现，不靠“先退出”实现。

最短体验：双击脚本 → 托盘写一条假念头 → 设置打开/保存/关闭 → 再次托盘新建 → 从测试 App 托盘退出 → 再次双击同一脚本检查便签与草稿恢复。

只读预检：入口后加 `--check-only`，检查哈希、只读挂载、版本和签名后退出，未启动 App。该预检 exit0。额外独立假数据的真实 LaunchServices 测试已在运行主程序前核实传入环境、运行后核实实际 userData 和0.0.13版本，4个进程退出、挂载与临时数据清理，完整命令 exit0。验证使用临时loopback调试连接，仅验证脚本使用；默认用户入口无调试参数且尚未主动运行。

验证脚本前5轮失败/修复与短暂工具断连单独记录，未当成通过；未把此检查扩大成物理菜单、系统IME、Windows/G7或整个产品验收。证据见 `acceptance/evidence/isolation-launcher/`。
