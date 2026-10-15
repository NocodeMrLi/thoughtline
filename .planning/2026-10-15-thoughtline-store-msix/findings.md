# Findings

- Official msstore-cli latest release v0.4.3 published 2026-09-22. macOS arm64 archive 30,660,700 bytes; SHA256 54e9ef96c09ba866d636e4c321000f66c717bcf892602aa016953b39a501026f.
- CLI cross-platform; first MSIX publication must use Partner Center. Overview says paid products unsupported while commands document PriceId preservation: inspect pinned source before promising paid-update automation.
- Current app 0.0.37, electron-builder 26.15.3 NSIS x64; no Store target. macOS-only native notification plugin does not compile on Windows.
- Windows notification AUMID hardcoded com.nocodemrli.thoughtline; packaged-app behavior needs investigation. Current userData uses appData/Thoughtline unless explicit isolated test override; Store virtualization/coexistence needs package evidence.
- Legacy test-packages.yml push on main executes verify and extensive old fixtures. New input commits need [skip ci] and new manual-only Store workflow; no broad old CI.
- Fork private/source-equal, current credentials push=true/admin=false. It contains seven workflow files; Actions enabled by owner; fresh API lists seven active workflows and zero runs. Missing fork tags/Release does not stop commit-pinned builds; historical rollback artifacts stay upstream.
- Mac M1 16GB, about12GiB free: only necessary CLI/runtime installation, no VM or redundant builds.

References: https://github.com/microsoft/msstore-cli/releases/tag/v0.4.3 ; https://learn.microsoft.com/en-us/windows/apps/publish/msstore-dev-cli/overview ; https://learn.microsoft.com/en-us/windows/apps/publish/msstore-dev-cli/commands

- Pinned Electron v44.7.0 source: packaged toast activator skips registry/shortcut setup and requires manifest COM activation. Added fixed CLSID/AUMID only in process.windowsStore branch; ordinary EXE unchanged. Native notification delivery remains separate acceptance.
- CLI installed at ~/.local/bin/msstore; --version 0.4.3.2+193cb57f2a. Archive and published SHA agree. SellerId missing prevents packaging/settings calls: installed does not mean seller authentication completed. No initializer run (it overwrites config/assets).
- Product source candidate 0.0.38 maps Store1.0.38.0. Existing037 published README/download links remain accurate and unchanged.
- Fresh review 0 Critical/2 Important: pre-writer path gate and cleanup failure report survival. Both reproduced by failing focused guards and fixed; 46/46 affected tests pass. Minor expectedAumid field inferred from config rather than runtime: retain as expected value only, native acceptance separate.
- User additionally authorized preparing Chinese/English listing text and matching screenshots. Drafts in docs/store/listing; no portal login or first submission performed. Existing macOS images are references, not Windows screenshots.
