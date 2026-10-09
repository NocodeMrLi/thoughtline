# 暂停旧锁：独立只读与纯状态机复验

固定源码/测试 `3e5645481da49b169cadbfc2a2cac843d3235a6c`，生产修复提交 `93b82c652835600d8db6e73f8eb66cdf32b5b1fa`，报告证据 `36824b7508c2475ad6f57903c7648fb3c1da8e83`。远端私有分支当时准确指向证据提交。93b82c6与3e的src/scripts/package/.github相同；3e与368的src/tests/scripts/package/.github相同。

**暂停旧锁 P2 在新固定源码层确认修复，审阅的受控Mac原生红绿证据与修复一致。本轮未发现新增缺陷。** 独立运行仅为自己的纯Node状态机回放；没有启动Electron/浏览器、操作用户安装版或数据、热键、剪贴板、原生电源事件、包或G7。75全单测和原生回归是构建者运行记录，本QA没有独立重跑它们。

原问题为 `s.suspended` 的early-return先于lock处理。复现：已有composer锁→suspend→收到composer关闭的lock(false)→旧源码仍保留composer锁→resume之后250ms停留不能显示。新源码先处理lock，暂停时只更新locks；`!s.suspended`保护leaveAt/peekUntil，pointer/peek/tick仍在暂停early-return后，不更新显示状态或计时。resume保留尚活跃的锁，没有用清空全部locks掩盖真正交互。EdgeController的manual/sleep/lock聚合逻辑没有改变，仅最后一个暂停原因释放时发送resume。

独立从Git固定对象读取旧54494df和新3e的真实shelfState.ts，用Node25.8.1原生TS擦除直接执行：

- composer/manage/menu/drag/text-drag五类暂停中释放；暂停中新锁记录并阻止恢复后显示；部分锁释放而其他锁保持，共七场景，均**旧源码断言红、新源码绿**。
- 249/250ms边界使用edge入口now=10、tick259/260，旧锁释放后新状态恢复正常。
- 暂停期间presentation/zone/dwell/leave/corridor/peek字段不动；重复active、释放未知锁幂等；原输入对象和locks没有被修改。
- manual/sleep/lock分别作为最后释放原因，其他原因未清时保持paused，全部释放才恢复，已结束操作锁不复活。
- 未暂停的peek、lock、corridor、超时、edge显示九事件trace与旧源码逐步完全一致。

脚本 [reducer-replay.mjs](reducer-replay.mjs)、结果 [reducer-replay.json](reducer-replay.json)，最终退出0。该回放证明纯reducer语义，不扩大为Electron窗口、真实物理停留时序或系统睡眠验证。

源/证据核验：三份源/测试哈希、21项evidence索引全部一致，见 [binding-check.json](binding-check.json)。renderer源码与54494df轻润色完全无差异，三份reported compiled renderer哈希与轻润色manifest一致；本轮没有读取或独立重建编译字节，不能把哈希记录比较改称QA独立包验证。轻润色独立QA归档五个原件也与QA自己文件逐字节一致。

原生红记录在正确托盘MenuItem callback暂停后，composer保存关闭：draft包含原完整中文/换行/emoji/首尾空格，而interactionLocked仍true；native-red日志明确失败在真实旧锁断言。screen-ready启动超时、checkbox自动toggle错误各自保留，未将它们当产品红证据。

最终绿记录有10检查点：真实BrowserWindow.isVisible在暂停场景为false；保存关闭后composer与shelf隐藏且锁释放，草稿内容保留；恢复受控悬停显示；重开恢复草稿，暂停中提交保留全文并清draft；manage关闭；sleep释放而lock仍在时保持隐藏；最后原因释放后恢复；peg/text-drag取消时快照不变、操作锁释放。脚本调用实际Tray MenuItem对象的callback，但没有物理打开菜单或用户鼠标选择；光标与powerMonitor.emit为受控fixture。menu锁生命周期仅在纯状态机中验证，不把Tray暂停callback扩大为所有原生context menu关闭路径通过。

workflow/group/text-drag三个最新源回归exit0及PID/假数据清理均为构建者证据；group脚本仍等待自然解锁与renderer data-locked=false再比较坐标，没有退回held旧布局假阳性。text-drag是browser-owned/DOM协议向假textarea接收全文，不是跨App Agent验收。清理记录的全部自有PID为空是构建者当时核验，本轮未重新扫描系统进程或终止其他实例。

| 项目 | 结论 |
| --- | --- |
| 暂停锁账本修复、七项独立红绿与暂停显示不动 | 通过，新固定纯源码范围 |
| 活跃锁保留、多暂停原因、未暂停行为一致 | 独立纯状态机通过 |
| 三源/21证据哈希与生产/证据源码一致性 | 只读核验通过 |
| 原生红绿真实性/等待/隐藏/数据断言 | 审阅一致；QA未独立运行原生 |
| 75unit/type/build及三组受影响源回归 | 构建者exit0记录；不冒称QA重跑 |
| 新包、物理Windows/IME/菜单/睡眠/跨App/G7 | 本轮未测或未放行 |

本修复只绑定新源码，不更新既有0.0.13安装包或改变其历史专项范围。最新Agent字色被用户00:56反馈否定，另记颜色视觉失败；锁修复结论与颜色问题独立。整体正式验收仍false，待颜色固定候选及最终必要增量核验。
