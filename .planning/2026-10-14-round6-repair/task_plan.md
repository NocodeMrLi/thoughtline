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
- [x] Fresh whole-change review; fixes targeted RED→GREEN; Mac actual candidate and Windows focused source/install/package gates.
- [x] Version0.0.33 frozen inputs/SHA/retention; push without redundant full task, private release readback, scoped cleanup.
Expected: actual remote/source/package matches, six-item direct operation report; physical/formal remainfalse unless explicit owner feedback.

## R6-07 focused follow-up (base a719841, candidate0.0.34)
- [x] Approved single common backing edge + real count added canonical spec.
- [x] Source rendered comparison/screenshot RED→GREEN: singles/2/5/9, light/dark,350/740, count/date/detail preserved.
- [x] Type/build,14relatedunit and frozen localsource9cb8c19.
- [x] Source and documentation pushed; remote main8a35474 verified, source9cb8c19 ancestry retained.
- [x] Mac actual DMG narrow visual gate and local own cleanup.
- [x] Windows38535760114 source/actual installed visual and install/reinstall/uninstall retention;371pair proof and immutable privateRelease412509686 published/readback.
- [x] Own cleanup and operation report written; finaldocs/gates synchronized.
- [x] Delivery documentation 792bdd550ab3063e7c09fd3404a49a47e324b9f7 pushed and read back; source/tag9cb8c19 unchanged. Direct operation report prepared for closing response.
User targeted scope overrides skill default full suite. No design overhaul or new product logic. No delegated implementation/review claim needed for a CSS-only adjustment; executor diff+visual/native checks explicitly bounded.

## R6-08 approved follow-up (candidate0.0.35)
- [x] Canonical approved spec and in-chat previews recorded before code.
- [ ] Pure transaction/preview RED→GREEN.
- [ ] Guarded IPC/inline modal source checks.
- [ ] Fresh final review + scoped fixes, narrow doubleplatform package/install/private release.
- [ ] Owned cleanup + docs/gates/report, commit/push/readback.
Plan/audit: docs/releases/round6-r608-plan-audit.md; existingR6 plan reused.
