# Microsoft Store candidate delivery

Delivery: [0.0.38 candidate report](candidate-0.0.38-report.md).

Main NocodeMrLi/thoughtline remains the source. NocodeLi/thoughtline only builds the identical frozen commit. No tag or old Release is required in the fork. Never put feature changes only in the fork.

## Build and identity

- Product version: 0.0.38. Store manifest version: 1.0.38.0. Mapping: `(semver.major + 1).minor.patch.0`; this satisfies the nonzero first component and zero fourth component while leaving the product version unchanged.
- Name: `NocodeMrli.Thoughtline`; Publisher: `CN=B5946604-C81F-4CBD-97F9-E2F6C22D124D`; PublisherDisplayName: `NocodeMrli`; Store ID: `9PK55N0ZM4TB`.
- CLI v0.4.3 installed user-locally on Mac. It is not authenticated/configured for a seller. The Electron CLI initializer rewrites config and sample assets, so it was not run. Locked existing electron-builder plus Windows SDK MakeAppx builds the independent Store candidate; original EXE packaging stays available.
- Only `store-msix-candidate.yml` is manually dispatched in the private fork. Main/fork source and tree are checked before dispatch, and the runner checks the frozen inputs again. Code commits include `[skip ci]` to avoid the old broad push workflow.
- Package remains unsigned for Store upload. A disposable signed COPY is used for runner installation checks. No PFX/private certificate, API secret or submission step enters the artifact.

## What the checks mean

The package report validates actual unpacked identity, version, x64 payload, file hashes and logo dimensions. The installed probe, when the hosted session supports MSIX, verifies actual `process.windowsStore`, the stable toast COM identity, a saved synthetic note, settings, restart and same-version reinstall retention using the default profile. This is not a previous released Store upgrade test; no previous Store release exists.

Hosted Windows Server may reject sideloading or interactive UI. An `unsupported-host-session` or failed install report is a visible outstanding gate, never physical acceptance. Notifications, real mouse/IME, desktop DPI, Store acquisition and licensing, and certification remain separate from building a candidate. First publication uses Partner Center; no automatic update/submission is enabled.

## Owner steps after a candidate is delivered

1. Open the existing Thoughtline product in Partner Center. Keep its reserved name/identity.
2. Upload the verified `.msix` under Packages and inspect Microsoft's validation results.
3. Add both Chinese and English listing drafts from `listing/`; use actual Windows screenshots of the matching UI language. Do not label macOS or simulated README images as Windows captures.
4. Review the proposed US$1.99 one-time price, markets, age ratings, public privacy/support links and payout/tax status in the portal. None has been silently configured by the build.
5. Review the complete submission before sending it for certification. First submission, approval and publication are not established by the build report.

Keep artifact SHA256 and exact source SHA with each submission. Future builds use a strictly higher Store version and the same identity; update the original Store product. App data in a Store-managed profile is separate from a promise of automatic EXE-to-Store migration, and uninstall can remove Store data: export a backup before switching distribution channels or uninstalling.
