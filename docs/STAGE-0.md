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
