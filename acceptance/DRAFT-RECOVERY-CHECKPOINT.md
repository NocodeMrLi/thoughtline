# 新建草稿异常恢复：独立功能检查点

固定源 `cd013813e21de3d03a0a5cd3e10af1977ed1f85b`，分支 `codex/thoughtline-draft-recovery-20261009`，版本0.0.16-preview.2。基于已被用户拒绝的旧输入窗布局；本功能不表示视觉通过，不改变.15冻结包或原6638ce1/566cce0预览。新紧凑UI将在另一工作树实现。

先在旧源码566cce0的假数据进程复现：输入新正文/名称/项目/Agent，等待2.6秒，SIGKILL自己的App主进程；重开只恢复旧草稿。baseline命令exit0是成功复现丢失，`recovered:false`，不是产品通过。[旧红事实](evidence/draft-recovery/baseline-loss.json)。

当前新建输入经800ms静默节流，持续输入约2秒安排一个检查点；单写入在途，合并后续输入，无编辑就没有定时写入。复用现有snapshot原子写/文件fsync/rename和备份。主进程将草稿、关闭、提交串行；会话与单调序号挡住旧包覆写，结束写入会话后拒绝迟到消息。重载从主进程序号继续。初始化只读取，不用空白覆盖旧草稿。失败保文、不关闭、不忙等重试；继续输入按节流退避，用户可显式重试。自动保存不抢焦点。

组合输入期间暂停自动写入，确认后记录完整文本。提交/关闭先排空最新草稿，正文提交和清草稿在同一snapshot提交。正常退出捕获最新输入并等待在途写入。已有便签编辑不启用自动保存，取消保留原正文、新建草稿和revision。

验证：21文件95单测、类型检查、构建通过；当前异常终止/重开整体exit0，准确恢复中文、前后空格、换行、emoji、名称、项目与自定义Agent。[恢复结果](evidence/draft-recovery/crash-recovery.json)。安全专项整体exit0：初始化不写；合成IME负向等待2.4秒后revision、原生visible及锁保持；确认后checkpoint；renderer重载；旧序号忽略；不可写保留窗口/磁盘并显式重试；实际查找→管理→重开；保存在途三点击只一条；同会话提交后迟到草稿拒绝；编辑等待及取消完全不变；未到节流时间dirty正常退出重启保全文。[完整安全结果](evidence/draft-recovery/safety-native.json)。

失败原件保留：第一轮错误使用不存在的data-mode=browse选择器，纠正为data-view与main mode后全跑；更严格的同会话迟到IPC探测发现仅依赖原生释放标记不够，补独立关闭写入会话后全跑；失败后继续输入的重试退避单元旧红新绿。失败命令exit1不标绿，原件见attempt-1-selector-error、attempt-2-late-session和failure-backoff-red.log。

[源及五编译输出绑定](evidence/draft-recovery/source-binding.json)、[单测](evidence/draft-recovery/unit.log)、[类型](evidence/draft-recovery/typecheck.log)、[构建](evidence/draft-recovery/build.log)、[自有PID最终检查](evidence/draft-recovery/final-cleanup-check.json)。临时假数据已清理，记录的自有PID均不存在，未读取用户便签或停止他人进程。

限制：仅恢复已完成的原子检查点；崩溃发生在节流等待或写入完成前仍可能丢最后一小段，不能称每个按键即时持久或断电零丢失。组合事件为合成验证，非物理系统IME；Windows未执行、新包未构建、性能未重测。未提交编辑异常恢复不在本阶段，仅证明取消编辑不污染新建草稿或已存正文。后续紧凑UI需按新源重新复验，不继承旧布局验收。

## Independent readonly scope

[Independent report](evidence/draft-recovery-independent-readonly/READONLY-REVIEW.md) reviews exact source and builder evidence. It did not build or launch the App. It confirms no new blocking issue in this limited scope; 2s schedules a checkpoint, sequence is not disk ACK, baseline compiled bytes were not embedded, slow native IO was not injected, parent-directory fsync/power-loss guarantees are not claimed.
