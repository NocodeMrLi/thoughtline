# 0.0.13 隔离体验入口独立只读检查

**未发现阻塞；本机可供用户双击的正确入口是**：

`/Users/lihongwei/Documents/Codex/2026-10-09/task/delivery/启动0.0.13隔离体验.command`

不是直接双击DMG/App，也不是旧Dock图标。QA没有执行默认入口、`--check-only` 或启动用户预览；本轮只有文件阅读、`zsh -n`语法检查、本机`open -h`能力查询与SHA/git对象核对。

## 绑定核验

- 文档/入口提交：`85a3f589dc93f814b5b7ff138c423536a43594f1`。
- 生产源码仍为 `dee1f2c9046b284e2dd430632d9bdb913128c868`；src/tests/package/lock/.github没有差异。
- 本机脚本与该提交 `docs/delivery/启动0.0.13隔离体验.command` 逐字节一致，SHA256 `684aa39dd53bfa4de1eea223079b675b904c1954bbc128b7d80a81e4e94b0c0a`，本机权限700，当前用户可执行。
- 本机README与提交原件一致，SHA256 `0479efd76be81008f2f6f591e84fc8b38c3e6b2fad7a707375d53610831dc0cf`。
- 指定源DMG实际仍存在，SHA256 `63abca7db97acbde1876b26cf7f4394bb4e09a0888c38a72320cc1f7fe431f9c`，与本轮既有独立0.0.13包验证一致。脚本asar期望值 `4af1687daa8725dbbaa6793245a68aa4ed6681c5034197c7e30b39e917ae220e` 同样与既有独立包核验一致。本轮不重新挂载。
- 提交中的9份启动验证证据SHA全部与其索引吻合，launcher-status绑定本机脚本SHA；详细 [review-binding.json](qa-isolation-launcher-review/review-binding.json)。

## 路径、注入与清理

| 项目 | 静态结论 |
| --- | --- |
| 参数入口 | 只接受无参数或唯一`--check-only`；不能传任意包、目录、代码或App参数 |
| Shell引用 | 固定路径为字面量，全部路径参数双引号引用；无eval、未引用参数、由文件内容拼接的shell命令 |
| 候选选择 | 固定DMG，先核验SHA，再readonly/nobrowse/noautoopen挂载；核验asar SHA、plist版本0.0.13、deep/strict签名后才open；失败停止，没有安装版fallback |
| 实际启动 | 本机open帮助确认支持`--env`；`open -n -W`选择准确挂载App并等其退出，明确传THOUGHTLINE_DATA_DIR，清空开发renderer URL、run-as-node与NODE_OPTIONS；无内容参数 |
| 数据隔离 | 固定`delivery/isolated-experience-0.0.13/user-data`，不复制正式便签；生产源码在repository和single-instance lock之前使用该环境路径设置userData |
| 现有路径 | 当前隔离目录及其祖先的实际路径共11项均非符号链接；脚本拒绝自身root/data/mount及三类已知snapshot存储文件符号链接 |
| 旧实例 | 只建议用户自己从旧托盘退出；脚本没有kill/pkill/自动关闭安装版 |
| 清理范围 | EXIT trap仅在本脚本attach成功后，尝试detach自身固定mount；不force、不rm体验数据。挂载仍忙时提示用户退出后弹出，不终止App、不删目录 |
| 系统安全 | 无xattr/quarantine移除、Gatekeeper禁用、替换Applications或权限绕过；安全提示由用户按正常流程处理 |

无实际注入风险或越界清理在本轮代码/当前路径中被发现。符号链接判断的范围是入口目录与明确列出的snapshot文件，不能扩大为对任意恶意后续目录改写/并发篡改的通用安全保证；本机实际祖先路径已另行核对。脚本完整文件保存在 [只读原件副本](qa-isolation-launcher-review/启动0.0.13隔离体验.command)。

## 证据与体验局限

README已正确撤回“从DMG直接双击即隔离”的旧建议。数据目录不会自动重置，重新体验/恢复必须使用同一脚本。Terminal应保持到测试App退出；若中途关闭Terminal而App仍运行，脚本不会强制结束它或卸载在用卷，下次应先退出并弹出旧挂载。`--check-only`不启动App，但会创建必要的隔离目录并暂时挂载只读包，不能称为对整个文件系统零写入的检查。

构建者证据是额外临时假数据的实际LaunchServices测试：在main执行前通过临时loopback inspector核实环境，随后核实actualuserData/0.0.13、4PID退出、卸载及假数据清理；exit0。五轮先前失败单独保留，不当作通过。该验证与默认脚本采用相同open/env参数，同时增加了临时调试参数和临时数据路径，**不是默认固定体验目录已经启动**。QA本轮只审阅和核对该证据，没有独立重跑LaunchServices。

入口是本机固定绝对路径方案，不能承诺移到另一台Mac/目录仍可用，也不能保证其他系统安全策略或权限状态。用户仍需正常处理macOS安全提示。本轮不新增物理菜单/IME、Windows、G7或完整产品验收结论；0.0.13既有受影响增量通过保持原范围。
