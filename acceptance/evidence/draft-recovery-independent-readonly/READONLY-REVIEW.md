# 新建草稿恢复：独立只读 QA

固定源码和红绿证据已审阅，**未发现本次只读范围内阻挡检查点功能的新 P1/P2 产品问题**。当前声明与实现相符：恢复已完成的新建草稿原子检查点；不承诺最后未确认输入、未提交编辑或断电零丢失。没有我方原生/构建运行，不代表独立原生验收、新包或物理设备通过。

固定源 `cd013813e21de3d03a0a5cd3e10af1977ed1f85b`，证据 `f92fa59206843ccec57118985864912c3901351a`，版本 `0.0.16-preview.2`，私有分支 `codex/thoughtline-draft-recovery-20261009`。准确远端对象已获取；10项声明源码SHA、20项原证据索引全匹配，5项构建者当前编译文件只读SHA也匹配。源到证据的src/tests/scripts/package/.github无差异。不是独立重建的输出等价证明。见 [绑定核对](readonly-binding-check.json)、[原报告](DRAFT-RECOVERY-CHECKPOINT-original.md)、[源码差异](source.diff)。

## 生命周期和数据路径

- `DraftAutosaver` 初始化不写；只在update后设定时器。800ms静默与2s maxWait安排检查点，一次在途写入合并后续输入，成功后无脏数据便不留空闲计时器。2s是安排时间，组合暂停、已有在途IO或IO延迟可延后完成，不是2s内必定持久化。
- 最新草稿对象与正在写入的版本分开；flush等待已有写入，再排空最新值。失败不标savedVersion，保留dirty，记录新的退避起点，不在无新输入时无限自旋；继续输入按节流再试，显式关闭/提交的flush可以重试。
- 主进程save-draft、close、submit共用串行队列。自动草稿写入在执行时验证可信Composer主frame、新建模式、session、仍开放的draftWritableSession、正整数单调sequence及退出状态；旧序号不覆写，已结束会话拒绝迟到消息。关闭/提交成功使draftWritableSession失效，直接修复原严格迟到探测的红事实。
- 只有成功repository commit才更新snapshot/composerContext并publish；失败保持上一个已存快照。主进程接收序号会先推进，因此序号本身不能当作磁盘完成ack；以saveDraft成功结果/已更新snapshot及实际snapshot文件判断已完成检查点。
- 重载从主进程sequence继续，context提供最近成功草稿；不会用初始化空白覆盖旧数据。自动草稿写入也更新保留的undo快照中的draft/revision，避免该历史状态携带旧草稿。
- 复用现有repository验证、排队、backup以及temp→文件fsync→rename；没有新增独立易失内存“恢复保证”。该atomic实现没有父目录fsync，SIGKILL后的已完成文件检查点证据不构成断电零丢失保证，原报告也未作此承诺。
- CompositionStart暂停计时写入，End恢复；键盘Submit/Esc继续有composing/229防护。自动保存错误不抢焦点，显式操作失败保留文字并聚焦；编辑模式不创建autosaver，取消仍不提交编辑。物理IME及在组合中使用鼠标按钮的系统事件次序仍不凭合成事件放行。
- 关闭/提交先flush；新建提交再读取最新revision，提交正文与清draft在同一个snapshot提交。正常退出等主进程队列及repository，捕获最新renderer草稿；renderer暂停自己的计时器，退出失败恢复。未提交编辑异常恢复明确不在范围。

这些是源码审阅结果，没有自己运行上述路径。当前布局/CSS仍是被用户拒绝的530×520预览，功能修复不改变视觉否定；0.0.15冻结包保持单独。

## 红绿证据的实际含义

| 证据 | 审阅结论 |
|---|---|
| [baseline-loss](evidence/baseline-loss.json) | 命令exit0表示成功复现丢失，`recovered:false`；等待2.6s后自己的SIGKILL重开仍为旧草稿，不能标产品通过。原报告声明基线566cce0；baseline JSON未独立记录准确源/编译SHA，本人没有绑定或执行那个基线可执行文件。 |
| [crash-recovery](evidence/crash-recovery.json) | 当前等待主进程完整草稿确认，读取实际snapshot，SIGKILL自己的主进程，重启核正文前后空格/换行/emoji、名称、项目、custom Agent全部精确恢复。恢复的是完成的检查点，不是节流窗口中的最后输入。 |
| [safety-native](evidence/safety-native.json) | 完整11个checkpoint与绿日志一致：不改hydration、组合负向/正向、renderer重载、旧序号、不可写/重试、查找链、提交后原生观察、迟到拒绝、编辑取消、dirty正常退出重开。 |
| [单测](evidence/unit.log) | 构建者21文件95测试通过；新增7个scheduler用fake timers覆盖初始不写/合并/2s安排、IME暂停、延迟写入串行flush、失败不自旋/继续输入退避、dispose取消。类型/构建日志也保留。我方没有重跑单测或构建。 |
| [清理](evidence/final-cleanup-check.json) | 原记录列42个自有PID、allAbsent、每轮假数据删除；helper先等待这些PID不存在再有界删除，不停止别人的进程。本人只审阅记录和helper，没有启动或终止任何原生实例。 |

首轮 [选择器错误](evidence/attempt-1-selector-error/safety-native.log) 是查不存在的data-mode=browse，非产品失败；第二轮 [严格同会话迟到红](evidence/attempt-2-late-session/safety-native.log) 的`assert(!post.ok)`确实失败，属于原实现会话防护缺口，新独立write-session guard后完整复跑绿。[重试退避单元红](evidence/failure-backoff-red.log)显示失败后继续输入产生过早的第二次写入；当前since重置和对应单测绿支持修复。原失败/结果/脚本均保留，未合并成全绿历史。

## 上一轮证据缺口与当前边界

上一轮“组合事件后立即查revision”的缺口在这份fixture中已补：组合开始、修改中间文本、合成Enter/Esc后 **等待2.4s**，大于当前2s安排窗口，再核revision/已存草稿不变、原生Composer可见、interactionLocked=true；随后End并等待完整文本checkpoint。可关闭“该合成路径只立即查询”的P3缺口，不扩大成物理IME或所有任意异步延迟都不可能的证明。

同进程关闭重开的局限也补了独立dirty正常退出/restart；新查找→保存关闭→manage模式→重开的实际链已覆盖。此前的组内Agent编辑迁移、长文/低工作区、系统焦点和真实设备矩阵仍未因此覆盖。

剩余非阻塞证据边界：三次点击是在同批submit/flush开始时发生，没有在原生fixture注入一个已经存在的慢IO写入；该延迟在途排空情景由scheduler单元覆盖。单测本身不等于完整renderer/main原生慢IO矩阵。正常退出当前原生案例核了最新正文及已存note，名称/项目/Agent的四字段异常恢复由另一SIGKILL案例覆盖，不拼成所有字段所有退出方式全矩阵。

**通过的只读项：** 固定对象/SHA、源码逻辑和原红绿证据范围核对；没有新增复现产品失败。**保留的失败：** 原严格迟到/退避红及选择器错误，当前构建者完整专项已绿。**未测/不放行：** 我方独立原生/重建、物理IME/Windows/真实Agent、新包/性能、断电、最后未ack输入、编辑异常恢复、完整慢IO/隐藏多因素矩阵。formalAcceptance=false。

父转用户02:52已授权下一紧凑方向，最新约束是短/长正文均固定textarea高度内部滚动；Mac vibrancy/玻璃质感并非真NSGlass，Windows Acrylic及回退仍待下一候选实际证据。此方向与恢复功能的当前只读结论分开，不能继承旧视觉或当前源专项通过。

全部原件、审阅上下文与报告相对路径SHA见 [evidence-sha256.json](evidence-sha256.json)。
