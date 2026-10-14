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

R608 final independent reviewer gpt-6-astra:0Critical/2Important/0Minor, declined empty. One executor fix pass: actual null/collision positions and unrelated null-position move undo native3 RED→GREEN; page-flip derived activeTag also RED→GREEN. Capture visible and hidden positions before deletion/prior undo sanitation; positionTargets declares genuine move/arrange effects, semantic clip comparison excludes incidental position and derived current tag. Final71 relatedunit9files/types/build pass; mutation/restart and full relevant IPC guard rerun after changed main code GREEN. Source-only positions fixture kept separate from actual-package UI. No second reviewer/no full verify.

### R6-08 最终技术交付：0.0.35（2026-10-14）

已按批准方案完成默认保留迁移、新增彻底删除、同窗查看内容清单与确认保护。分组按所属组、标签按跨分组全部同标签，涵盖挂绳/日历/容量等待/最近删除/关联草稿；混合叠放只移除匹配成员，保留其他原文、日期、位置。相关数据/成员关系改变必须重新勾选；默认分类受保护，旧会话/旧撤销不能复活，已有备份保留。空分类保持简洁流程。

Mac/Windows各71项相关单测、类型和构建通过。双端实际UI均核中英×浅深×740/350八组合，同窗展开/收起不改变原生尺寸，350×360清单保留可读内容及底部确认/操作。取消、跨组标签删除、分组删除、混叠放其他成员、无关单条撤销、正常退出及重启持久结果通过。源码协议专用夹具核授权/session/CAS、受控保存顺序、ENOSPC无部分发布、相关编辑、已移除分类、草稿/提醒、恢复关系、相关撤销失效及旧写入拒绝。实际null/碰撞位置及无关move三场景和翻页/撤销边界RED→GREEN。没有重跑完整产品测试或旧六项/无关UI，不把它们记为本轮新PASS。

全新独立审查0Critical/2Important/0Minor，两项由执行者完成一轮定向RED→GREEN修复；没有追加独立复审声明。真实IME、多屏/DPI、焦点、系统通知和你设备的手感未具备物理条件，新增功能负责人实际验收待反馈，formalAcceptance/physicalAcceptance仍false。0.0.34“没问题”按本人实际反馈范围保留。

源码/tag3ac0091652b8141ce0c137bc5c2d282273c05771；378项冻结输入一致。Windows38554027989 success/job115818599413，实际NSIS安装/重装/普通卸载保数据通过，墙钟300秒不等于计费分钟。最终NSIS全部out与manifest一致；双端main/preload/Renderer JS字节一致，CSS/HTML仅精确核实行尾/两项派生名称差异；Mac原生插件签名和LINKEDIT容量差异单独验证并记录，不能概称所有平台产物逐字节一致。后续文档提交不是包源码。

[私有正式0.0.35下载](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.35)：Release412634633，published_at2026-10-14T11:28:07Z，draft=false/prerelease=false，10附件大小/服务端SHA256逐项一致；0.0.34十附件ID/大小/摘要保持不变。MacDMG SHA256：6bd39b15d7190182fdb904d595b126f78ddf2ab57300f8a6a70daa52626f04a8；WindowsNSIS SHA256：5a6d4131cade0c1ec2fef1db867d4a8901256a94efe959a439347ce7ea8225ca。

照操作：安装0.0.35→日历更多→分组与标签→删除；默认保留迁移。选择“彻底删除分组/标签及内容”→查看内容（同窗展开，更多内部滚动）→核数量/草稿→勾不可撤销→彻底删除。标签范围含各分组；删除不进入最近删除，已有备份保留。取消不改内容，其他分类/叠放成员位置不移动，重启保持。完整[可照操作报告](</Users/lihongwei/Desktop/晾念头 : Thoughtline/app/docs/releases/round6-v0.0.35-delivery.md>)。

只派发一次17分钟上限的窄Windows任务。构建前后账户接口已报告Actions净额0，预算接口404/当前剩余分钟未知；邮件余190只是旧快照。安装包下载第一次43,204,608/116,100,012字节超时，严格续传同一服务端摘要的artifact并核SHA/CRC，不重发CI、不改梯子节点。发布脚本旧ID被tag校验拦下、未改旧版，校正准确035ID后正常发布；原记录保留，不改写PASS。

清理1188215529逻辑字节（约1.11GiB）确认归属的重复App/包、提取副本与重复截图，22个本地合成profile均不存在，保留7张关键PNG（含一次坏紧凑布局样本）、失败/profile归档、最新成功CI ZIP、正式双端035与034/33/32/31回滚、冻结asar/native和依赖。个人0.0.28 App68573、未知源码Electron95997及个人旧DMG挂载保持，不按名称杀进程、不清未知对象。

任务1/2/3技术门已完成；任务4清理已完成，最终文档push/readback待此提交后读回。附件guide为发布时不可变文本，完整最新操作报告在仓库内。
