# R6-08 分类与内容彻底删除
Spec: /Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline/Thoughtline第六轮修复优化.md#R6-08
Base: b4bab6b6d1486d910f58ebf75c2cd62224f4f065; approved main; candidate0.0.35. User approval governs no repeated permissions, targeted checks override skill full-suite defaults.
Global constraints: immutable034; protecteddefault; allmemberstates not filters; no partialcommit, save/IME/CAS/IO; staleowners/undo cannot revive; unrelated undo remains; backups retained; currentVPNnode unchanged. GUI/package sequential; only owned synthetic fixtures. No unrequested methodology/Skill review.
Review Focus: batch deletion of mixed stack members and deleted recovery metadata; unrelated undo snapshots carrying now-deleted classification/draft; stale/paused editor ownership across classificationReturn; confirmation object/contents identity; concurrent saves/failure; small-window list/footer/IME; exact package boundary.

## Task 1: pure transaction and preview
Interfaces: classificationDeletionPreview(snapshot,field,id) => existing/ideas/draft/counts/fingerprint; deleteClassificationContents(snapshot,field,id,expectedFingerprint) => Result<Snapshot>; undo sanitation uses same approved deletion, never raw resurrection.
Files: src/shared/classificationDeletion.ts, focused unit tests. Independent RED→GREEN for groups/tags across states, draft, protected/unknown, mixedstacks/recovery metadata, stalecontent, read-only, no otherdata damage. Expected: named relatedunit exit0 only.

## Task 2: guarded IPC and inline modal
Consumes task1; new bridge/preload management-only classificationDelete request, currentrevision/session + fingerprint, bounded writer queue, related edit refusal and success-only publication/undo sanitization. Renderer default migration preserved, explicit irreversible checkbox; expansion same modal six rows + draft, locale/material/adaptive list; relevant fingerprint changes disarm. Expected: types/build0, focused source RED→GREEN incl real UI, permissions/CAS/IO/queued save/undo/restart, no second window, normalquit; capture only key states.

## Task 3: final review and narrow release
Final fresh reviewer per executing-plans review rule; executor fixes important/critical via RED→GREEN only affected cases. Most capable available review model explicitly selected per skill. Freeze new source/version; narrow doubleplatform actual package/install migration/reinstall/uninstall retention; exactinputs/NSIS/compiledSHA/privateRelease; no duplicate CI. Expected: factual evidence passed, oldrelease unchanged, no physical acceptance inflation.

## Task 4: cleanup/documentation/operation report
CanonicalR6 +00/07/plan/audit/gates/report; ownprofile/duplicate cleanup withreceipts, preserveoldfailures/rollback/currentpersonalapps; docs-only skipci commits/push/readback; direct user steps + boundaries. Expected: cleanlocal/remoteHEADmatch, source/tag/packages separate, actualowner newfeature awaitsfeedback.
