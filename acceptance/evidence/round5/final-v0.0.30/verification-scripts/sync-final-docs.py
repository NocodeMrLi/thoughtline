# coding: utf-8
from pathlib import Path
import json
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.30'
release=json.loads((e/'release-verification.json').read_text());storage=json.loads((e/'actions-storage-cleanup.json').read_text());clean=json.loads((e/'mac-owned-cleanup.json').read_text());stage=json.loads((e/'mac-staging-cleanup.json').read_text())
assert all(x['passed'] for x in [release,storage,clean,stage])
source=release['source'];run=release['run'];rid=release['release']['id']
summary=f'''0.0.30（第五轮R5-13至R5-16）已完成双端技术验证、私有发布、文档同步与本轮自有垃圾清理。构建/tag源码 {source}；Windows完整运行 {run} success；Release {rid}，10份附件大小/SHA256读回一致。main后续文档提交不改变包来源。
Mac349单测通过、4项Windows专用跳过；Windows353全部通过，类型与构建通过。Mac实际DMG8套回归、Windows完整源/实际包/NSIS安装、重装、普通卸载保数据通过。两端源和实际包各36项设置/存储行为、16个名称聚焦场景，32项联系行为、24个布局场景；335构建输入一致，306份文本差异仅经过逐字节核验的LF/CRLF。
联系栏在设置三个页签底部，沿用原配色和形态，按双端字体与可用宽度自然排布；邮箱完整可读，复制成功/失败使用短暂小字。固定GitHub、mailto和复制动作的系统边界已验证，实际浏览器/邮件客户端、物理IME/DPI/多屏和个人手感仍独立确认。普通设置与草稿双向共存；备份自动检查点，迁移仅在实际操作时要求关闭新建，原输入/未保存设置/退出保护保持。日历更多菜单顺序为最近删除、标签与分组、存储与设置。
独立终审的托盘忙碌状态问题已按真实Tray红→绿补修，操作结束/取消/失败均及时刷新。首轮Windows启动未进入功能断言，原失败ZIP/日志保留；只增加观测，未放宽门禁，最终完整运行已通过。
本轮Mac {len(clean['candidatePaths'])}个自有临时路径均不存在，8份失败残留先归档校验再清理；早期退出未成功的进程按专有PID、启动路径及父进程核实后停止，没有按名称杀进程。挂载、空隔离目录及当前重复构建包已清理，真实App仍0.0.28，未覆盖个人数据。22个旧Release附件及本地0.0.22/23历史包保持。
Actions已删除本轮安装器副本和已归档失败UI产物，最新验收UI继续保留；当前{storage['remainingCount']}份约{storage['remainingBytes']/1048576:.1f}MiB，验证门禁、私有状态与预算保持。本月累计提醒不会因删除立即归零。
[操作报告](</Users/lihongwei/Desktop/晾念头 : Thoughtline/app/docs/releases/round5-v0.0.30-delivery.md>)；[私有安装包](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.30)。formalAcceptance/physicalAcceptance保持false，等待实际使用反馈。
'''
p=r/'docs/releases/round5-v0.0.30-delivery.md';text=p.read_text(encoding='utf-8');text+='\n发布与清理结果：\n\n'+summary;p.write_text(text,encoding='utf-8')
docs=Path('/Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline')
p=docs/'Thoughtline第五轮修复优化.md';s=p.read_text(encoding='utf-8');mark=s.index('## R5-13、R5-14：');s=s[:mark]+s[mark:].replace('- [ ]','- [x]');s+='\n### R5-13至R5-16最终结论（2026-10-13）\n\n'+summary;p.write_text(s,encoding='utf-8')
for name in ['03-晾念头Thoughtline项目方案.md','05-UI与特效交互设计契约.md']:
 p=docs/name;s=p.read_text(encoding='utf-8');mark=s.index('## 2026-10-13第五轮追加：');tail=s[mark:];tail=tail.replace('当前尚未实现或验证，不提前勾选通过。','0.0.30实现且双端源码/实际包技术验证通过；物理和用户验收另记。').replace('尚未实现或验证。','0.0.30双端技术验证通过。');s=s[:mark]+tail+'\n最终实现/验证/交付结论以第五轮文档R5-13至R5-16最终结论为准；构建/tag源码 '+source+'，私有Release '+str(rid)+'，真实安装与个人数据未覆盖。\n';p.write_text(s,encoding='utf-8')
p=r/'docs/releases/round5-r513-r516-plan.md';s=p.read_text(encoding='utf-8').replace('- [ ]','- [x]');s+='\n## 最终结果\n\n'+summary;p.write_text(s,encoding='utf-8')
p=r/'.planning/2026-10-12-round5-repair/task_plan.md';s=p.read_text(encoding='utf-8');mark=s.index('## Task 5 ');s=s[:mark]+s[mark:].replace('（进行中）','（完成）').replace('- [ ]','- [x]');p.write_text(s,encoding='utf-8')
for name in ['progress.md','findings.md']:
 p=r/'.planning/2026-10-12-round5-repair'/name
 with p.open('a',encoding='utf-8') as f:f.write('\nTask5收口：'+summary)
p=r/'acceptance/gates.json';g=json.loads(p.read_text());g.update(stage='ROUND5_V0_0_30_R513_R516_DUAL_VERIFIED_CLEANED_PRIVATE_PUBLICATION_VERIFIED_OWNER_PENDING',asOf='2026-10-13',lastCommittedSource=source,currentCandidateVersion='0.0.30')
g['round5']['R5_13_16']={'version':'0.0.30','source':source,'windowsRun':run,'releaseId':rid,'releaseUrl':release['release']['url'],'macUnitPassed':349,'macWindowsOnlySkipped':4,'windowsUnitPassed':353,'actualMacPackageSuites':8,'settingsChecksPerRuntime':36,'focusScenesPerRuntime':16,'contactChecksPerRuntime':32,'contactScenesPerRuntime':24,'sourceInputCount':335,'passed':True,'evidence':'evidence/round5/final-v0.0.30','report':'../docs/releases/round5-v0.0.30-delivery.md','physicalAcceptance':False,'formalAcceptance':False,'ownedMacPathsAbsent':len(clean['candidatePaths']),'privateReleaseAssetCount':10,'storageAfterBytes':storage['remainingBytes'],'storageAfterArtifactCount':storage['remainingCount'],'userApplicationAndDataUntouched':True};p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Fifth-round, product/UI contracts, plans and evidence gates synchronized')
