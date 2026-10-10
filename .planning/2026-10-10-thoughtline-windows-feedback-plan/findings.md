# Findings & Decisions

## Requirements
- Seven Windows feedback photos: oversized/obstructing hints; calendar height/resizing and tiny arrows; settings return; shelf current-note stash; editor focus ring clipping in both reader views; desktop click dismiss and calendar naming; measured smoothness without deleting effects/features.
- User explicitly requests review of repair proposal before implementation. Preserve rope/clip/paper-only resident UI, matte paper, both OS quality and reduced-motion behavior.
- Source main d2ff3a36d4c71c1bb47ca08ab72acee906591169, clean before planning; package.json 0.0.17-preview.4. Current Windows installed exact build/DPI not confirmed.

## Research Findings
- User confirmed Windows installed 0.0.17-preview.4; Windows OS build and DPI still unknown. Mac installed readonly version is preview.3, running PID67908 protected; current inspected source is preview.4. Do not conflate installed Mac and source.
- ActionIcon.tsx immediately displays a fixed 280px portal tooltip and also sets native title. Tooltip z-index1000 vs reader-more z-index8; no click/menu-open dismissal. Matches user photo obstruction from shared renderer, not yet native Mac reproduction.
- auxiliary.css month-grid defines only columns; date-cell min-height57px, no remaining-height rows. Prev/next use text glyphs at12px. Existing calendar geometry test checks window bounds and animations, not resized grid fill.
- Settings has only closeManage on X/Escape; main.openSettings resets selection, increments session, changes bounds. main.tsx switches Calendar to Settings, unmounting Calendar-local nav/history/query/scroll. Agent/trash instead use Calendar internal go/back and retain state.
- InlineIdeaEditor is shared in Detail/Calendar; overflow:auto and width100% children, global focus-visible outline2px +offset2px extend outside child rectangle. preferences-theme.css further focus rule must be read before exact diagnosis.
- Shelf native menu is owned by focusable:false transparent Shelf; popup callback only releases menu lock. No current-note stash item, old calendar label present in shelf/tray. Desktop outside clicks cross native boundary and cannot be solved/proved by DOM events alone; owner/focus hypothesis not independently proven.
- UI skill narrower searches still lack exact tooltip/flexible-calendar-height match; project source and design contract are fallback basis. Back-button UX result supports preserving navigation state, while mobile-specific sizing is not imported into desktop UI.
- preferences-theme.css focus token is shared theme --focus (not derived from Agent in this file). Preserve user's requested Agent-associated cue, but do not claim current source already binds every editor focus ring to Agent color. Global offset outline plus scroll-container edge remains the clipping hypothesis to test.
- Native card-copy title contains the long drag instruction, matching the lingering OS tooltip visible across multiple supplied photos. Include its dismissal/lifecycle in tooltip scope, not just IconButton.
- Existing source fixture replaces Menu.popup with a stub, so it cannot prove desktop outside-click dismissal. Electron44.7 local typings provide popup and closePopup; plan native tests without that stub, validate OS owner/focus handling before choosing minimal adapter.
- Geometry persists through a350ms debounce then full repository commit/broadcast; calendar memo index depends on whole snapshot object. Potential needless index rebuild after geometry-only change is a profiling lead, not measured performance root cause. React skill memo result supports measured hotspots, not blanket memo/compiler migration.
- Root .agents and guessed App.tsx do not exist; actual app route is renderer/main.tsx. Project09 requires current-main inline work, no delegation. Existing12worktrees intact; this turn launched no App or test process.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Compaction hook returned 1: configured WordPet memory directory missing | Recorded limitation; project documentation remains the project source of truth. |
| UI skill first tooltip/height queries returned generic/off-topic results | One narrower retry required; do not persist them as specific verified guidance. |

## Resources
-

## Execution findings
User approved plan save then implementation, canonical second round doc saved. Nine latest Mac checks pass. Existing calendar geometry regression exposed untouched settings falsely becoming dirty after external save; fixed with per-field baseline rebasing, retained failing receipt. Explicit discard clears hidden guard; prompt supports keyboard focus and Escape. Native Windows outside-click pending owner comparison.

Right-click menu currently lacks split; IdeaReader already shares split/splitAll commands. Existing split searches full rope gaps and explicitly reports true overflow with calendar entry. Reuse it instead of a new write route. UI skill searches did not return a verified menu/undo match; project UX contract and existing implementation are fallback design basis.
