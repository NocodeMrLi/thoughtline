# 0.0.1 native pilot scope

This is a staged native-window pilot, not the completed product.

- macOS and Windows share Electron UI/data/geometry/state modules.
- Historical0.0.1 contained development sample cards; current empty shelf shows shortcut help only.
- Control+Alt+N opens temporary input. macOS Command+Enter / Windows Control+Enter saves; Enter adds a newline; Escape saves a draft.
- Clicking a card copies full text. Stored ideas and drafts survive restart. No sample cards ship in current builds.
- Shared tests cover count-based sag, dwell/leave/operation locks, interruptible motion math, IME guard, hotkey swap, atomic save failures, backup recovery, schema guard and Agent migration.
- Edge-Drop edge/seam probe is reused with attribution. Tendedero fixed-end parabola is ported with count-based sag.

Still awaiting: physical click-through/focus matrix on both systems, real Windows user feedback, finalized animated UI/overflow/filter/manage/edit flows, pure-text drag interoperability, full-screen/multi-monitor/sleep/performance acceptance, signed distribution.

Native test helper windows live only in tests; they never ship in installers. Installers are local/private test builds without public-release signing. Do not treat installation or CI packaging as manual platform acceptance.

Follow-up hardening: operation locks freeze the visible sag during an in-progress weight transition; unlock continues toward the newest count. Packaging explicitly uses --publish never so CI cannot trigger an implicit release. The workflow uploads private test artifacts separately.

Pilot installers are available in the [private prerelease](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.1-pilot.1). Both are built from `6eee5a13c4a208ccffa7a3ef60bc389dec0fbe02`; local hashes match GitHub asset digests. Current development is on main, with tested stage commits as rollback points.

## 0.0.2 implementation stage

Temporary detail/manage view, edit and cancellation, archive/restore with undo, full-text/project/Agent search, 50-row pagination, Agent add/update/remove-with-migration, actual shelf filtering and overflow are connected. Weight counts all hanging notes, excludes archived history, caps at88DIP, and uses shared interruptible motion in the renderer. Empty shelf displays shortcut help, with no synthetic sample cards.

31 unit tests and the Mac native application workflow passed. Native physical acceptance and cross-Agent plaintext drag remain open. Clip rearrangement/merge/split is a new design awaiting user review, not shipped in this stage.

## 0.0.3 compact cards and grouped clips

160×112DIP cards show Agent/project and a short label; blank labels use the first nonempty body line. A380×360 temporary detail reuses the manage window; no permanent main window was added. Same-Agent clips can be dragged horizontally, merged after a600ms target dwell, split, and undone. Groups retain independent note bodies and stable member IDs. Arrow buttons appear on hover, a small page count opens title selection, and only the current note is copied. Grouping does not reduce weight; sag remains capped at88DIP. Width determines capacity without a six-clip hard limit.

Schema2 validates unique hanging-note membership and Agent ownership. Schema1 is migrated in memory; the original raw file is retained before the first upgraded save. Archive/restore and changing Agent update membership without deleting text.

41 unit tests, Mac native object smoke, edit/retrieval workflow, and grouped-clip IPC/DOM/protocol-mouse workflow passed. The latter covers early drop rejection and600ms drag merge. Physical Mac/Windows pointer, focus, IME, display and user acceptance remain separate, as does plaintext drag into Agent inputs. Source0.0.3 packages are a private unsigned test build.
