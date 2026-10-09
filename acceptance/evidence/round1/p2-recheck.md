# P2 限定复审

审查范围：`p2-brief.md`、`p2-review.md` 所列 S1–S3/Q1，以及 `p2-fix-report.md`、`p2-fix-diff.patch` 引入的归档和满位提交队列路径。2026-10-09 对照当前源码与现有隔离证据只读复核；未修改源码、提交或运行测试，未接触现有安装、进程和真实数据。P3 未接入组件不在本包范围。

| 项目 | 结论 | 依据与边界 |
| --- | --- | --- |
| S1 离开失败与卸载 checkpoint | **ADDRESSED** | `src/main/index.ts:53–61,165–170,178–183,200–211,122–125` 在详情被替换、关闭及退出前等待 renderer flush，失败保留当前视图；`src/renderer/hooks/useClipPage.ts:6–9,14–20` 在卸载失败时保留 detached worker，后续 flush 成功才释放。隔离记录 `p2-handoff-all-green2.json` 覆盖详情到“全部念头”/设置的失败阻止与重试，以及组件卸载后的 checkpoint 重试。 |
| Q1 checkpoint 所有权 | **ADDRESSED** | dirty worker 不再随组件卸载无条件 dispose；全局集合持有未完成任务，`flushPageSelections()` 成功后释放。卸载后错误不会发给已卸载组件，但 checkpoint 仍可在下一次离开守卫或退出时重试；这是当前保全边界。 |
| S2 跨窗口旧 retry | **ADDRESSED** | `src/main/index.ts:263–270` 为同一 clip 的新请求分配跨 sender 世代，失败重试复用原世代；队列执行时旧世代只回传当前快照，不写回旧页。`useClipPage.ts:16–21` 用 ACK 的实际 currentId 校正乐观页。隔离记录覆盖 Shelf 的 b 失败、Detail 保存 c、Shelf 重试后磁盘仍为 c。 |
| S3 快速 flip 后展开当前正文 | **ADDRESSED** | `src/renderer/components/ClipCard.tsx:18–19` 将当前 idea.id 传给打开详情；`src/main/index.ts:165–170` 先 flush 再发布新详情；`Detail.tsx:8–10` 从已更新快照取当前页。隔离记录覆盖三次快速翻到 d 后立即展开、复制 d 的原文；该记录是受控 Electron/假剪贴板证据。 |
| 详情归档/整理 | **ADDRESSED** | `src/renderer/components/Detail.tsx:12–13,28–29` 在修改前 flush 并重新读取 revision，失败不执行状态变更。`p2-handoff-status-green.json` 覆盖 b 页写盘失败时归档被阻止、重试后保留原文并归档。此路径不在 `composerWrite` 内等待自身的页码请求。 |
| 满位 submit 队列互等 | **ADDRESSED（源码）；验证未闭环** | `src/main/index.ts:150–158` 完成 `composerWrite` 后才 `await openBrowseDetail`，页码 flush 所需的同一队列已释放；静态调用链不再互等。隔离 queue 日志走过提交、详情打开和正文检查，但见下方质量发现，未形成完整通过记录。 |

**Spec compliance：通过本次限定复审。** 上述旧 3 项 Important 已解决；修复差异内未发现新的 Critical/Important 行为缺陷。结论不等于 Windows 真机、物理拖放、微信/豆包/WorkBuddy 接收验收。

**Task quality：尚未完全通过，1 项 Minor 验证缺口。** 新增 `tests/electron/page-handoff-workflow.cjs:33` 的 queue 场景将 `manage.locator('[role=status]').textContent` 方法本身与字符串比较，缺少调用及 `await`。因此 `acceptance/evidence/round1/p2-handoff-queue-green.log` 与 `p2-final-queue.log` 实际均为 `AssertionError`；随后检查磁盘 group 当前页仍为 b 的断言没有执行，也没有成功的 queue JSON。`p2-fix-report.md:7` 对“queue-green.log … 通过”的表述与日志不符。修正该测试断言并重跑这一受控场景即可关闭该验证缺口；本次未代为修改或运行。其余红绿记录及 `p2-final-verify.log` 分别支持四个交接场景、归档场景，以及 typecheck、115 passed / 4 Windows-only skipped、build，均只在所标注的隔离范围内成立。

## queue 断言修正后的最终复核（2026-10-09）

`tests/electron/page-handoff-workflow.cjs:33` 现为 `await manage.locator('[role=status]').textContent()`；期望字符串“已保存，绳上暂时放不下”和紧随其后的磁盘 `group.currentId === 'b'` 断言均保留。`p2-queue-fix-report.md` 记录本次单场景命令退出码为 **0**；`acceptance/evidence/round1/p2-queue-fixed.log` 仅有最终成功 JSON，`p2-handoff-queue-queue-fixed.json` 含 queue 完成检查及最后写入页码 b，`p2-handoff-cleanup-queue-queue-fixed.json` 存在且 `dataRemoved: true`。按测试代码的执行顺序，最终 JSON 产生于上述断言全部通过之后；原失败日志作为历史记录保留。

**最终 Spec compliance：通过本次限定复审。最终 Task quality：通过本次限定复审。** 前述 1 项 Minor 验证缺口已由修正后的单场景运行关闭；未发现新增 Critical/Important。退出码依据修复报告记录，成功路径另由最终 JSON、日志和清理记录交叉印证。本次仍未运行测试、修改源码或提交；受控 macOS Electron/假剪贴板证据不替代 Windows 真机及真实外部接收验收。
