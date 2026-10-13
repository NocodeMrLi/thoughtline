from pathlib import Path
import json,hashlib,shutil
r=Path.cwd();e=r/'acceptance/evidence/round5/final-v0.0.31';d=Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r517/delivery/v0.0.31')
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
m=read(d/'mac-build-manifest.json');w=read(e/'windows-final-run.json');pair=read(e/'source-pair-proof.json')
assert w['conclusion']=='success' and m['actualMacBuildSource']==w['head_sha'] and pair['passed']
for name in ['mac-final-verification.json','mac-source-suites.json','mac-packaged-suites.json','windows-final-suites.json','windows-package-binding.json','mac-owned-cleanup.json']:assert read(e/name)['passed'],name
source=w['head_sha'];run=w['id'];attempt=w['run_attempt'];count=pair['count']
summary=f'0.0.31已通过双端技术验证。构建/tag源码 {source}；Windows完整运行 {run}，第{attempt}次执行成功。Mac356单测通过、4项Windows专用跳过；Windows360全部通过，类型与构建通过。Mac源码6套及实际DMG9套回归、Windows完整源码/实际包及NSIS安装、重装、普通卸载保数据验证通过。两端源和实际包各17项导出行为、8个中英浅深宽窄菜单场景通过；{count}份构建输入同源。'
p=r/'docs/releases/round5-v0.0.31-delivery.md';s=p.read_text();s=s.replace('状态：Mac源码通过，双端实际包验证进行中；尚未发布。',summary).replace('技术证据待最终双端结果回填。','Mac实际DMG源码/asar/签名摘要一致；DOCX经过独立ZIP/XML检查与macOS文本读取器回读。')
s+='\n早期Windows两次分别在旧自动整理初始窗口URL、仅标题详情自动保存等待处超时；原日志和ZIP均保留。后续诊断发现旧自动整理用例误用已回收的隐藏窗口，31秒确定性红→绿验证后改为从正常入口重开；不改生产或原功能断言/超时门槛。最终完整门禁结果另附。Mac最终DMG与九套已验证候选的asar和编译输出完全相同，并在最终DMG再次通过导出17项/8场景。\n\n[私有安装包](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.31)。main后续文档提交不改变安装包来源；真实安装与个人数据未覆盖。Mac本地临时签名、Windows未商业签名，延续现有交付方式。\n'
p.write_text(s);(d/'Validation-Guide.zh-CN.md').write_text(s)
for name in ['source-pair-proof.json','windows-final-suites.json','windows-package-binding.json','mac-final-verification.json','mac-package-binding.json']:shutil.copy2(e/name,d/name)
names=['build-manifest.json','mac-build-manifest.json','mac-signature-verification.json','source-pair-proof.json','Start-Thoughtline-Isolated-Mac.command','Start-Thoughtline-Isolated.ps1','Thoughtline-0.0.31-mac-arm64.dmg','Thoughtline-0.0.31-win-x64.exe','Validation-Guide.zh-CN.md']
rows=[{'name':n,'bytes':(d/n).stat().st_size,'sha256':hashlib.sha256((d/n).read_bytes()).hexdigest()} for n in sorted(names)]
p=d/'SHA256SUMS.txt';p.write_text(''.join(x['sha256']+'  '+x['name']+'\n' for x in rows));rows.append({'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()});(e/'release-upload-manifest.json').write_text(json.dumps(rows,indent=2))
(e/'release-notes.md').write_text('''Thoughtline 0.0.31：第五轮 R5-17 极简念头导出。

- 数据与备份 → 导出：仅“导出 TXT”“导出 DOCX”“备份数据”三个选项。
- 阅读文档包含分组、标签、名称和完整正文；中文、emoji、空行、同名与未命名内容保留。
- 导出全部有效念头，含已收起及已移除分类下的内容；草稿和最近删除继续由完整备份保存。
- 新建与设置共存，取消不生成文件，写入失败保留原文件；原JSON恢复备份兼容。

'''+summary+'''

源码、实际安装包和受控保存对话框边界已验证；物理设备、实际文件选择体验及Word/WPS排版另行确认。formalAcceptance/physicalAcceptance保持false。
升级前导出完整备份并正常退出旧版。Mac本地临时签名，Windows未商业签名；隔离启动器、来源清单、SHA256及操作验证报告随附。
''')
print('Prepared',len(rows),'release assets')
