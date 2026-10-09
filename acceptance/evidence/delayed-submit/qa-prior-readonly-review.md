# Thoughtline P2 独立只读复验

结论：固定源码的名称/正文/项目合成检查点修复及现有 synthetic 回归证据成立；在这些已覆盖路径未发现新的阻断缺陷。不能据此声明物理 IME、Windows 或整体验收通过。另有一处条件性异步续作边界尚未覆盖，详见下文；阶段报告“失效会话异步续作不写新会话”的全面表述目前超过证据。

本报告只读核源码、Git 对象、编译快照、原件、执行记录及当前精确 PID/系统偏好；没有运行 unit/type/build/native，没有改冻结工作树、原件、设置、生产数据或安装版。报告及复验脚本仅写入 task-4 新目录。

## 准确冻结

| 身份 | 完整 SHA |
|---|---|
| 修复源码及专项脚本 | `3731dbc88424876838ce11c61d6e20a04b85a0d0` |
| 新证据及阶段报告 | `f4f30b338f09bfd406d737fadced4599913e4753` |
| 文档交接 HEAD | `5de9621d0873aa9346113e7bf24d19b9c9fc5de8` |
| 已认可名称视觉源 | `4f8483af9e19883d1e5ed0ee76b6086f390d1135` |
| 保留旧视觉/红证据 | `f45c45d435503d832208d653e6a31ce12609281d` |
| 前置交接 | `c3784976c5fc1877dfa337b0db4e79f3b9c8a423` |

工作树 `/Users/lihongwei/Documents/Codex/2026-10-09/task-6/thoughtline-composition-safety`，私有分支 `codex/thoughtline-composition-safety-20261009`。当前 HEAD、origin tracking ref 均为上述交接 SHA，工作树干净。读取 builder 执行记录还可见成功 push 与当时 `ls-remote` 同 SHA；QA 未另行 fetch/远端查询。

## 绑定与保留

[只读绑定结果](readonly-binding-check.json)核15份源码的当前字节、固定 source Git 对象和证据快照，五份实际编译输出与冻结快照，40件新索引证据的当前字节与 evidence Git 对象，85件旧索引原件与旧证据对象，全部 SHA256 匹配。40件索引不包含索引文件自身；证据提交共41个新增文件。

源码后续至交接 HEAD 的生产/测试代码 diff 为空。`src/main`、`src/preload`、CSS、package/package-lock、`.github`、resources 与视觉源逐字节相同，未扩大窗口、布局、图标、依赖/版本范围。此前实际窗口视觉由名称阶段独立报告覆盖，本 P2 没有新截图，也没有新的 vibrancy/NSGlass 验证声明。

[补充绑定结果](supplementary-binding-check.json)确认新增红 flush 证据的 scheduler 源码等于前置交接；原 probe 与既有草稿安全脚本未改。成长笔记镜像中43份报告/证据文件与冻结工作树全部逐字节相同；本 QA 未修改该外部目录。

## 源码与覆盖

`src/shared/compositionSession.ts:10` 以节点持有 owner，重复 start 保留首次回退值；不同 owner 切换退休旧节点，迟到 end 不解除新 owner；早于 start 的 end、无 active 的重复 end 忽略；blur 回退本字段并退休节点，重新 focus 才恢复接受变更。名称/正文/项目在 `Composer.tsx:33` 共用这一套事件。end 先同步当前 DOM，再恢复；缺 end 的 blur/项目浮层关闭先回退再恢复，保留其他字段。不同字段 owner 的隔离已覆盖；同一节点复用后极端迟到事件仍应在物理事件顺序矩阵核实，不能扩称任意事件乱序安全。

`src/shared/draftAutosaver.ts:6` 暂停取消 timer；resume 重置等待窗口，避免合成期间耗尽 maxWait。`flush():17` 等在途完整写结束后，若仍暂停且有 dirty 则拒绝，不排空中间值，也不忙等。两项新增 flush 单测有前置红、新绿；原单测还覆盖新节流、重试与 dispose。已经发出的完整值允许完成属于明确设计。

`Composer.tsx:21` 在组合期间拒绝 prepareQuit；退出错误在仍组合时不恢复 autosaver。error 焦点也避免主动移走组合 owner。提交/关闭入口及键处理检查当前组合和 inFlight，普通键、flag/229 键及三点击去重覆盖。`main.tsx:15` 的 session key 重建组件；cleanup 清 listener/timer，旧节点事件不进入新组件；主进程既有 session/sequence 拒绝仅适用于 `saveDraft`，不要扩大到全部 IPC。

[builder执行记录](builder-execution-records.json)、冻结日志和命令结果相符：Node24.19.0，102 unit/24文件、typecheck/build exit0；本 QA 未重跑。最终 native `passed=true`、20检查点与脚本断言相符：三字段2.4秒负向/结束完整值/结束后input共9项，A→B迟到end、重复start与缺end失焦、取消end不改盘、项目浮层卸载、两次退出拒绝及随后恢复、renderer重载、关闭重开及旧节点/旧会话拒绝、一次提交、编辑取消、正常退出最终dirty写盘。

[原 probe 新绿](original-probe-result.json)名称 revision0→0、项目2→2，盘上 draft 不变；两字段各6项 flag/229键状态相同，end完整检查点通过，之后普通 Esc/Enter/⌘Enter通过。旧红仍为0→1/3→4，未被替换。既有草稿安全回归有11条记录，涵盖初始化、合成、重载/序号、IO失败重试、关闭托盘重开、提交去重、编辑取消、dirty正常退出重启。

以上 native 是实际 Mac Electron 窗口/锁/IPC/磁盘上的隔离 synthetic DOM 输入；全局快捷键注册是 fixture 模拟。托盘回归实际调用原生 MenuItem callback，未证明用户物理点击系统菜单。程序 `.click()` 与协议指针 click 的 blur 顺序不同；专项两种都有用，但不是物理 IME候选菜单测试。直接按钮/无flag键检查是当时状态断言，不应扩为所有延迟组合时序穷尽覆盖。

## 条件性待复验：延迟 info 后的旧提交续作

准确位置 `src/renderer/components/Composer.tsx:56`：await flush 后检查 live，但新建提交还会 await `window.thoughtline.info()`，返回后直接 submit，未再次检查 live/session。若此 await 期间组件因 session key 变化卸载，旧闭包仍可发送旧 draft。`src/main/index.ts:138` submit IPC 不带 session，不能引用旧 saveDraft 拒绝测试证明此续作被挡。

复验建议：在新建会话用可控 promise 延迟该 submit 调用的 info；确认 flush 已结束、info 已挂起；通过隔离 harness 换 session/key 卸载旧组件；释放旧 info（给当前 revision），观察旧 submit 是否仍被调用、是否影响新会话。预期旧 submit 调用数为0。如证实，补 await info 后的 live/session 守卫并加针对性回归；当前冻结原件保留，另提交新源/新证据。也应审已发出写 IPC 的会话生命周期，但不要混作已证实缺陷。

此边界是静态可见的守卫缺口，尚无本轮运行复现；正常 busy UI/主进程可见窗口规则限制会话切换，不能宣称普通用户操作必然触发或已造成真数据丢失。现有20项中的 renderer reload、旧 detached 节点和显式旧 saveDraft 均未延迟这一 info await。建议父线程在下一包前补收口，或明确文档仅承诺已测旧节点/saveDraft路径。

## 清理、设置与父线程后续

[当前独立 ps 记录](current-process-check.json)对精确26个自有测试 PID 查询 exit1、输出空，全部查无，没有终止任何进程。三个有明确路径的假数据目录当前均不存在。草稿回归另记录11 PID/allExited/fakeDataRemoved，但未记录目录路径，因此该组目录清理只由 fixture断言及执行记录支持；不声称已独立检查一个未记录路径。

当前 defaults 只读值：增强对比 `1`、降低透明 `1`，与此阶段始终保持1/1记录一致；本轮未切换。只能证明当前值及阶段证据吻合，不把单次读值称作连续系统审计。

父线程待处理：上述延迟info边界的针对性收口；新Windows包需另线程批准v11图标可访问原件/哈希与403问题解决、唯一打包源/版本/CI headSha及安装器哈希绑定；Mac/Windows物理中文IME候选确认、失焦/点击取消/切字段和快捷键矩阵、Windows真实设备及窗口视觉用户确认。真实Agent/G7仍未完成。本任务未打包、触发CI、安装、发布或合并；原生测试时段未被本QA占用。
