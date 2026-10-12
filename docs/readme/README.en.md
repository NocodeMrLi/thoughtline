<h1 align="center">
  <img src="../../assets/app-icon.png" alt="Thoughtline app icon" width="96" height="96" valign="middle" /> 晾念头 · Thoughtline
</h1>

<p align="center">
  <a href="https://github.com/NocodeMrLi/thoughtline/stargazers"><img src="badges/stars.svg" alt="GitHub stars: 0" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases"><img src="badges/downloads.svg" alt="Release asset downloads: 30" /></a>
  <a href="#license"><img src="badges/license.svg" alt="License: UNLICENSED" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.28"><img src="badges/preview.svg" alt="Version: 0.0.28" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/issues"><img src="badges/feedback.svg" alt="Feedback on GitHub" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.28"><img src="badges/platforms.svg" alt="Platforms: macOS and Windows" /></a>
</p>

<p align="center">
  <sub><a href="../../README.md">中文</a> · <a href="../../docs/readme/README.en.md">English</a> · <a href="../../docs/readme/README.ja.md">日本語</a> · <a href="../../docs/readme/README.ko.md">한국어</a> · <a href="../../docs/readme/README.es.md">Español</a> · <a href="../../docs/readme/README.fr.md">Français</a> · <a href="../../docs/readme/README.pt.md">Português</a></sub>
</p>

<p align="center">
  <strong>Hang up a thought. Keep inspiration within reach.</strong><br />
  A rope, a few clips, and sheets of paper for everyday ideas.
</p>

<h2 align="center"><a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.28"><ins>Download Thoughtline</ins></a></h2>

<p align="center"><sub>macOS Apple Silicon · Windows x64 · 0.0.28</sub></p>

Thoughtline is a lightweight desktop tool for macOS and Windows. Reveal your ideas at the top edge of the screen, capture a thought, and return to what you were doing.

## Features

- **Tags and groups**: shared search and creation in every editor. Hold to arrange, then click the cross to remove a choice. Three management tabs cover tags, groups and removed choices; the two restore lists scroll independently.
- **New thought entry**: right-click a clip or note to create a thought. The top edge still reveals the rope while you write.
- Rope options show actual braid texture and vine leaves. Expanded and calendar readers keep separate title and body fields with clear spacing, matching clip and paper colors. Vine leaves and tendrils stay in place when clips move.
- Capture titles, text, and categories with a shortcut; keep unfinished notes as drafts.
- A desktop rope with clips and paper, with new thoughts assigned to General.
- Choose 4, 6 or 8 clips in Calendar → More → Storage & Settings; the default is 6. Sheets scale proportionally to the display, with only a modest increase at 4. Newly saved thoughts waiting on a full line fill freed slots, newest first; legacy off-line and manually archived thoughts remain under your control. Separate dropdowns keep the full preview and Apply visible while adjusting.
- Customize rope and paper in Calendar → More → Storage and settings → Appearance. The classic cord supports custom colors; braided cotton keeps its natural fiber tone, and the vine stays green. Clip colors continue to follow tags. Choose five soft paper presets and blank, ruled or dashed paper. Preview before Apply; Cancel or Back discards the preview. Settings separates Appearance, Controls, and Data.
- Move a whole clip or pull out one paper. Right-click **Merge** to choose a compatible clip, or **Split** to separate the current thought. Splitting compacts fragmented spacing when needed; **Auto arrange** keeps left-to-right order. Arrangement can be undone.
- Edit directly in the detail view or calendar; autosave after a short pause and turn pages instantly. Reading and editing share the tag-colored border and selected paper tone.
- Browse by day, month, or year; search and filter, including archived thoughts.
- Recover deleted thoughts from Recently Deleted. Removing a project keeps its thoughts. Previously hanging thoughts return to their original clip or a free slot; when full, restore to the calendar and choose Swap in.
- Copy text or drag the body as plain text. The source note stays in place; nothing is sent automatically.
- Keep data locally; inspect the actual folder, move it, or export an independent backup.
- Switch Chinese/English and light/dark directly in the first-level windows, or follow the system; paper stays soft and readable.
- When the line is full, save the thought or choose **Swap onto line** in the same window; the old thought is put away and retained. Hanging from the calendar appears immediately. More menus close when the pointer leaves.

- Title-only thoughts and reminders: enter a title or text; the body may be empty. The bell sets a one-time reminder, shared with the calendar. System notifications require permission and open the thought when clicked. Fully quitting pauses delivery; missed reminders are grouped on restart. If system delivery is unavailable, a light reminder at the top provides a clickable fallback without taking focus or adding a window.

<p align="center"><img src="images/thought-calendar.png" alt="Thoughtline Calendar with synthetic demonstration data." width="740" /><br /><sub>Thoughtline Calendar with synthetic demonstration data.</sub></p>

## Download and install

Downloads are available to members with repository access. Releases include packages, isolated launchers, SHA256SUMS, and build provenance. [Releases](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.28).

| Platform | Package |
|---|---|
| macOS · Apple Silicon | arm64 · DMG |
| Windows | x64 · EXE (NSIS) |

Before upgrading, quit normally and back up your data. Commercial signing certificates and platform notarization are not planned. Mac retains local ad-hoc signing; Windows is unsigned. Users install through the normal system trust prompts. Signing status does not determine release maturity. There is no automatic update.

## Getting started

1. Press Control + Alt + N to capture a thought (⌃ + ⌥ + N on Mac); change the shortcut in Settings.
2. Enter inserts a line break. Submit with ⌘ + Enter on Mac or Ctrl + Enter on Windows. Esc saves a draft and closes the composer.
3. Move the pointer to the top screen edge to reveal the rope; open a sheet to read, copy, edit, or archive it.
4. Use the calendar to find archived thoughts or restore items from Recently Deleted.

Tags describe purposes, people or tools: everyday ideas, work notes, a direct manager, a colleague or Codex. Add your own tags for daily reports, design plans or clients. Fresh installations provide six concise presets; existing tags and colors stay intact. Thoughtline Calendar filters All statuses / On the line / Off the line. Off the line includes saved-only and put-away thoughts, and legacy records that exceed line capacity. Copy or drag text yourself; receiving behavior in other applications still needs separate verification.

## Data and backups

Calendar settings show the actual data folder. Moving data copies and verifies it before switching; the original remains. Exporting a backup does not change the current folder. [Data / 备份说明](../ROUND1-DATA-SAFETY.md).

The current format is schema3. Version 0.0.16-preview.6 cannot read it directly. Preserve new data and validate a pre-upgrade backup in a separate folder before downgrading; that backup excludes later changes.

## Development

Use Node.js 24.19.0 or a newer 24.x version. verify runs type checks, unit tests, and a build. Build each platform package on its corresponding OS. The stack is Electron, React, TypeScript, and Vite.

```bash
npm ci
npm run dev
```

```bash
npm run verify
npm run package:mac
npm run package:win
```

Applicable automated and package checks have passed. Physical Mac/Windows IME, DPI, multiple displays, focus, and real receiving fields in WeChat, Doubao, and WorkBuddy still need independent testing. The app interface supports Chinese and English. Switch language and light/dark appearance directly at the top right of Composer, Detail, or Calendar; Settings can restore Follow system. The seven language links translate the README, not seven app interface languages.

## Feedback

Use Issues for bugs and ideas. Include versions, reproduction steps, expected and actual behavior, and redacted evidence. Do not upload personal thoughts or data. [Issues](https://github.com/NocodeMrLi/thoughtline/issues).

Stars and downloads are an API snapshot dated 2026-10-10. Downloads count release asset downloads.

<a id="license"></a>
## License and acknowledgments

The project is currently UNLICENSED; no open-source permission has been granted. A future public release will specify its license and contribution process. See the third-party notices for included code and licenses. [Third-party notices](../../THIRD_PARTY_NOTICES.md).

0.0.25 title-only thoughts and reminder fields require the updated reader. Before downgrading, retain current data and use a pre-upgrade backup in a separate directory.
