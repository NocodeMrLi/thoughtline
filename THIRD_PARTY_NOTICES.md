# Third-party code used by Thoughtline

## Edge-Drop

Source: https://github.com/Deepender25/Edge-Drop/tree/469fd0d56d8d4073ed5a6fbcab36953db8203cae

License: Apache-2.0, full text in licenses/Edge-Drop-Apache-2.0.txt.

- src/main/vendor/edge-drop/stickProbe.ts: upstream file copied unchanged, including edge geometry, own-side arming, speed and rest-after-crossing policy.
- src/main/vendor/edge-drop/workAreaCache.ts: WorkAreaRect type extracted from upstream; cache implementation omitted because Electron screen owns display lookup here.
- Thoughtline passes physical screen bounds in DIP for top-edge probing, rather than copying upstream's Windows work-area mounting policy. No upstream clipboard monitoring, capacity eviction or text-file drag behavior is included.

## Tendedero

Source: https://github.com/alejandrobujan/tendedero/tree/ed0618a67cc59e0a8621b97bb5e32ab9af3b0b69

Copyright (c) 2026 Alejandro Buján. MIT source license, full text and name/icon exclusion in licenses/Tendedero-MIT.txt.

- src/shared/ropeGeometry.ts ports LineView.swift Layout.ropeY's fixed-end parabola to TypeScript, with bounded centered length and fixed natural curvature. The earlier count-based sag was superseded by the user's fixed-rope requirement; note count no longer moves the rope.
- The shelf visual follows the reference design; the name and icon are original Thoughtline assets. No private CGS APIs or screenshot-folder changes are used.

These notices and licenses must be included in local installation packages. Other npm dependencies retain their own package licenses.

## GitHub Invertocat

Official black/white SVG assets from https://brand.github.com/GitHub_Logos.zip, used unchanged only as a secondary profile link. GitHub trademarks and artwork remain owned by GitHub, Inc.; this is not Thoughtline identity or an endorsement. Permitted social-link guidance: https://brand.github.com/foundations/logo. Details in licenses/GitHub-logo-use.md.

## docx

DOCX document export uses docx 9.10.0, MIT licensed. Source and documentation: https://github.com/dolanmiu/docx and https://docx.js.org/. Full license in licenses/docx-MIT.txt; its npm dependencies retain their package licenses.
