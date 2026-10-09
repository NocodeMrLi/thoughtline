# Thoughtline 合成输入 P2 固定交接

独立工作树 `/Users/lihongwei/Documents/Codex/2026-10-09/task-6/thoughtline-composition-safety`；私有分支 `codex/thoughtline-composition-safety-20261009`。修复源码/专项测试 `3731dbc88424876838ce11c61d6e20a04b85a0d0`；证据及报告 `f4f30b338f09bfd406d737fadced4599913e4753`。本交接后续仅文档提交；源码/编译/证据字节不变。完整范围与下一包命令见[阶段报告](../acceptance/COMPOSITION-SAFETY-P2.md)。

从 `c3784976c5fc1877dfa337b0db4e79f3b9c8a423` 建独立工作树，原工作树 HEAD/status 不动。已认可视觉源 `4f8483af9e19883d1e5ed0ee76b6086f390d1135`、旧红证据 `f45c45d435503d832208d653e6a31ce12609281d` 及旧 `7054e70a` 红证据保留，85件哈希无变化。未改布局/Agent默认/绳/夹/.15/图标/依赖/版本。

名称/正文/项目统一合成owner保护；暂停检查点，end先同步DOM再重新节流；缺end的blur和浮层卸载回退该字段合成前值并恢复；A迟到end不解除B，重复start不覆盖回退值；flush暂停拒绝、在途完整写后不继续排空中间值；关闭/提交/prepareQuit与错误恢复保护；session key重建Composer、旧节点事件与主进程旧session/序号拒绝。编辑仍无自动保存，取消原记录不变。

Node24.19.0，102unit/24文件、typecheck/build exit0。固定source上最终20检查点原生synthetic专项exit0；未改旧probe新绿exit0（title0→0/project2→2，12flag键保护）；原草稿安全11记录回归exit0。原红未改，并新增独立暂停flush单测红exit1。[40件证据SHA](../acceptance/evidence/composition-safety/evidence-sha256.json)、[源码/专项/五编译输出绑定与快照](../acceptance/evidence/composition-safety/source-binding.json)、[26自有PID清理与原树/1/1读值审计](../acceptance/evidence/composition-safety/final-cleanup-audit.json)。初轮成功专项保存在attempt-1，不冒充最终固定source结果。

所有本任务native均结束，26个记录PID独立ps查无；自有假数据清，系统增强对比度/降低透明度1/1不改，无系统权限更改、生产笔记访问、安装/他人进程终止。新native须用新证据目录、先串行协调，不覆盖原件；用现有node_modules链接和固定Node，不能把普通App默认数据目录当fixture。

物理Mac/Windows IME/系统键菜单/焦点、Windows实机、真实Agent/G7和完整设备矩阵未验；formalAcceptance=false。不要把synthetic绿记成物理输入法全面通过；仅持久化已完成检查点，不保证尾部未ACK/编辑崩溃/断电零丢失。缺end失焦回退是保护未确认中间值，需在物理IME矩阵核实实际事件顺序。

独立QA线程 `01a11ec2-b085-730d-8c8a-ebb17db570df` 已获准确source/evidence复验请求；请以其后续只读结论为准，当前不预写QA通过。本阶段已授权commit/push私有分支；不merge main、不发布/安装/替换安装版。

Windows下一步：先等P2独立QA和另线程批准v11图标的可访问原件/哈希（Library→Mac 403仍阻挡，此处不重画/绕过）；下一包阶段集成资源并确定唯一preview版本，verify、冻结准确打包SHA。当前workflow_dispatch可对冻结私有包分支 `gh workflow run test-packages.yml --repo NocodeMrLi/thoughtline --ref <打包冻结分支>`，P2分支push不会自动触发Win包。核run headSha、下载该SHA artifact、校验exe/SHA256SUMS，再给用户隔离Windows实机入口；不把旧.15安装器称含P2。本阶段无新WindowsCI/新包/整体验收声明。
