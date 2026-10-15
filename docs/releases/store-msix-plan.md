# Thoughtline Store candidate implementation plan

Spec: user approval in this conversation, existing product contracts in the formal notes, and `.planning/2026-10-15-thoughtline-store-msix/task_plan.md` boundaries.

## Global constraints
Main remains the only authoritative source. Build in NocodeLi/thoughtline from the identical frozen main SHA/tree. Store identity is NocodeMrli.Thoughtline / CN=B5946604-C81F-4CBD-97F9-E2F6C22D124D / NocodeMrli; Store ID 9PK55N0ZM4TB. Existing v0.0.37/tag/assets immutable; no public release, first Store submission, API credentials or price changes. Changes affect Windows Store packaging only. User mandates targeted/affected tests, overriding full-suite defaults in generic skills. Keep original historical evidence and current planning files for traceability.

## Task 1: Install and inspect official CLI
Files: external user-local installation, archived receipt and selected plan findings.
Interfaces: official v0.4.3 osx-arm64 archive + published hash → executable and help/version output.
Expected: archive hash equals GitHub digest and published hash; executable runs on M1. Authentication is separate and must not be faked. Package command remains Windows-only for Electron; first publication remains web-based.

## Task 2: Store-only packaging and Windows notification identity
Files: store packaging scripts/config/template/assets, Windows reminder adaptation if required, tests/unit/storePackaging.test.ts and tests/unit/storeNotifications.test.ts.
Interfaces: package metadata + Store identity → deterministic Windows manifest, candidate filename/hash and isolated package-stage directory. Existing NSIS package remains configured identically except ordinary new source version if runtime changed.
Steps: Write meaningful identity/version/path/negative-input and actual notification behavior tests first; run RED. Implement minimal Store-only config/MakeAppx driver and preserve legacy Windows notification identity outside process.windowsStore; run GREEN and relevant reminder/storage tests, typecheck/build. Generate logos from approved existing icon only.
Expected: wrong identity/version or escaped output path rejected; manifest declares x64 full-trust only, correct app identity, no test credentials/signature in upload candidate. Existing ordinary package behavior remains covered.

## Task 3: Manual fork build chain and candidate verification
Files: .github/workflows/store-msix-candidate.yml, Windows package verifier/install fixture, release notes/evidence.
Interfaces: identical main/fork source SHA and tree → workflow_dispatch inputs → checked-out source → actual package manifest and payload hashes → artifact readback.
Steps: Bound manual workflow to private fork with read-only token and finite timeout; no auto push/full verify/publish/Store credentials. Focused new and affected tests; build app once; construct actual package with Windows SDK tools. Validate archive, architecture, manifest, assets and source/payload hashes. Attempt isolated sideload/install/update check only on disposable runner with explicit ownership; preserve failure and do not claim physical acceptance. Commit main [skip ci], synchronize exact SHA to fork, verify equality, dispatch one scoped run. Read back artifacts and report actual evidence; repair only demonstrated failures.
Expected: source mismatch fails before build; no upstream workflow runs; artifact is bound to exact frozen source. Missing physical/Store account/first submission conditions reported separately, never fabricated as PASS.

## Review focus
Source/identity/version mismatches, destructive output paths, implicit broad CI, credentials or submission side effects, Store AUMID and data virtualization, unsupported physical claims, cleanup of only owned test profiles. Fresh final review after implementation, then verify material fixes with targeted tests.
