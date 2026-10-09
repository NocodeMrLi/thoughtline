# 暂停期间解除操作锁：只读分析

固定生产源码 `d9a9cd013fb879a9f11065db8dabec73882c41df`，视觉证据 `427a26e99ab79a53bc9db561d8bacf9ff53419be` 保持不变。当前仅确认一个 P2 状态机待修项，没有修改生产代码，也没有启动 Electron、真实热键、系统电源事件或用户安装版。

`shelfTransition` 先处理 suspend/resume，随后在 suspended 时直接返回，因此暂停期间 `lock(active:false)` 被忽略。resume 又保留旧 locks；正常 edge pointer + 超过250ms tick 仍因非空 locks 无法揭示 shelf。

当前共享 TS 在 Node 24 类型剥离下，composer/manage/menu/text-drag 四条受控轨迹均保留旧锁且无法悬停展开；未暂停的 composer 开/关对照可展开。详见 [可复跑脚本](evidence/g7-paused-lock-readonly/reducer-check.mjs)、[原始结果](evidence/g7-paused-lock-readonly/original-result.json)、[归档路径复跑结果](evidence/g7-paused-lock-readonly/replay-result.json) 及 [源码绑定](evidence/g7-paused-lock-readonly/source-binding.json)。脚本校验固定源码 SHA，变化后会拒绝复用本结论；预期 exit0 表示缺陷轨迹被复现，并非产品通过。

源码存在实际调用顺序：输入浮层打开时 composer 锁为 true；托盘“暂停悬停”不因浮层可见而禁用，callback 执行 cancelDrag 后 edge.pause(true)；提交或关闭浮层调用 closeConfirmedComposer 与 lock(composer,false)，hide listener 也解除同一锁；解除发生在暂停状态时被忽略；恢复手动悬停后旧锁仍在。这个路径有源码和纯状态机证据，**尚无该顺序的原生窗口复现**。未推断用户已实际遇到此问题。

电源 suspend/lock-screen handler 在暂停前先 cancelDrag，主动释放 drag/text-drag。因而 text-drag 的纯 reducer 轨迹不能直接证明正常电源入口遗留拖动锁。composer/manage 等异步生命周期与 reducer 的风险需分别复验。此发现也不代表自动全屏抑制 G7 已实现或通过。

后续最小修复方向：暂停时仍维护 lock 账本，并保持 hidden / 不响应 peek 和 pointer；释放最后一个锁不能使暂停 shelf 可见。修复后需覆盖手动暂停与 composer/manage 关闭、重复暂停原因、暂停期间新增锁、恢复后正常悬停，以及安全的原生窗口 IPC 顺序。当前按照视觉检查点冻结要求，仅记录，不实施或扩原生矩阵。

本目录原始 Node 日志的 module-type 提示未导致失败。复跑命令：`node --experimental-strip-types acceptance/evidence/g7-paused-lock-readonly/reducer-check.mjs`（Node24.19，从仓库执行）。归档仅新增文档/分析证据，不改变 src/tests/scripts/package/.github。
