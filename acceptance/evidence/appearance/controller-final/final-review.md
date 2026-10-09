# Final whole-increment review

Reviewed range: `713a1fe30482930b24a23b40f2d75ac495057a40..88c6e5a0476bcec647525dd02ec08792e3d40611`. Package source reviewed: `d9cf75b425464589e6761abd8dff9954f3e2ad0c`, canonical 225-input vector `7b658b2d8a88b499c722bfe51a9bba0889b13673e0ee0661364f4eb5129764cc`. Scope includes the queued eight-file `README-post-publication-preview.diff` and its guarded definitions. This is the single whole-increment review, following requesting-code-review/code-reviewer.md and the binding constraints in final-review-brief.md.

## Strengths

- Preference storage is independent of schema3 notes and settings. `src/main/store/preferences.ts:13-20` detects previous snapshot/configuration evidence before note initialization, without reading note content to choose the locale; lines 24-38 validate requests, serialize writes, preserve the last durable value, and refuse corrupt/external preference changes. Main IPC checks sender ownership and flushes preferences on ordinary quit. No new account, network synchronization or clipboard capture is introduced.
- The same 168-DIP control pair is added at the first-level Composer, Detail and Calendar headers, with fixed language labels, SVG symbols, no-drag hit regions and narrow-width title truncation. Locale context does not key/remount editors. `PreferencesControl.tsx:10-24` supports captured drag, cancel, keyboard operations, current-transform interruption and 160 ms settling, with reduced-motion/forced-color suppression.
- Translation is centrally typed with key/placeholder parity tests. App status/error strings are localized at render time; known error envelopes preserve diagnostic payload bytes. User note/project/custom Agent fields remain data. The repaired ink calculation uses the actual new paper colors and both gradient extrema, rather than the old palette. Existing clip/logo assets are outside this net change.
- Tests exercise real repository IO and controlled renderer/IPC behavior, including dirty editor node/focus/selection, synthetic composition, widths, drag frames, corruption, held old failures and restart. The previous three important source findings have corresponding concrete repairs and focused evidence. The new ordering finding below is a different case not exercised by those tests.
- Task2's supplied report and independent review distinguish package source from evidence HEAD, actual Mac and Windows packages from source tests, strict ad-hoc/unsigned status from notarization, and hosted Windows checks from physical acceptance. The 24-asset/23-checksum private draft checkpoint is explicitly unpromoted. Earlier failed candidates, overlap/forced cleanup and source-inventory gaps are retained rather than rewritten as passes.

## Issues

### Critical — 0

None found.

### Important — 1

**I1 — A preceding successful write hides the newest preference write failure.**

- **Location:** `src/renderer/components/PreferencesControl.tsx:31` (related version reset at lines 28-29; ordered repository writes at `src/main/store/preferences.ts:28-37`).
- **Trigger:** With durable preference version 0, choose English and then Dark before the first write completes. Both requests capture `base=0`. The English write succeeds and broadcasts version 1; the component renders it. The queued Dark write then fails, for example because disk space or permissions change. Dark is still the newest intent/request, but `version.current===base` is false, so its error is discarded.
- **Evidence:** A focused Node24.19.0 in-memory probe executed the exact `change` function extracted from line 31 (only its TypeScript parameter annotation removed), with deferred bridge promises and the actual version-ref update order. Output was `{"node":"v24.19.0","sourceLine":31,"requests":[{"patch":{"locale":"en"},"seq":1},{"patch":{"theme":"dark"},"seq":2}],"durableVersion":1,"latestFailed":true,"error":"","expectedError":"ENOSPC","failureSilentlySuppressed":true}`. Main publishes each successful queued write; it does not publish a failure or set `preferences.error` for update failures, so there is no other alert path. This is a controlled callback-order probe, not an Electron/physical reproduction.
- **Impact:** The user receives no explanation that their newest choice was not saved. The durable value remains protected, but the explicit failed-persistence visibility contract is violated during ordinary rapid switching/slow IO. Existing appearance-workflow tests hold an **older failure then make a newer success**; they do not cover **older success then newest failure**.
- **Fix:** Track intent/operation ordering separately from the durable version and suppress only a failure actually superseded by a later intent/success. Do not treat every version advance as proof that the latest request is stale. Preserve cross-control/cross-window stale-error rejection. Add a focused deferred-write regression with both requests issued before the first success, first success broadcast rendered, and latest IO failure delivered; require a current-locale alert, latest durable selection and unchanged note content. Also cover the rejection/catch variant.

### Minor — 2

**M1 — Rejected worker receipts are labeled completed.**

- **Location:** `tests/electron/packaged-launch.cjs:63-66`.
- **Trigger/evidence:** A parsed worker receipt has the wrong profile or executable. The ownership check rejects it and leaves `passed=false` with `Worker receipt does not match this owned invocation`, but `completed` remains truthy and the final stage becomes `worker-completed`.
- **Impact:** This does not turn a failed check into a pass, invalidate actual matching package receipts, or justify a release block by itself. It can mislead stage-based diagnostics into believing this invocation produced an accepted completion receipt.
- **Fix:** Derive the stage from receipt acceptance, with an explicit mismatched/rejected-receipt stage. Add a small mismatch case when maintaining this harness.

**M2 — Windows verify retains an unresolved shell-argument deprecation.**

- **Location:** `acceptance/evidence/appearance/task2-rebuild-d9cf75b/windows-run-37963724007-full.log:279`.
- **Trigger/evidence:** The successful Windows `npm run verify` emitted Node DEP0190 for arguments passed with `shell:true`. The exact caller is not identified by the retained log; this review does not attribute it to a guessed source line.
- **Impact:** Nonblocking maintenance/diagnostic debt. The warning alone does not establish exploitable input or failed package behavior, and the run's actual success remains valid.
- **Fix:** Trace the emitting caller in a future appropriate Windows harness run and use direct executable invocation or deliberate shell-safe construction as applicable. Preserve the original log and do not suppress the warning merely to obtain clean output.

## Other deferred-item triage

- `acceptance/evidence/appearance/fix-round1/build-green.log:9-10,19-20`: Vite's external-output no-empty notice is expected for the explicitly owned temporary output. It protects against broad cleanup and is not a product defect. Do not set emptyOutDir indiscriminately. The final build's own artifact/source binding is the relevant gate.
- `acceptance/evidence/appearance/fix-round1/unit-final.log:14-15` and Windows log lines 251-252: Vitest's worker-isolation performance advisory is not a failed assertion or quality defect. No change to test isolation is warranted solely to remove this advice. These two warning classes add no issue count.
- Historical missing four vector entries, absent earliest RED inventories and missing original-out preflight hash remain evidence limits, not retroactively repaired evidence. Current complete 225-input binding supports the candidate source, but cannot establish those earlier facts.
- Two early owned startup attempts that overlapped and required exact TERM/KILL remain failed/non-normal cleanup attempts. Later normal lifecycle evidence does not turn them into passes. The Windows absent-key environment repair is supported; the exact original launch death cause remains unproven.

## Queued README and publication-only docs

The queued patch is acceptable in content: seven README translations consistently describe the actual two app UI languages, first-level language/appearance access and Settings Follow system. Version links and preview badge consistently move to .3; no screenshot, logo or clip asset is changed by the reviewed patch. Existing physical/receiver limitations and private-access wording remain. It is **not approved for application/publication now**, because I1 must be repaired and both packages rebuilt on one reviewed source before claiming the new current preview.

The controller's proposed later changes to external delivery QA guide/release notes/manifest (draft status to verified private prerelease, `finalWholeIncrementReviewPending=false`, actual review provenance), regenerated checksums and replacement of those draft metadata attachments are reasonable publication-only work. Their final bytes/live publication were not available to judge here and must be verified after the repaired source and dual-package gate. Preserve the current d9cf candidate and its historical evidence; do not relabel its binaries as containing the repair.

## Recommendations

Resolve I1 in the authorized combined fix wave, validate the concrete failed-write ordering without weakening the existing stale-error tests, and perform the scoped fix review. A production-source repair requires a new exact source freeze and both Mac/Windows builds before private publication. M1 and M2 are nonblocking; handle them only within the controller's scope ruling. Keep physical acceptance and deferred media work open.

## Evidence and review method

Read the unique primary net diff in sections; tool output truncation required rereading cut-off sections, not reviewing alternate repeated historical source patches. Read the final brief, reviewer template/skill, parent project rules, task reports/scoped repair review, Task2 independent review, queued README delta/definitions and the named warning log lines. The mandatory handoff memory-refresh hook ran and reported its configured directory missing; no successful memory refresh is claimed. The first shell call inherited a nonexistent cwd and failed before execution; subsequent commands used the explicit project directory, /bin/sh and login=false.

The only behavioral probe was read-only and in memory using bundled Node24.19.0: the exact line-31 callback ordering described in I1. An initial attempt to transpile the full TSX component failed because the locally resolved TypeScript object did not expose ModuleKind; no component ran and no files were written by that attempt. The successful narrow probe did not use that compiler, mutate source or run Electron. No suite, CI, Electron, installer, OS/receiver session, Git index/HEAD/branch/remote mutation or subagent dispatch occurred. Only this report was written. Package/draft conclusions rely on the supplied checked Task2 receipts/review; this whole-increment pass did not repeat asset downloads, hashes or remote API verification.

## Declined to judge

Every behavior/evidence claim set aside for controller ruling:

1. Physical Chinese IME candidate behavior and physical focus retention on Mac/Windows — controlled synthetic events/DOM assertions cannot establish it; independent guide remains open.
2. Physical 100/125/150% DPI, multiple displays, display unplugging, real OS window-drag versus switch-drag behavior — no device session authorized in this review.
3. Natural pointer hand feel, subjective tactile motion and OS-native material quality/accessibility appearance — source timing and controlled frames establish mechanism, not physical perception. No native Liquid Glass claim; future paired glass/material redesign is outside this increment, with paper kept matte.
4. Real WeChat 4.1.13.65, QQ-browser Doubao and WorkBuddy 5.7.6 reception, duplicate/attachment/draft/send behavior — no real conversations or receivers were used; prior user feedback is not independent reproduction.
5. Physical disk disconnection, power failure and platform permission failure/restore/rollback in the user's installation — retained actual isolated package checks and synthetic IO faults are narrower evidence; real data/installations were protected.
6. Retesting all accepted original eleven repairs and unrelated legacy/unused views — this review assesses regressions from the locale/appearance increment, not a new broad original-feature audit.
7. README hero/GIF and further distinctive media polish — explicitly deferred by the user; existing image/art bytes are outside the queued patch.
8. Exact historical source/out state omitted by early inventories, earliest absent RED receipts, and successful normal cleanup of the two startup-only forced attempts — no retroactive proof is available; these gaps/failures remain disclosed.
9. Exact historical Windows child-death cause — runtime-override mechanism and later repaired dual-package success are supported, but original child stderr/cause is absent.
10. Exact DEP0190 emitting caller and exploitability — retained warning lacks attribution; recorded as M2 rather than assigning a speculative production defect.
11. A second live audit of draft/private status, all remote asset bytes and canonical vectors — already independently verified in Task2; no repeated network/package work was needed to judge this net code. Publication must refresh actual release facts, especially after I1's rebuild.
12. Future post-publication guide/manifest/release-body/checksum bytes and actual tag/publication state — controller described the bounded procedure, but those future artifacts do not yet exist. No approval of unseen final bytes or claim of publication.
13. Native OS Follow system changes and native menu/theme rendering under every physical accessibility mode — source uses Electron nativeTheme and retained tests cover controlled settings/forced colors, but this review changes no OS settings and does not infer physical acceptance.
14. Native hover/focus tooltip behavior and screen-reader experience on actual Mac/Windows — source labels/radio states/focus styling are present; physical assistive-technology behavior remains an independent QA row.

## Assessment

**Spec:** Needs fixes — the newest failed preference persistence can be silent under overlapping requests, violating the explicit visibility/order contract.

**Quality:** Needs fixes — storage isolation, translation and package provenance are strong, but the current durable-version test confuses preceding successful writes with superseding intent.

**Ready to publish/merge:** **No; with I1 fixed and scoped review plus newly bound dual packages, reassess publication.** Existing reviewed d9cf package evidence remains valid for that older candidate, not the repaired source.

**Counts:** Critical **0**, Important **1**, Minor **2**. No other actionable issue was substantiated in this review. Physical/user acceptance remains open independently of these counts.
