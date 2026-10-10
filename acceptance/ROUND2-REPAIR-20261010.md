# Thoughtline second round repair — stage A

User authorized execution after canonical project plan saved/read back. Display name: **Thoughtline日历 / Thoughtline Calendar**.

Implemented: delayed short icon hints dismissed before menus; native long paper hint removed; four-edge Agent-colour focus ring inside clipping bounds; height-responsive calendar and 36 DIP arrow buttons; settings Back restores calendar navigation/window size; actual dirty settings retained on Back and protected on close; external settings update rebases untouched fields; discard clears hidden close guard; native context menu stashes only current idea, preserving other IDs/order/current page/content/project/manual position.

Mac source validation: typecheck/build pass; 229 units pass, four Windows applicable skips. `round2/final-stage/workflow-056bXU` nine checks pass; clean shelf and page handoff failure/retry tests pass. `round2/settings-rebase/geometry-attempt-1791599811092-4450` original hierarchy motion/window persistence passes. Preserve all preceding red receipts, including geometry external-settings regression and its normal shutdown record. Own synthetic profiles removed only after normal exit and PID checks.

Month input plus two renderer frames: baseline p50 66 ms; latest p50 67 ms / p95 69 ms. No significant performance improvement claimed; visual effects retained. These measurements do not establish physical Windows smoothness.

Native outside-click: **pending**. Mac real native programmatic close callback passes; protocol menu tests cannot establish desktop click cancellation. Hosted Windows native owner comparison added, separate from physical device acceptance. User Windows preview.4 OS/DPI unknown; installed user Mac preview.3 is protected and does not equal tested source.

Candidate version reserved 0.0.17-preview.5; no package released yet. Existing preview.4 assets untouched, private repository retained. No commercial signing/notarization is planned; local macOS ad-hoc signing remains a build requirement, unrelated to release maturity. README showcase GIF remains deferred. Full independent user acceptance and real text receivers/IME/multi-display remain open.
