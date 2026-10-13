# coding: utf-8
from pathlib import Path
import json, hashlib, shutil
r = Path.cwd(); e = r/'acceptance/evidence/round5/final-v0.0.30'
d = Path('/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r513-r516/delivery/v0.0.30')
mac = json.loads((d/'mac-build-manifest.json').read_text(encoding='utf-8'))
win = json.loads((e/'windows-final-run.json').read_text(encoding='utf-8'))
assert win['conclusion']=='success' and mac['actualMacBuildSource']==win['head_sha']
assert json.loads((e/'windows-final-suites.json').read_text())['passed']
assert json.loads((e/'windows-package-binding.json').read_text())['passed']
source = win['head_sha']; run = win['id']
guide = (r/'docs/releases/round5-v0.0.30-delivery.md').read_text(encoding='utf-8')
start=guide.index('状态：'); end=guide.index('\n\n',start)
guide=guide[:start]+f'0.0.30已通过双端技术验证。构建/tag源码 {source}；Windows完整运行 {run} success。Mac349单测通过、4项Windows专用跳过；Windows353全部通过；类型与构建通过。Mac实际DMG8套回归和Windows完整源/实际包/NSIS验证通过。'+guide[end:]
guide+='\n335份构建输入对象与模式一致；两端分别通过36项设置/存储行为与16个名称聚焦场景、32项联系行为与24个布局场景。联系栏正常/忙碌文字及既有按钮/提示在受控材质下对比度均至少4.5:1。官方GitHub图标原样使用，来源与声明已留档。\n\n[私有安装包](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.30)；[本地安装包](</Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r513-r516/delivery/v0.0.30>)。main后续文档提交不改变包来源。\n'
(r/'docs/releases/round5-v0.0.30-delivery.md').write_text(guide,encoding='utf-8')
(d/'Validation-Guide.zh-CN.md').write_text(guide,encoding='utf-8')
for name in ['source-pair-proof.json','windows-final-suites.json','windows-package-binding.json']:
 shutil.copy2(e/name,d/name)
names=['build-manifest.json','mac-build-manifest.json','mac-signature-verification.json','source-pair-proof.json','Start-Thoughtline-Isolated-Mac.command','Start-Thoughtline-Isolated.ps1','Thoughtline-0.0.30-mac-arm64.dmg','Thoughtline-0.0.30-win-x64.exe','Validation-Guide.zh-CN.md']
rows=[]
for name in sorted(names):
 p=d/name; rows.append({'name':name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(d/'SHA256SUMS.txt').write_text(''.join(x['sha256']+'  '+x['name']+'\n' for x in rows))
p=d/'SHA256SUMS.txt'; rows.append({'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(e/'release-upload-manifest.json').write_text(json.dumps(rows,indent=2))
notes=f'''Thoughtline 0.0.30：第五轮R5-13至R5-16。

- 修复新建标签/分组名称输入框四边聚焦描边。
- 普通设置与新建双向共存；备份自动保存草稿检查点，迁移保留专门保护。
- 设置三个页签底部增加GitHub NocodeMrLi、反馈邮箱lhw4553@126.com与复制入口。
- 日历更多菜单按最近删除、标签与分组、存储与设置排列。
- 修复设置/存储结束后的托盘可用状态刷新。

Mac349+4专用跳过；Windows353全过；双端源码/实际包及NSIS安装、重装、普通卸载保数据通过。Mac实际DMG8套回归通过。官方原样图标、固定外部入口与邮箱复制均以受控系统边界验证。

构建源码/tag：{source}；完整Windows运行：{run}。335构建输入同源；物理IME/DPI/多屏、实际邮件客户端和用户手感独立确认，formal/physicalAcceptance保持false。

升级前导出独立备份并正常退出旧版。Mac为本地临时签名，Windows未商业签名。安装包、隔离启动器、来源/摘要及可照着操作的Validation-Guide随附。
'''
(e/'release-notes.md').write_text(notes,encoding='utf-8')
print('Concrete dual-platform release prepared:',len(rows),'assets')
