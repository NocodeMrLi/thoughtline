# 延迟 info 后旧提交续作：条件边界复现与最小修复

修复源码/专项固定 `4400f73d430256b5731840610b9f0ccfcd0b8147`，私有分支 `codex/thoughtline-composition-safety-20261009`。此前 P2 source `3731dbc88424876838ce11c61d6e20a04b85a0d0`、证据 `f4f30b338f09bfd406d737fadced4599913e4753` 和交接 `5de9621d0873aa9346113e7bf24d19b9c9fc5de8` 全部保留。

QA 的[原只读报告](evidence/delayed-submit/qa-prior-readonly-review.md)指出：flush 后已有 live 检查，但新建 submit 还 await info，返回后未检查组件卸载/session；原 saveDraft session 拒绝与旧节点测试不能证明这条异步续作安全。当时只有静态风险，父要求先受控复现再修。本增量未将其预先写成普通用户必然触发的 bug。

## 受控旧红的明确结果

[旧红结果](evidence/delayed-submit/red/result.json)、[执行日志](evidence/delayed-submit/red/native.log)、[旧生产/五编译/harness 快照绑定](evidence/delayed-submit/red/source-binding.json)，命令 exit2。

新 harness 仅在临时 protocol-entry 中包裹真实 main IPC handler：指定一次 Composer info 请求用 promise 门暂停；断言 dirty flush 已写入磁盘且尚未调用 submit。切换案例通过隔离 close IPC 绕过已 disabled 的 busy 控件，然后用 fixture shortcut 回调重新打开，真实 session1→2/React key 卸载，确认旧 DOM 已断开；新会话三个字段先完成 checkpoint，再释放旧 info。未增加生产 IPC、测试启动开关或权限。

| 条件 | 旧 source 结果 |
|---|---|
| 延迟但不切换，同会话对照 | submit 一次成功，正常保存完整旧输入 |
| 关闭/重开卸载后，释放时重新读取当前 info | 旧闭包 submit 一次，拿当前 revision3 成功写入旧正文，revision3→4，新会话 draft 清空并隐藏 |
| 关闭/重开卸载后，释放原捕获 info | 旧闭包仍 submit 一次，但 revision1 被 CONFLICT 拒绝；新 draft/revision3/可见锁保持 |

因此，**旧源码在受控生命周期切换+延迟响应条件下会发送旧提交，返回当前 revision 时会影响新会话。** 测试强制关闭 IPC 绕过普通 busy UI，且 info 延迟/返回时刻由 test harness 控制；未证明普通用户界面动作序列、真实生产 IPC调度或物理IME可达到此条件，更没有真实笔记事故证据。

## 最小生产改动与新绿

生产仅修改 Composer submit 中原一行展开为六行：保留 flush 后检查，编辑仍使用原 revision；新建 await info 返回后检查 `live.current`、合成状态，以及响应 `composerSession` 是否等于本闭包的 session，之后才取 revision 并派发 submit。其余主进程/bridge/preload/scheduler/composition owner/布局/CSS/默认Agent/依赖/版本不变。

[新绿四例](evidence/delayed-submit/green/result.json) exit0，释放后观察2400ms：同会话对照仍正常提交一次；卸载后的当前/捕获响应均 submit **0次**，新会话 draft/revision/原生可见及锁保持；额外“组件未卸载但 fixture 返回错 session”也 submit0，区分验证响应 session 检查。每例写盘及精确自有PID/假数据清理断言随结果记录。

新 source：[102unit/24文件](evidence/delayed-submit/green/unit.log)、[typecheck](evidence/delayed-submit/green/typecheck.log)、[build](evidence/delayed-submit/green/build.log)均exit0；原未改20检查点[合成安全专项复跑](evidence/delayed-submit/green/p2-regression/result.json)在同source上exit0，验证普通提交、取消/重开、合成/退出/迟到节点路径继续成立。[新源码与五编译输出快照绑定](evidence/delayed-submit/green/source-binding.json)包含精确哈希，旧红快照保留实际旧源/harness字节。

这里收口的是 **info 返回后、submit IPC 派发前** 的 await 延迟边界。已有 P2 的全面“失效会话异步续作不写新会话”表述应按其原证据收窄为旧节点/旧saveDraft/flush后已测路径，再加本增量明确验证的info后续作。本专项没有人为延迟已发出的submit/close/saveDraft写IPC，不宣称所有在途IPC、任意同节点事件乱序或物理输入时序安全。主进程原串行写队列/原子检查点/session序号策略保持。

## 冻结、清理与后续

本阶段仅自有临时假数据/进程，原40件P2与85件名称证据字节不变。[独立最终审计](evidence/delayed-submit/final-cleanup-and-preservation.json)核本增量40个自有PID全部ps查无、8个明确路径临时目录均不存在，旧40/85件索引哈希与各冻结Git对象匹配；当前增强对比度/降低透明度读值1/1，测试未切换。所有native结束后释放串行时段，不更改系统权限、生产数据、原工作树/安装版、他人进程或旧0.0.15。

独立QA按新准确source/evidence复核本增量；不能把原只读报告当作本增量已通过结论。物理Mac/Windows IME、Windows实机/真实Agent/G7及整体验收仍未做，formalAcceptance=false。下一包仍需P2增量QA与另线程批准v11图标的可访问原件/哈希（Library→Mac403仍阻挡）；独立包阶段唯一preview版本与打包SHA冻结后手动workflow_dispatch、核run headSha和exe/SHA256SUMS，再给用户Windows隔离实机入口。本任务无新CI/新包/安装/发布/main合并。
