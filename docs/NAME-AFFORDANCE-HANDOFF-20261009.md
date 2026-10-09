# 名称提示小修与组合修复入口

独立工作树：`/Users/lihongwei/Documents/Codex/2026-10-09/task-5/thoughtline-name-affordance`；私有分支`codex/thoughtline-name-affordance-20261009`。最终视觉source `4f8483af9e19883d1e5ed0ee76b6086f390d1135`，前置hover-only `7054e70a450ef78d7e552d7cf372336394e8a0be`；视觉与原红证据提交 `f45c45d435503d832208d653e6a31ce12609281d`；[完整视觉/原红报告](../acceptance/NAME-AFFORDANCE-PREVIEW.md)。当前交接仅文档后续提交，source和85件证据字节不变。

名称可选placeholder已有，最终补常显铅笔、点击直接编辑、tooltip、1DIP focus细线、轻背景和50字边界。10场景10检查点、96unit/type/build通过；实际默认空名称与“一个小念头”图见报告。480×260、132正文、通用Agent、项目/给谁/挂上、绳架/.15冻结不变。系统两项偏好保持1/1，没有本轮玻璃图或新包。

QA提出组合输入补测，最终source上两字段负向checkpoint均红，probe exit2；完整结束值和12项flagged键保护通过。原红必须保留。父授权先冻结视觉+红证据，再单独新源码提交修复暂停/恢复与flush保护并补终止/切换字段边界，不能直接把红改绿或混入视觉commit。父也明确授权若上下文已长先交接开新任务；本会话走过两轮视觉增量和两个红probe后，选择**冻结、安全交接给新任务**。新修复任务无需再次问用户批准普通bugfix。本会话不启动下一轮原生，所有自有测试已清理释放。

新修复应考虑：名称、正文、项目统一组合状态；compositionstart暂停自动checkpoint；end恢复完成值；手动flush/关闭/提交/prepareQuit不应绕过组合保护；焦点切换或renderer重载不得留下永久暂停；有多个字段时切换不误提交；失败/重复提交/草稿恢复保持原有行为。当前正文有composing ref与pause/resume，两个input只有onChange，DraftAutosaver.flush会直接persist并不检查paused；不能只补两个事件后漏掉flush路径。建议先写独立红→绿及普通暂停flush、A→B切换/迟到end、取消/blur/reload/退出、选字Enter/Esc/⌘Enter的边界，用实际源码假数据专项确认，再单独fix commit+新证据+QA。只用隔离假数据，原生串行、不再变更辅助功能、临时目录和所有自有PID立即清理。物理IME未测必须保留。

最终需独立QA线程01a11ec2-b085-730d-8c8a-ebb17db570df审准确source/evidence；父源线程01a1183b-dc93-75cb-9662-6c7ae25bc01e在桌面消息工具中返回thread not found，不能假称已发送状态，平台最终会通知父。阶段commit/push已授权，仅私有分支，不merge/release/package/install。应用图标由另一线程负责。
