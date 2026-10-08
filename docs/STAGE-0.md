# 0.0.1 native pilot scope

This is a staged native-window pilot, not the completed product.

- macOS and Windows share Electron UI/data/geometry/state modules.
- Top-edge dwell reveals a transparent rope with three sample cards when there are no stored ideas.
- Control+Alt+N opens temporary input. macOS Command+Enter / Windows Control+Enter saves; Enter adds a newline; Escape saves a draft.
- Clicking a card copies full text. Stored ideas and drafts survive restart. Sample cards are never persisted.
- Shared tests cover count-based sag, dwell/leave/operation locks, interruptible motion math, IME guard, hotkey swap, atomic save failures, backup recovery, schema guard and Agent migration.
- Edge-Drop edge/seam probe is reused with attribution. Tendedero fixed-end parabola is ported with count-based sag.

Still awaiting: physical click-through/focus matrix on both systems, real Windows user feedback, finalized animated UI/overflow/filter/manage/edit flows, pure-text drag interoperability, full-screen/multi-monitor/sleep/performance acceptance, signed distribution.

Native test helper windows live only in tests; they never ship in installers. Installers are local/private test builds without public-release signing. Do not treat installation or CI packaging as manual platform acceptance.

Follow-up hardening: operation locks freeze the visible sag during an in-progress weight transition; unlock continues toward the newest count. Packaging explicitly uses --publish never so CI cannot trigger an implicit release. The workflow uploads private test artifacts separately.

Pilot installers are available in the [private prerelease](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.1-pilot.1). Both are built from `6eee5a13c4a208ccffa7a3ef60bc389dec0fbe02`; local hashes match GitHub asset digests. Current development is on main, with tested stage commits as rollback points.

## 0.0.2 implementation stage

Temporary detail/manage view, edit and cancellation, archive/restore with undo, full-text/project/Agent search, 50-row pagination, Agent add/update/remove-with-migration, actual shelf filtering and overflow are connected. Weight counts all hanging notes, excludes archived history, caps at88DIP, and uses shared interruptible motion in the renderer. Empty shelf displays shortcut help, with no synthetic sample cards.

31 unit tests and the Mac native application workflow passed. Native physical acceptance and cross-Agent plaintext drag remain open. Clip rearrangement/merge/split is a new design awaiting user review, not shipped in this stage.
