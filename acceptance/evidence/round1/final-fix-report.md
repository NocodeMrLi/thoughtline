# ONE final fix wave — R1 / R2 / R3 / R4

Status: **implementation and worker verification complete; inputs frozen for root's ONE scoped re-review.** No commit, push, tag, package, installation, user data access or global cleanup. Main remains `fa45cb88105db81806e419bba5d8029af9540389`; candidate version `0.0.17-preview.2`. Task8's approved badge/narrow-count UI retained.

## Input boundary and method

- Read full final-fix-brief and final-review, current task_plan, project AGENTS, current external round1 requirements and applicable 03/04/05/08/09 design sections. Used systematic-debugging, test-driven-development, verification-before-completion, ui-ux-pro-max and planning-with-files (this assigned ledger). Local motion guidance: honor reduced motion, keep spatial continuity, limit animated elements. No subagent delegation. Memory registry search found no Thoughtline hit.
- Parent before snapshot covers 154 inputs. After snapshot covers 157 (10 existing files changed, 3 new tests); all source/scripts/tests/.github hashes in `.superpowers/sdd/task_plan/final-fix-after-sha256.json`. Delta list in `final-fix-input-delta.json`.
- Complete scoped diff including new tests: `.superpowers/sdd/task_plan/final-fix-scoped.diff`, **57364 bytes**, SHA256 **35f9df112604aade54b2aa06b15cdf883061fc721b7b2b9d1ce646bb43a2e982**. Compare with the parent's actual before snapshot, not HEAD's broader P6/Task7/Task8 WIP.
- All new raw evidence is under `acceptance/evidence/round1/final-fix/`, unique attempts; no previous results overwritten. Explicit `/bin/sh`, login=false, repo cwd, Node24 runtime PATH.

## R1 — current reader owns navigation, expired replies cannot discard a new draft

Files: `src/renderer/components/{IdeaReader,Calendar,Detail,InlineIdeaEditor}.tsx`; new `tests/electron/final-reader-placement-workflow.cjs`.

- Removed deletion-reply parent navigation callback entirely. Calendar/Detail now derive adjacent selection from the committed snapshot, prior reader identity and ordering, current session and navigation intent. This preserves legitimate deletion broadcasts that unmount the old Reader before its reply, while an old reply has no navigation authority.
- Calendar keys Readers by idea plus session. Reader checks mounted/session/idea/operation ownership after leave guard, page flush, info fetch, and task response; status/error/finally writes are similarly guarded. Repeat mutation starts are blocked synchronously. Finish-edit and editor `onDone` callbacks require their current mounted lifetime.
- Detail checks current mounted/session ownership before and after each queued leave guard; reads current clip/page refs at queue execution. Fast sequential flips remain queued, not discarded by last-click intent. Title-list and undo callbacks have intent/session guards. Explicit empty selection differs from initial main selection, so deletion of a last paper does not request an unrelated fallback.
- Genuine RED `reader-placement-red3.log` / `reader-placement-red3-IKuu8J/receipt.json`: real main `openManage` session **2→3**, original handler completed deletion/save/broadcast then held only its success response; releasing it changed new dirty C to **b**, editor count **0**, persisted C unchanged. Same-session **4→4**, Back then C, delayed b reply changed C to **b2**, editor **0**, persisted C unchanged. No synthetic session publication in this new regression.
- GREEN final actual-source receipt: `final-reader-placement-workflow-final-rwm4jW/final-green-*/receipt.json`: both C editors remain mounted with their unsaved latest text after old response; normal close flushes. Also passes Calendar current-delete→e; Detail e-delete→f and final-delete→empty; two rapid forward/back flips; real saved-but-delayed edit finish remains mounted until acknowledgement; last-deleted separate selection remains empty.
- Existing `inline-edit-workflow`, `archive-current-workflow`, `page-handoff-workflow` all exit0 after final build: 350/1500 save recovery, controlled failed save retains input, synthetic composition blocks leave/title-list, same-ID Agent split keeps editor, current archive removes stale pager, rehang identity, current delete chooses neighbor, stale page retries and detached checkpoints preserved.

## R2 — uniform real-content calendar motion

Files: `src/renderer/components/Calendar.tsx`; new `tests/electron/final-calendar-shape-workflow.cjs`.

- Replaced independent X/Y scale with uniform contain scale and center-aware translation in both incoming and outgoing directions. Existing clipped visible-source surface, real-content clone, 18-paper bound, opacity transition, 210/230ms timing, interruption, reduced/forced-colors cancellation and date anchors remain.
- Genuine RED `shape-red.log` / `shape-red-*/receipt.json`: six paths (empty day enter/return, paper day enter/return, month→year, year→month), controlled actual WAAPI frames at 25/100ms, unequal computed matrix scales and original PNGs retained. Expected assertion failed, exit1.
- GREEN `shape-green1.log` / `shape-green1-o5Sr7q/receipt.json`: all six directions have equal X/Y scale at both times, exit0. Twelve actual Electron PNGs retained. Worker visually read empty-day-return-25, paper-day-return-25, month-to-year-100: Chinese glyphs, paper proportions and badge shapes remain unstretched. Parent should view required early/middle PNGs from this directory in scoped re-review.
- Existing calendar-motion, calendar-motion-fix1 and calendar-geometry suites all exit0 against final build, preserving center/date anchors, moving real content, bounded clones, interruption, saved/system reduced motion, scroll restoration, resize, counts, IDs, narrow columns and composition leave guard. No previous assertion was relaxed or removed. No physical iPhone comparison or natural-framerate claim.

## R3 — Agent auto-split shares stable placement and true-full notice

Files: `src/shared/ideaCommands.ts`, `src/main/index.ts`; new `tests/unit/agentSplitPlacement.test.ts`; actual Electron case in final-reader-placement fixture.

- `editIdeaIfUnchanged` accepts optional internal width; after the unchanged-content CAS, only grouped Agent separation captures existing clip positions. The same allocator then finds any legal left/middle/right gap. Public renderer IPC signature, edit confirmation, session/owner checks, queued persistence and undo behavior remain.
- Main detects an actually new clip containing this edited ID after successful save, checks overflow for that ID only, and publishes `已保存，绳上暂时放不下，可在念头日历查看` only when it is outside capacity. Ordinary edits do not derive a warning from unrelated overflow; subsequent body edits retain the useful existing notice.
- Genuine module RED `agent-placement-unit-red.log`: old automatic clip center moved **610→500**. Six-case suite before fix had 1 failure / 5 passes. GREEN `agent-placement-unit-green.log` and full verify: 6/6 (automatic centers, left gap, middle gap, right gap, true full, ordinary edit with unrelated overflow). Asserts full idea IDs, original body/metadata, old group order/current fallback, new clip currentId, follow-up edit stable.
- Genuine actual-main/UI RED same reader RED3 fixture: confirmed grouped h→Codex on full rope saved but notice was empty (assertion failure). Final GREEN validates all IDs remain, old group contains g, h owns its own currentId, continued body edit persists and current Reader shows the full calendar instruction. Screenshot `agent-full-rope-notice.png` in final-reader-placement receipt directory. Pure widths/real source Electron do not prove physical DPI/multi-screen behavior.

## R4 — package acceptance loads repository version once

File: `tests/electron/package-acceptance.cjs`.

- Top-level `packageInfo=require('../../package.json')`; both strict manifest/version checks reuse it. No version matching or backup/restore assertion weakened.
- `package-path-red.log`: createRequire from actual fixture location, `../package.json` → MODULE_NOT_FOUND, exit1.
- `package-path-green.log`: read-only createRequire and runtime evaluation of the actual startup declarations resolves app/package.json, returns **0.0.17-preview.2**, compiles complete script syntax, exit0.
- Actual frozen DMG/App, backup byte hashes and restore with two restarts remain the later package gate. This wave did not package or claim packaged acceptance.

## CI and adjacent test changes

- `.github/workflows/test-packages.yml`: preserved all original 7 fixtures, added `calendar-brand-clip-workflow`, `final-reader-placement-workflow`, `final-calendar-shape-workflow` (10 total); existing unique run root/per-test attempt and source artifact retention remain.
- Task8 fixture already honored `THOUGHTLINE_EVIDENCE_DIR` plus unique attempt in parent before snapshot; no unnecessary routing rewrite. Only its diagnostic check for the known Mac PID30628 now runs on darwin; Windows reports `not-applicable`, never inspects an unrelated fixed runner PID. No Task8 UI/geometry change.
- `archive-current-workflow.cjs` now honors evidence root so its fresh adjacent run cannot overwrite the old P3 folder. No assertion changes.

## Verification commands and results

Runtime prefix for every Node/npm command: `/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin`. Fixtures used `THOUGHTLINE_FAKE_CLIPBOARD=1`, fresh temporary data, exact `storageInfo` directory check before new fixture mutations, unique evidence/attempt values.

| Command / evidence | Exit / result |
|---|---|
| `node node_modules/vitest/vitest.mjs run tests/unit/agentSplitPlacement.test.ts` RED / GREEN logs | 1 then 0; 1 fail→6 passes |
| `node tests/electron/final-reader-placement-workflow.cjs` RED3 / final unique receipt | 1 then 0; cross/same loss and missing hint close |
| `node tests/electron/final-calendar-shape-workflow.cjs` RED / GREEN | 1 then 0; six paths × two frames |
| `npm run typecheck` first targeted / `npm run build` first targeted | 0 / 0 |
| **`npm run verify` exactly once**, `full-verify-once.log` | **0; 184 passed, 4 Windows-only skipped, type/build passed** |
| Serial final fixtures listed below, `serial-final-results.json` | **9/9 exit0** |
| Read-only package startup/version/syntax probe | 0 |
| `git diff --check` | 0 |

Serial final source regressions: final-reader-placement, inline-edit, calendar, calendar-motion, calendar-motion-fix1, calendar-geometry, calendar-brand-clip, archive-current, page-handoff. Each has its own `*-final-<random>/stdout.log` and cleanup receipt. Motion-shape GREEN preceded a Detail-only selection representation adjustment; Calendar/shape fixture source unchanged, and both existing motion suites passed after final full build. No redundant full verify or performance sweep.

## Failures and probe limitations retained

- First shell call inherited nonexistent original cwd; corrected to explicit actual repo/workdir and shell. No file mutation in failed call.
- First new reader fixture used Shelf for `storageInfo`; main correctly rejected this sender, so test errored before mutations. Corrected probe to Manage; `reader-placement-red.log` and first receipt retained, normal close/ESRCH/ENOENT proved.
- RED2 same-session initially chose exactly the obsolete callback's neighbor c, so it did not expose same-session stale selection. Added distinct b2 neighbor; RED3 then genuinely failed both routes. Never claimed RED2's coincident pass proved absence.
- Two additional filenames contain `reader-empty-...-red`: they are **passing adjacent probes**, not failing RED evidence. They validated the empty case in the first repaired build; the explicit empty representation is defensive selection clarity within R1. All logs retained; no invented failing claim.
- Existing calendar-motion-fix1's old synthetic-session case remains labeled synthetic; new final reader regression supplies the separate real main-session evidence.
- Full verify's 4 skips are Windows-only filesystem cases, not failures. Actual final Windows CI, exact source SHA package artifacts, real input methods, target application drag reception, physical DPI/multi-screen and user acceptance remain pending root gates.

## Self-review and cleanup / freeze

Self-reviewed every changed production path and adjacent caller: Reader actions/finish/onDone, Calendar nav/history/query/status/restore/permanent selection, Detail queued choose/flip/title/undo/archive/page ownership, Inline CAS/autosave/composition/disposal, main update/status/history/split save ordering, shared group pruning/layout allocator, package full backup/version flow, CI attempts and retention. No new IPC channel/test switch in production, source-pixel asset or CSS badge edit, altered old assertion, request signature change, generic manager, rollback of actual deletion, or loss of fast queued flips.

`worker-final-cleanup-audit.json` read back **17** new-wave receipts: all recorded own PIDs now **ESRCH**, all recorded synthetic fixture directories **ENOENT**. Each successful fixture uses normal app.close; new fixtures restore held handlers/replies, close Manage (flush latest draft), then normal app.close. Existing fault fixture clears injected failure/ends synthetic composition before close; page-handoff clears fault/releases lock and flushes checkpoints. No app.exit, kill/TERM, global process search cleanup or directory removal outside owned fixture paths. Task8 final receipt records original Mac PID30628 alive before and after; no signal/action on it.

**Frozen now.** Parent owns remaining read-only PID/stat audit, independent ONE scoped re-review, final source freeze/commit/push and package gates. Worker will make no more input changes unless explicitly reassigned.
