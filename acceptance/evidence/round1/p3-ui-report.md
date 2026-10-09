# P3/P4 UI 与窗口集成报告（待父任务独立审查）

## 结果与边界

在当前 main working tree 完成原地编辑、最近删除、日历、Manage 窗口材质和几何集成；未提交、未推送、未修改真实用户数据/系统设置/安装版。P2 基线为 `97875dda`，进入任务时 HEAD 为 docs-only `e4bb97c`。数据层 schema3、命令和 repository 由先行 P3 data 范围提供；本范围未改其生产代码。旧 Electron PID 30628 仍在，测试全部使用合成临时 profile，文本拖拽和复制测试使用 fake clipboard 或测试 DOM，不触碰真实剪贴板/接收应用。

## 实现

- `bridge/preload/main` 接入 typed updateIdea、setEditing、ideaHistory；主进程验证管理窗口可信 frame、session、编辑 owner，并在串行写队列执行时核对预期四字段。迟到 session/旧内容返回冲突，状态、Agent、项目、夹变更、设置和历史写入均在同队列读取当时 snapshot。`prepareViews` 在入队前完成，满位新建释放队列后才打开 Detail。
- 新建 Composer 保留新建；旧 `openEdit` 到 Detail 中的 IdeaReader/InlineIdeaEditor。title、body、项目、Agent 原地编辑使用现有 350/1500ms 自动保存与 IME 组合保护；离开、翻页、标题列表、窗口隐藏先 guard。写盘失败保留本地 draft 与窗口，可显式重试；合夹换 Agent 要用户确认且仍保持同一 Idea ID 可继续输入。软删进入最近删除，恢复/永久删除走 history；归档与结构 undo 范围保持分开。
- Calendar 替换旧全部念头列表：当月今天、高亮计数、归档计数、日期卡片 9+18、窄窗两列、年 12 月、搜索与状态筛选、最近删除、返回滚动位置、从被点日期格短缩放、reduced-motion 降级。历史日期使用冻结 `createdDay`；低频更新今天。
- Manage 改为可调整大小、统一材质和焦点主题属性，日历几何节流持久化；Detail/Settings 路由不污染日历 bounds。新增纯几何 clamp helper 对负坐标、屏幕移除、超大尺寸、缩放 workArea 作逻辑测试。Settings 保存保持 `calendarBounds`。
- `ProjectOptions` 旧 picker 在 IME Escape 事件缺失 `isComposing` 标志时会关闭：现在也核对 `CompositionSession` owner，Composer 与 InlineIdeaEditor 均传入该状态。

## 验证

最后生产修改后：`npm run verify` exit 0，32 test files/163 tests passed，1 Windows-only file/4 tests skipped；typecheck 与 Electron/Vite build 通过。日志：`acceptance/evidence/round1/p3-ui-verify-final.log`。`git diff --check` exit 0。受控 Electron fixture 结果均为 exit 0：

| 范围 | 最终证据 |
| --- | --- |
| 原地编辑、自动保存/即时关闭、IME、失败保留重试、合夹 Agent 拆出仍继续输入 | `p3-ui-inline-edit-workflow-final.log` |
| 日历今日、数量、9卡/更多、3列/2列、年、搜索、trash 恢复、返回滚动 | `p3-ui-calendar-workflow-final.log`；`p3-ui-month.png`、`p3-ui-day-3col.png`、`p3-ui-day-2col.png`、`p3-ui-year.png`、旧 `calendar-workflow.png` 空态 |
| 日历可调整窗口、几何持久化、跨路由不污染、clicked date origin | `p3-ui-calendar-geometry-attempt2.log`；`p3-ui/calendar-geometry-cleanup.json` |
| 新建/项目键盘/合夹变更 Agent 提示 | `p3-ui-properties-attempt1.log` |
| P2 page handoff all/status/queue | `p3-ui-handoff-all-attempt1.log`、`p3-ui-handoff-status-attempt2.log`、`p3-ui-handoff-queue-attempt2.log` |
| P2 group/overflow/paper/project/text drag | `p3-ui-group-attempt3.log`、`p3-ui-overflow-attempt4.log`、`p3-ui-paper-drop-workflow-attempt1.log`、`p3-ui-project-editor-workflow-final.log`、`p3-ui-text-drag-workflow-attempt1.log` |
| 旧新建、草稿、IME、空绳、固定绳、干净绳 | `p3-ui-workflow-attempt3.log`、`p3-ui-draft-safety-attempt2.log`、`p3-ui-composition-attempt4.log`、`p3-ui-empty-shelf-workflow-attempt2.log`、`p3-ui-fixed-rope-workflow-attempt2.log`、`p3-ui-clean-shelf-workflow-attempt2.log` |

电子测试为独立 Mac source runtime、合成数据、DOM/IPC/模拟 CompositionEvent；不能代表物理 IME、Windows、真实 DPI/多屏、外部 app 接收或安装包。包运行与旧 package/workflow 的新 App 语义验收移交 P6；Windows installed-preflight 的 schema3 精确快照预期移交后续任务。`tests/unit/clipProjection.test.ts` 迁移预期明确保留完整 Idea 全字段、ID、正文、顺序深比较，冻结 schema2 原创建日并增加 createdDay/legacy-offset 字段；没有缩减断言。

旧 Electron 测试变更是 UI 入口迁移：旧「全部念头」改日历，旧 Composer 编辑取消改原地自动保存/关闭 flush，Detail 尺寸和 schema3 迁移预期更新。原有正文、ID、页码/队列和满位保护断言继续保留。失败尝试日志全部以 `attempt`/`red` 名保留，未将临时移除保护的 mutation RED 当作原始代码缺陷：标题列表 guard 的 RED 是原始代码真实复现；Agent split 的 RED 是断言敏感性 mutation check。项目编辑尝试 1/2 在焦点等待 30s 超时，尝试 3 和最后隔离重跑通过，未观察到持久失败；前两次日志保留。

## 清理与待审

P3 输出使用 `acceptance/evidence/round1/p3-ui/` 和 `p3-ui-*` 独立命名；被早期回归覆盖的已跟踪 P2 `group-native.json`、`group-cleanup.json`、`overflow-cleanup.json` 均从 HEAD 恢复，最新 `git status` 显示 round1 中无已跟踪 evidence 修改。清理助手会等本 fixture PID 全部退出后才删除其临时目录；最终额外复核 9 份清理收据中的 54 个去重 PID 均已退出，`calendar-geometry` 收据中实际 `dataRemoved=true`，未发现 fixture protocol-entry 进程；旧 PID 30628 仍在。部分旧脚本收据只写 `dataRemoved:true`，其依据是 `cleanupIdleFixture` 成功返回，并非独立目录 stat，应按此证据强度理解。

独立 Spec/Quality 审查仍由父任务进行；本报告不代替该审查。当前本范围无已知未修核心失败，生产代码冻结。用户可见细节与真实设备/安装包验收仍以 P6 和后续阶段为准。

## 独立审查 R1 P2 修复补记

审查在三张同夹纸 i/j/k 上确认：归档 i 后，reader 仍保留 i 的正文，但旧夹 c 已只剩 j/k，界面错误显示 `0/2` 并允许访问旧夹分页。先新增 `tests/electron/archive-current-workflow.cjs`，使用合成 schema2 fixture 与 fake clipboard 做真实 source Electron DOM/IPC 复现；修复前 `p3-ui-archive-current-red.log` exit 1，明确为归档后旧分页数量 1 而预期 0。失败保留。

仅改 `src/renderer/components/Detail.tsx` 的夹引用：移除 stale heldClip；分页、标题列表和键盘切纸只取真正包含当前展示 ID 的 clip。当前 i 归档时保留正文且无旧夹分页，重新挂上后以新实际归属计算页码。新测试最终 `p3-ui-archive-current-final.log` exit 0，同时断言 i 的 ID/正文/状态、键盘箭头不跳 j/k、重新挂上归属、删除 j 后稳定选 k、全文及 ID/顺序不丢；`p3-ui-archive-current-green-attempt1.log` 是加入删除邻项断言前的首个 GREEN，`green-attempt2.log` 是同样断言的先前 GREEN，均保留。最终清理收据为 `p3-ui/archive-current-cleanup-archive-fix-final.json`，记录自有进程和目录独立 stat。未改 data/shared 生产范围。

限定验证：`p3-ui-archive-typecheck.log`、`p3-ui-archive-build.log` exit 0；`p3-ui-archive-inline.log` exit 0（Agent 拆出后同 ID 继续编辑、IME、故障保文）；`p3-ui-archive-page-status.log` exit 0（失败页码 checkpoint 阻止归档）；`p3-ui-archive-page-expand.log` exit 0（快速翻至 d 后立即展开/复制仍用 d）。page all 的断言与完整结果已打印到 `p3-ui-archive-page-all.log`，但自己的 Electron fixture 在退出阶段挂起；确认其 PID 46013 和临时目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-round1-handoff-FthHl6/protocol-entry.cjs` 后只对该 PID 先 TERM 后 KILL，脚本清理后 shell exit 0。这个 all 结果只算断言通过、清理曾人工干预，不算自然完成；限定 expand/status 的正常 exit 0 作回归依据。`p2-handoff-cleanup-all-archive-fix.json` 中该 fixture PID 均已退出，目录另经 `test ! -e` 核实删除。旧真实 PID 30628 未触碰。

## page-handoff fixture 正常退出修复补记

前述 all 挂起发生在断言和结果输出之后、清理收据写出之前：当时测试脚本先 `setTimeout(()=>app.exit(0),0)`，再并发等待 Playwright `app.close()`；这个路径没有确认页面 flush 或 Manage/drag lock 的正常释放，也绕过生产 `before-quit` 保存检查。其他正常结束的 Electron 脚本直接等待 `app.close()`。该竞态是 fixture 退出路径缺陷的定位依据；未观察到可以单独归因于生产 `before-quit` 的故障。

只修改 `tests/electron/page-handoff-workflow.cjs` 的 finally：先关闭故障注入；对 Shelf 发送并等待真实 `prepare-leave` 回执；若 Manage 可见，调用正式 `closeManage` 并要求成功；释放 fixture 的 `dragLock`；再等待正常 `app.close()`，由 `cleanupIdleFixture` 在自有进程退出后删除临时目录。去掉 `app.exit`。收据现在写入实际 `dir`、`allExited`、独立目录 stat 的 `dataRemoved` 与 `normalClose`；若 flush、关闭或清理失败，测试抛错且不会写虚假的成功收据，fixture 目录留待精确调查。

限定 all 重跑命令：`THOUGHTLINE_FAKE_CLIPBOARD=1 THOUGHTLINE_EVIDENCE_DIR=acceptance/evidence/round1/p3-ui THOUGHTLINE_ATTEMPT=normal-exit-1 THOUGHTLINE_PAGE_CASE=all node tests/electron/page-handoff-workflow.cjs`，见 `p3-ui-page-all-normal-exit-attempt1.log`，shell exit 0，用时约 6.4 秒，无人工结束进程。四个原有 all 场景断言和完整结果均保留。收据 `p3-ui/p2-handoff-cleanup-all-normal-exit-1.json` 记录自有 PID 46969–46974 已退出及临时目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-round1-handoff-N8jJmg` 已删除；另用 `test ! -e` exit 0、`ps -p` exit 1 独立核实。`git diff --check` exit 0，旧真实 PID 30628 仍在。先前人工 KILL 的 run 仍按失败性质保留，不以新通过结果回写或覆盖。
