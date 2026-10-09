# 延迟 info 提交续作增量：准确交接

私有分支 `codex/thoughtline-composition-safety-20261009`；独立工作树 `/Users/lihongwei/Documents/Codex/2026-10-09/task-6/thoughtline-composition-safety`。新 source/专项 `4400f73d430256b5731840610b9f0ccfcd0b8147`；新红绿报告/证据 `8ab41a8e14f4517f7157603042fbc7df41957d13`。本交接后续文档提交，source及证据字节不变。[完整报告](../acceptance/DELAYED-SUBMIT-CONTINUATION.md)。

父要求先复现QA静态边界。旧3731dbc上新harness三例exit2：同会话延迟对照pass；在info挂起且flush已ACK后，harness用close IPC绕过busy UI+shortcut重开，使session1→2/旧key卸载，再释放当前revision响应，旧submit1次成功将旧正文写成念头、清新draft并隐藏；释放旧捕获响应旧submit1次但CONFLICT拒绝。只能证实受控生命周期/响应时刻条件，不证明普通busy UI动作或真实IPC调度/物理IME可触发，也没有真实数据事故。

生产只补Composer await info返回后的live/composition/响应session守卫；编辑revision/其他生产文件不动。固定4400f73新四例exit0：普通同会话submit1，两个旧卸载响应submit0、未卸载错session也submit0；新draft/revision/visible/lock与磁盘保持。保护范围是info返回后、submit IPC发出前，不把已派发写IPC生命周期或任意同节点事件乱序称为覆盖。

102unit/24文件、typecheck/build、同新source未改原20P2原生专项均exit0。[45件新索引证据](../acceptance/evidence/delayed-submit/evidence-sha256.json)、[新source/五编译绑定](../acceptance/evidence/delayed-submit/green/source-binding.json)、[旧红源/编译/harness快照](../acceptance/evidence/delayed-submit/red/source-binding.json)、[最终清理/保留审计](../acceptance/evidence/delayed-submit/final-cleanup-and-preservation.json)。

本增量40自有PID全部独立ps查无，8个记录目录均不存在，系统增强对比/降低透明当前读值1/1且测试未切换；native串行时段已释放。前P2 40件原件/名称85件原件与冻结Git对象一致；原工作树HEAD c378497/status干净，旧.15/生产便签/安装版/他人进程不动。无系统权限更改、WindowsCI/新包/安装/发布/main合并。

前P2 source3731dbc/evidence f4f30b3/handoff5de9621 保留，新增报告明确收窄旧阶段异步续作全面表述，再加入已测info边界。此前QA只读结论不是本增量QA通过；将新准确SHA交QA线程01a11ec2-b085-730d-8c8a-ebb17db570df复验，结果以后续报告为准。父desktop消息仍返回thread not found，不能宣称状态已发送给父；平台会在最终回复通知父。

物理Mac/Win IME、Windows实机/真实Agent/G7/整体验收未做，formalAcceptance=false。下一Windows包仍待增量QA与另线程批准v11图标可访问原件/哈希（403尚阻挡）；独立包阶段确定唯一preview版本、verify/冻结打包SHA、workflow_dispatch核headSha/installer SHA，再给用户隔离实机入口，不把旧.15或本source绿称为新包通过。
