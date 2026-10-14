# 第六轮实施计划
Spec: /Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline/Thoughtline第六轮修复优化.md
Base: 6cc830df771df176dce8a79a5f9bdc38f39a8c65. Execution: inline on authorized main, no implementer delegation. Candidate0.0.33.
Global: no cross/keepEsc, creation dates immutable, single valid undo, save/IME/IO/owner/CAS retained; new release; only new/affected tests; no billing writes.
Review Focus: picker stale source and blurred session; cross-day/filtered/paginated stack projection identity; split and restore selection ownership; anchor disappears during success; locating an offscreen/group-filtered note without changing shelf.

## Task 1: search and day/stack projections
Files: shared/ideaVisibility.ts, ideaHistory.ts, unit/round6*.test.ts.
Interfaces: filterTagSearch(snapshot,project,query,names) returns ordered unique tag rows; calendarStackCards(snapshot, day members) retains matching/member representative plus total owner count.
- [x] Independent behavioral RED→GREEN for name/body tier recency, deleted/archived exclusion, cross-day dedupe and stable pagination.
Expected: targeted unit tests exit0, old round5ShelfFilter/Grouping/ideaHistory retain contracts.
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
- [ ] Fresh whole-change review; fixes targeted RED→GREEN; Mac actual candidate and Windows focused source/install/package gates.
- [ ] Version0.0.33 frozen inputs/SHA/retention; push without redundant full task, private release readback, scoped cleanup.
Expected: actual remote/source/package matches, six-item direct operation report; physical/formal remainfalse unless explicit owner feedback.
