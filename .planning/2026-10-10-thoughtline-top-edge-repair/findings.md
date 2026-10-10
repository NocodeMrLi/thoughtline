# Findings

Actual isolated preview.3 native package reproduction: display1440x900 DIP, scale2, workArea.y25; showInactive restores native origin to x217 while logical width and renderer viewport stay1440. Reapplying setBounds after show aligns x0. Evidence native-probe.json, position-trial/native-probe.json, red-native/native-probe.json. Root is native origin restoration, not stored clip positions or viewport width.

Menu-bar gap was outside corridor; edge-to-corridor expired600ms. Four expected RED unit failures plus actual package centering assertion failure retained. Fix: after-show native frame correction only when mismatched; corridor includes menu-bar gap and keeps an already visible shelf alive. Corridor remains mouse-transparent; cards only become interactive at published hit rectangles; exit500ms preserved.

Mac source real EdgeController poll/native frame/DOM/IPC tests passed: default center, slow gap, copy into isolated clipboard, reader expansion, three reveal cycles and manual position0.15 preserved. OS cursor not moved. Source runtime version44.7.0 is Electron; declared app version recorded separately. Physical Windows remains pending; hosted Windows source and actual NSIS app tests wired.

Missing guessed files were not used: actual shelfState.ts/platform/host.ts/renderer/main.tsx and scripts/generate-mac-isolated-launcher.cjs. YAML module unavailable; js-yaml parsed workflow successfully. Compaction hook invoked but configured WordPet memory directory missing. UX query had no exact verified corridor match; project behavior is design basis.
