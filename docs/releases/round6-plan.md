# 第六轮实施计划
Spec: /Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline/Thoughtline第六轮修复优化.md
Base: 6cc830df771df176dce8a79a5f9bdc38f39a8c65. Execution: inline on authorized main, no implementer delegation. Candidate0.0.33.
Global: no cross/keepEsc, creation dates immutable, single valid undo, save/IME/IO/owner/CAS retained; new release; only new/affected tests; no billing writes.
Review Focus: picker stale source and blurred session; cross-day/filtered/paginated stack projection identity; split and restore selection ownership; anchor disappears during success; locating an offscreen/group-filtered note without changing shelf.

## Task 1: search and day/stack projections
Files: shared/ideaVisibility.ts, ideaHistory.ts, unit/round6*.test.ts.
Interfaces: filterTagSearch(snapshot,project,query,names) returns ordered unique tag rows; calendarStackCards(snapshot, day members) retains matching/member representative plus total owner count.
- [x] Independent behavioral RED→GREEN for name/body tier recency, deleted/archived exclusion, cross-day dedupe and stable pagination.
Outcome: 81Mac/85Windows related unit tests passed (Windows prior source gates strictly reused), round5ShelfFilter/ideaHistory/clipCommands covered.
## Task 2: reader feedback and calendar navigation
Files: ActionIcon.tsx, IdeaReader.tsx, Calendar.tsx, CalendarStackReader.tsx, new feedback helper/style, focused Electron fixture.
- [x] Source RED→GREEN copy/restore tooltip and unchanged bounds, split preserves origin list, IO/IME and stale owner refusal.
Expected: focused native assertions and normal quit, targeted types/build exit0.
## Task 3: picker window and shelf date/location
Files: main windows/index, shared bridge/messages, preload, renderer picker/Shelf/ClipCard, scoped geometry unit/native fixtures.
- [x] Source RED→GREEN standalone picker bounds/drag/Esc/outside/session/selection/cancel, date/day locate and success link.
Expected: focused source fixtures normal quit; picker must not expand Shelf or disturb saved writer.
## Task 4: delivery
Files: round6 scoped workflow/release audit/report, acceptance/gates.
- [x] Fresh whole-change review; fixes targeted RED→GREEN; Mac actual candidate and Windows focused source/install/package gates.
- [x] Version0.0.33 frozen inputs/SHA/retention; push without redundant full task, private release readback, scoped cleanup.
Expected: actual remote/source/package matches, six-item direct operation report; physical/formal remainfalse unless explicit owner feedback.

Final: source/tag731a0bb7c719dabc786482a07606b47196a95af9,369inputs; Windows38511064035 success; original38510030275failure retained; privateRelease412343095 tenassets verified; ownedcleanup complete. User formal/physical acceptance remainsfalse. Final operation report round6-v0.0.33-delivery.md; exact document push readback in final delivery directory.


## R6-09／R6-10 当前交付：0.0.36

共享托盘仅暂停／恢复悬停、分隔线、退出，中英同步。25Mac相关单测及4Windows专用对应检查、类型/构建、双端源码与实际包三组菜单/暂停/拖动/草稿退出及Windows安装/重装/卸载保数据通过；不重跑产品全套。本次执行者审计，没有新增独立review。六主题中英各一版共12GIF、7语言README、两张原始实际截图按批准位置整合；最后媒体布局修正只作用录制层。源码/tagf6abd48、380输入、Windows38592240443成功、正式私有Release412946284十附件SHA/大小一致，旧035未变；完整报告 [0.0.36](round6-v0.0.36-delivery.md)。负责人实际/正式验收仍false。后续文档提交与包来源分列。
