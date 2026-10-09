# P2 独立只读审查

审查时间：2026-10-09。实际 HEAD/main 与指定基线均为 `1d8705d8e6b2a4283bd253aa86e1b1cbf7a37e00`；对象为其后的未提交 P2 工作树，以及新增 hook/单测/受控工作流。已读取 p2-brief.md、p2-report.md、p2-diff.patch、父 AGENTS.md，按 code-review 的 Spec / Standards 双轴核对；本次不再次委派，不改源码，不运行全量测试，不提交，不启动安装版或 Electron，不接触真实数据和其他运行进程。唯一落盘为本报告。

以用户本轮明确需求及原产品文件为准，主要依据：`Thoughtline第一轮修复优化.md` 第 43–70 行、旧主方案/交互/分组文件的同 Agent 合夹、当前页、失败保全规则；P2 精确要求为 `p2-brief.md:3–4`。旧文档重量等已被后续明确决定替代的条目未作为新增问题。

## Spec compliance：未通过，需要修复

Critical：0。Important：3。Minor：0。

### S1 / Important：离开详情的部分路径绕过 flush，卸载后吞失败并丢失重试能力

位置：`src/renderer/hooks/useClipPage.ts:17`；可达入口 `src/renderer/components/Detail.tsx:32`，`src/main/index.ts:161–165,201–203`；视图切换 `src/renderer/main.tsx:18`。

要求：P2 brief 第 3 行“失败可重试、离开前flush”。

机制：详情翻页产生 dirty worker 后，点击“全部念头”，open-manage 直接切 manageMode 为 browse；从托盘打开设置也直接替换 Detail。两条路径均未调用 prepareWindow，Detail 随即卸载。cleanup 先设 live=false，使 onError 不再上报，然后 `worker.flush().catch(()=>{}).finally(...)` 无论保存成功与否均 dispose 并从 savers 删除。若写盘失败，旧当前页仍在磁盘，新选择已无 worker 可重试；之后退出的 flushPageSelections 空集合成功，造成已离开且无法恢复末次选择。

只读内存复现：加载实际 hook 与实际 DraftAutosaver，模拟 React mount/choose(b)/unmount，selectClip 返回受控 IO 失败。输出 writes=`[["group","b",1]]`，errors=`[]`；随后 flushPageSelections resolved 且无第二次写入。该证据验证资源生命周期机制，未启动 GUI。

建议：所有替换/离开 Detail 的入口先执行可拒绝的守卫；失败时保留页面与 dirty worker。卸载时不能无条件销毁未保存 checkpoint。还应覆盖 Agent 过滤引发 ClipCard 卸载的同类情况。

### S2 / Important：跨 Shelf / Detail 的旧请求仍可覆盖新选择

位置：`src/main/index.ts:255–259`，特别是 258 行 sender:clip 键；客户端独立计数 `src/renderer/hooks/useClipPage.ts:4,20`。

要求：P2 brief 第 3 行“旧请求不覆盖”；原修复方案第 64 行“旧请求不覆盖新选择”。

机制：排序只在同一个 webContents 与 clip 内生效。Shelf 与 Manage 各有独立 JS sequence，选择的是同一 clip.currentId，却使用两套服务端桶。Shelf 的旧 dirty 选择 b 保存失败后，用户在 Detail 选择 c 并保存成功；之后退出/整理触发 Shelf 旧 checkpoint 重试。该请求通过 Shelf 桶校验，串行队列仍会把当前 c 写回旧 b。单写队列解决并行写冲突，不能判断跨窗口的语义新旧。

只读内存复现：执行实际 select-clip handler 片段，模拟存储。Shelf b(seq2)失败 → Manage c(seq1)成功 → Shelf b(seq2)重试成功；输出 finalPage=`b`。没有启动应用、没有写磁盘。现有 page-latency-workflow.cjs:12–14 只从 shelf 发请求，无法覆盖此情形。

建议：为同一 clip 建立跨 sender 的选择世代/基线，旧失败 checkpoint 在已存在更新选择时不得重放覆盖；保留“同一有效选择失败后可重试”的能力。仅将 Map key 改成 clip.id 仍不够，因为两个 renderer 的 sequence 不共享。

### S3 / Important：即时翻页后打开详情仍先显示旧页，可能复制/编辑错误正文

位置：`src/renderer/components/ClipCard.tsx:18–19`，`src/renderer/components/Detail.tsx:8–10,26`；初始选择 `src/renderer/hooks/useClipPage.ts:11,14`。

要求：P2 brief 第 3 行“分页即时”“当前页正文保存”；原交互约定展开当前全文、复制当前完整正文。

机制：翻到 b 时 Shelf 已乐观显示 b，但 100ms debounce 或写盘在途时快照 currentId 仍为 a。展开调用仅传 idea.id=b，没有 flush。Detail 的 base 找到 b 后仍以所在 clip 的旧 currentId=a 初始化 page；10 行优先 page.id，丢弃 base.id。于是展开先显示/复制/编辑 a，直到后台保存广播才切到 b；若保存失败则持续显示 a。已有 250ms 写盘条件会扩大这段可见窗口。木夹轻点打开详情也存在同类未 flush 路径。

本项为可达源码机制验证，未新跑 Electron 交互；不将其表述成已做物理系统验收。

建议：进入详情前完成最后页选择的受控 flush，或明确以传入当前 idea 初始化详情并协调共享选择。失败时保留用户正在看的页及错误提示。打开编辑也应先完成页选择，避免其在打开后更新 revision 导致编辑保存冲突。

### 已满足或已有相应受控证据的要求

- 木夹整夹、14DIP 上缘单纸、正文 text/plain + copy 的入口分开；正文载荷不拼标题/Agent、不写文件、不自动发送。兼容 Agent 校验在命令层；源成员与正文保持独立。
- 空位分配器搜索左/中/右所有合法间隙；新建/拆出/恢复先捕获旧位置。单纸 30 次拆合、旧位置与空隙单测已在现有记录中通过；本次未重跑。
- 纸张受控 pointer/DOM/IPC 与模拟 Escape 成功记录在 paper-native.json；该记录的 scope 正确区分物理验收。
- 快速三次点击采用 ref 累积并立即显示第 4 页；100ms/300ms autosaver 参数已接入。同 sender 旧序号拒绝、同序号失败重试已有受控记录，不能据此宣称所有窗口路径可靠。
- 新增 overflow-notice-workflow.cjs:4–6 与 overflow-native.log 验证真实受控绳宽 1440 下第 4 条保存成功、详情打开、完整正文与放不下提示。正常满位路径未发现新缺陷。
- Windows launcher 第 8、11 行及 preflight 第 28 行严格绑定 0.0.17-preview.1；旧 preview6 launcher 已归档，旧发布信息仍保留。当前源码尚需新 Windows CI，不把旧 CI 当本次通过。
- ROUND1-DRAG-MATRIX.md 保留微信 4.1.13.65、豆包/QQ 版本未知、WorkBuddy 5.7.6 用户反馈，并明确独立真实目标未测；当前没有兼容修好声明。

## Task quality / Standards：未通过，需要修复

Critical：0。Important：1。Minor：1。下列质量结论不掩盖或重排 Spec 结论。

### Q1 / Important：checkpoint 的所有权在 React 卸载时提前终结

位置：`src/renderer/hooks/useClipPage.ts:6–7,14–17`，`src/shared/draftAutosaver.ts:8,14,17`。

这是 S1 的质量维度：持久化任务可能比组件活得更久，但 dirty state 与错误接收者只由组件所有，cleanup 同时切断提示与重试。全局 savers 名义上聚合离开前保存，却在失败后直接删除失败对象。应明确 checkpoint 生命周期与组件生命周期边界，将未完成任务留到确认保存/取消后才释放。属于有实际失败后果的设计缺陷，不是仅凭 Fowler smell 提出的形式要求。

### Q2 / Minor：已有失败/顺序检查没有覆盖 renderer 的实际恢复路径

位置：`tests/electron/page-latency-workflow.cjs:12–14`；`tests/unit/paperDrop.test.ts`、`tests/unit/spaceAllocation.test.ts` 只核对纯命令/几何。

直接调用同一个 shelf 的 selectClip，可以验证 IPC 的同 sender 失败重试和旧序号，但绕过 useClipPage 的卸载 cleanup，也不覆盖双窗口选择、展开旧页、离开失败保留。现有 115 passed / 4 Windows-only skipped 与受控性能数据可信于其标注范围，却无法支持“所有离开前 flush / 旧请求永不覆盖”的完整验收结论。

修复后最小补测应覆盖：详情翻页后立即“全部念头”且注入写盘失败；Shelf 旧失败→Detail 新选择→旧窗口 flush；翻页后在 debounce/慢盘窗口立即展开/复制；这些无需扩大到物理 Windows 验收。

## 修复时必须避开的队列互等

当前实现 `submit` 在 `src/main/index.ts:147–154` 进入 composerWrite；满位分支在 153 行 await openBrowseDetail。当前 openBrowseDetail:194–198 没有 prepareWindow，所以此路径没有现成的 flush 死锁。

若为修 S3，在 openBrowseDetail 内直接加入 `await prepareWindow(shelf)`，且仍从 submit 队列任务内部 await 调用，则可能互等：submit 等 renderer 的 flush；renderer 的 select-clip 又排进 composerWrite，等待当前 submit 完成。prepareWindow 的 5000ms 超时会把互等变为错误/延迟，不构成正确解决。守卫应在进入串行队列前完成，或提交结束释放队列后打开详情；不要在持有该队列的任务内等待依赖同队列的 renderer checkpoint。

## 证据范围与结论

回读现有 p2-verify.log：类型检查、115 单测通过 / 4 Windows-only skipped、构建通过；group/text-drag/paper/page/overflow 记录均为隔离合成数据及受控 Electron/协议检查。page-timing 9.2ms、28.6ms 的显示与约 250ms 写盘区分了即时显示和后台持久化，并未独立诊断用户设备偶发卡顿。

本次新增验证仅为只读内存执行实际源码的生命周期/IPC 机制，未运行全量测试，未启动 Electron 或真实外部接收端。微信/豆包/WorkBuddy 的 Windows 真实插入、物理 IME/DPI/多屏仍未独立验收。

最终结论：**Spec compliance 未通过（3 Important）；task quality 未通过（1 Important、1 Minor，质量 Important 与 S1 同一机制）。没有 Critical。先修复页选择的跨窗口排序、离开失败保留与当前页详情交接，再进行限定补测及独立复审；当前不适合标记 P2 完成或提交为已验收节点。**
