# 暂停期间解除操作锁：独立功能修复阶段

固定源码/测试 `3e5645481da49b169cadbfc2a2cac843d3235a6c`，生产修复提交 `93b82c652835600d8db6e73f8eb66cdf32b5b1fa`。三纸轻润色视觉检查点仍为源码 `54494df` / 图证据 `2f1d24f`；本功能阶段没有改renderer造型或图原件，当前编译renderer输出逐字节匹配已交预览。尚未打包或正式验收。

问题原因：暂停状态先return，composer/manage等窗口结束时发出的lock(false)被忽略；恢复又带旧锁，正常250ms边缘停留被阻止。最小修复把lock账本维护放在paused early-return前；暂停期间仍不处理peek/pointer，也不更新时间触发显示。仍活跃的锁继续保留，不能通过恢复清空所有锁掩盖真实交互。

先红：[7项单测失败](evidence/paused-unlock-fix/unit-red.log)，涵盖composer/manage/menu/drag/text-drag释放、暂停中新锁及部分锁释放；[原生红](evidence/paused-unlock-fix/red/result.json)中真实托盘MenuItem回调暂停→真实输入窗保存草稿并关闭后interactionLocked仍true，全文成功保存但旧锁残留，断言exit1。入口早期screen-before-ready与checkbox自动toggle两项fixture错误另留原始日志，不当产品失败。

修复后：[75 unit](evidence/paused-unlock-fix/unit-green.log)、类型检查与构建exit0。[专项原生绿](evidence/paused-unlock-fix/green/result.json)/[日志](evidence/paused-unlock-fix/native-green.log)exit0，10检查点覆盖暂停中草稿保存关闭/重开全文恢复、暂停中提交后保持隐藏、设置关闭、sleep和lock双原因各自释放、恢复正常悬停、夹子拖拽和text-drag取消不改数据。最后一轮补查真实BrowserWindow.isVisible，暂停检查点实际shelf窗口均隐藏。精确249/250ms边界由纯状态机单测验证；原生使用受控指针并等待恢复展开，没有把协议轮询当物理手势时序测量。

受影响功能再次串行验证exit0：[编辑/全文/归档/搜索/重启](evidence/paused-unlock-fix/workflow-native.json)、[合并/分页/拆分/撤销/重启/自然解锁后无关夹位置](evidence/paused-unlock-fix/group-native.json)、[完整text/plain拖出与取消](evidence/paused-unlock-fix/text-drag-native.json)。后者包括browser-owned drag至假textarea，仍不是跨App Agent接收验收。

全部原生在自己的假数据源实例运行，globalShortcut默认注册表模拟、系统剪贴板隔离，未读用户便签/操纵安装版/触发真实按键或物理电源事件。powerMonitor.emit和fixture cursor均为受控测试，不宣称真实系统睡眠/锁屏矩阵或物理菜单验收。专项fixture退出后等待自己PID全部结束再有界删除数据；另外三个既有回归正常退出并清理，最终所记录全部PID仍不存在，见 [状态](evidence/paused-unlock-fix/checkpoint-status.json)。沒有终止其他进程。

该旧锁P2已在源码及以上受控Mac窗口范围修复。自动全屏G7、Windows真机、系统IME/物理焦点穿透、最新完整宽度/数量/包性能矩阵仍未通过或未完成；不把专项结案扩大为整体G7或产品验收。[固定源码绑定](evidence/paused-unlock-fix/source-binding.json)和同目录hash索引用于独立复验。
