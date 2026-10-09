# 3fa4683 final-rebuild attempt — BLOCKED

The new Mac arm64 package was rebuilt from reviewed source `3fa46838cac1161fc6909ac0a2566cd8a87e79a8` and passed actual mounted-App acceptance 6/6 and packaged appearance 3/3. Its DMG SHA256 is `d2184c628a7cb90ccd1abe9c97997e4b6d6b5497696eab2eea98e2542bbfb087`; packaged asar SHA256 is `72326b5e8c6fc14c6b73efe8bdfe28ce66cfd3a1f00d192c72cbfc09bfee677e`.

The matching automatic Windows CI run `37968756145` failed in `npm run verify`: four tests in `tests/unit/preferenceOrdering.test.ts` throw `TypeError: Cannot read properties of null (reading '1')` at line 8. The fixture extracts source with a fixed LF newline expression; Windows line ending conversion is a likely explanation, subject to reviewed source repair. No Windows installer, installation, reinstall or ordinary-uninstall result exists for this source. The private draft release still targets historical `d9cf75b` and MUST NOT be published as this repair.

This directory is partial historical evidence, not the final delivery. Its generated Mac launcher binds the original final-directory absolute path and is retained for provenance only after this archive move. Do not run it from this archive. Complete raw run/evidence and report are retained in the repository. Any included test/source fix needs review and BOTH new platform builds before draft update.
