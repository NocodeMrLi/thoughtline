from pathlib import Path
import json
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.31';read=lambda n:json.loads((e/n).read_text());rel=read('release-verification.json');storage=read('actions-storage-cleanup.json');clean=read('mac-owned-cleanup.json');stage=read('mac-staging-cleanup.json');pair=read('source-pair-proof.json')
assert all(x['passed'] for x in [rel,storage,clean,stage,pair])
src=rel['source'];run=rel['run'];rid=rel['release']['id'];url=rel['release']['url'];count=pair['count']
summary=f'''0.0.31（第五轮R5-17）已完成极简导出、双端技术验证、私有发布、文档同步及本轮自有垃圾清理。构建/tag源码 {src}；Windows完整运行 {run} success；Release {rid}，10份附件大小/SHA256读回一致。main后续文档提交不改变安装包源码。
数据与备份页仅一个“导出”入口，三行小菜单为导出TXT、导出DOCX、备份数据。文档依次含分组、标签、名称、完整正文；按分组归集，含已收起及已移除分类下的有效内容，不混入草稿或最近删除。原JSON完整恢复备份保持，未增加范围控件或新页签。
Mac356单测通过、4项Windows专用跳过；Windows360全部通过，类型与构建通过。Mac源码6套、实际DMG9套回归通过，最后仅增加测试诊断后重新打包，asar/所有编译输出与已验证包完全一致，最终DMG再通过17项导出行为及8个中英浅深宽窄场景。Windows完整源/实际包及NSIS安装、重装、普通卸载保数据通过，源/实际包各17项导出行为及8个菜单场景；{count}份构建输入同源。DOCX独立ZIP/XML及Mac文本读取器回读通过。
早期Windows存在初始URL等待、仅标题详情自动保存等待超时，原日志/ZIP保留。后续诊断明确旧自动整理用例误用已按30秒规则回收的隐藏窗口；Mac等待31秒稳定复现相同错误，再通过正常入口重开窗口后7项原断言全部通过。仅修测试生命周期并补诊断，不改产品交互或超时门槛；其余未独立复现的超时不宣称为产品bug已修复。
Mac {len(clean['candidatePaths'])}个本轮隔离路径确认不存在；失败残留先校验归档再清理。测试进程按自有PID/路径核实后退出或停止，最终挂载/隔离启动空目录/重复构建包已清理。真实应用及个人数据未动，旧Release和历史安装包保留。
Actions安装器副本与三份本轮已归档失败UI已清理，最新验收UI仍保留；当前{storage['remainingCount']}份/{storage['remainingBytes']}bytes。原验证门禁、仓库私有状态和预算保持，累计账期用量不会因清理立即归零。
[操作验证报告](</Users/lihongwei/Desktop/晾念头 : Thoughtline/app/docs/releases/round5-v0.0.31-delivery.md>)；[私有安装包]({url})。原生自动验证与受控系统保存边界已完成，个人设备文件选择体验、Word/WPS排版和物理IME/DPI/多屏仍独立确认，formalAcceptance/physicalAcceptance保持false。
'''
notes=Path('/Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline')
p=notes/'Thoughtline第五轮修复优化.md';s=p.read_text();s=s.replace('当前状态：开始实施，尚未验证或发布。','当前状态：0.0.31双端技术验证及私有发布完成，结果见下方R5-17最终结论。');s+='\n## R5-17 最终结论（2026-10-13）\n\n'+summary;p.write_text(s)
for name in ['03-晾念头Thoughtline项目方案.md','05-UI与特效交互设计契约.md']:
 p=notes/name;s=p.read_text().replace('当前实施中，未宣称验证或发布。','0.0.31已实现并通过双端技术验证、私有发布及自有清理；具体证据及物理边界见第五轮R5-17最终结论。');p.write_text(s)
p=r/'docs/releases/round5-r517-plan.md';s=p.read_text().replace('当前状态：开始实施，尚未验证或发布。','当前状态：已完成。').replace('候选0.0.31，待测试通过后冻结源与包、私有交付、同步第五轮和主文。','0.0.31源码与双端包已冻结并私有交付，第五轮及主文已同步。');p.write_text(s+'\n## 最终结果\n\n'+summary)
p=r/'docs/releases/round5-v0.0.31-delivery.md';p.write_text(p.read_text()+'\n## 发布与清理结果\n\n'+summary)
p=r/'.planning/2026-10-12-round5-repair/task_plan.md';s=p.read_text();a=s.index('## Task 6 ');s=s[:a]+s[a:].replace('（执行中）','（完成）').replace('- [ ]','- [x]');p.write_text(s)
for n in ['progress.md','findings.md']:
 p=r/'.planning/2026-10-12-round5-repair'/n;p.write_text(p.read_text()+'\nTask6收口：'+summary)
p=r/'acceptance/gates.json';g=json.loads(p.read_text());g.update(stage='ROUND5_V0_0_31_R517_DUAL_VERIFIED_CLEANED_PRIVATE_PUBLICATION_VERIFIED_OWNER_PENDING',asOf='2026-10-13',lastCommittedSource=src,currentCandidateVersion='0.0.31');g['round5']['R5_17']={'version':'0.0.31','source':src,'windowsRun':run,'releaseId':rid,'releaseUrl':url,'macUnitPassed':356,'macWindowsOnlySkipped':4,'windowsUnitPassed':360,'actualMacPackageSuites':9,'exportChecksPerRuntime':17,'exportScenesPerRuntime':8,'sourceInputCount':count,'passed':True,'evidence':'evidence/round5/final-v0.0.31','report':'../docs/releases/round5-v0.0.31-delivery.md','physicalAcceptance':False,'formalAcceptance':False,'ownedMacPathsAbsent':len(clean['candidatePaths']),'privateReleaseAssetCount':10,'storageAfterBytes':storage['remainingBytes'],'storageAfterArtifactCount':storage['remainingCount'],'userApplicationAndDataUntouched':True};p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n')
print('Synced R5-17 product/UI/plan/gates/report')
