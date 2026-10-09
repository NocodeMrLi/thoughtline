# 双端 .6 私有预发布与 main 收敛

2026-10-09（北京时间）。双端私有预发布已发布，main 已整合，远端分支清理完成；物理验收仍未完成。用户明确授权发布双端、收敛 main 和删除确认无用分支，保持仓库 private，不替换用户安装版或真实数据。

## 来源和复用

Windows x64：实际构建 `aa23b210ce26de956f88c48851dc1681ab233f6b`，run37893774452/artifact11598913007，SHA256 `545bac65d545578653ca031861b98080d4e6ea46c94db51cd493565734289266`。已有独立最终QA、实际NSIS/数据保持及App/installer/uninstaller PE7帧通过。

Mac arm64：实际构建 `723356385af5518cddae65d2ae023707a0c804b6`，SHA256 `dfe18f6ee4cb64df5cd61ed8268b12e534382636f2955d5f2810a7bcb57296c6`。273个缓存Electron44.7.0文件与依赖逐字节一致后，用builder原生electronDist离线构建；未改变生产脚本或配置。App和DMG内App strict codesign、盘内App隔离编辑/取消/重启/独立草稿、全部out/assets及资源ICNS通过。

两包均 **0.0.16-preview.6**。[完整Git输入一致性证据](evidence/release-0.0.16-preview.6/release-input-identity.json)覆盖src、assets、scripts、tests、package/lock、licenses、第三方声明、编译测试配置、.gitattributes和工作流；不是只比版本号。最终发布准备提交只改文档/证据；生成清单时再次比较最终commit与两个构建source的完整输入向量，任一差异拒绝复用。release-manifest明确tag commit与各实际build source，不将文档HEAD冒称原始打包SHA。

## 整合与分支原则

旧main `5f9f29302e8fe61edda5680b91b3753986f4c516` 为候选祖先。有效功能已在候选链中；另合入icon/旧.15、被替代Composer和草稿恢复的独立QA历史，未恢复旧界面或旧资产。规范源JPEG保留，完全相同的历史重复JPEG排除；没有重画批准图标。G7七项独有实验未集成，保留分支。

[审查](evidence/release-0.0.16-preview.6/branch-audit-before.json)保存准确tip、独有改动与各工作树状态；[清理草案](../docs/releases/preview6-branch-cleanup-plan.json)列11条已完整可达分支。仅在main/发布验证通过后重查开放PR、活跃使用和tip，以删除lease防并发变化；所有原工作树和本地checked-out branch保留，不靠远端reflog恢复。恢复依据为main可达的精确tip。

## 实际验证边界

102Macunit/4Windows-only跳过、106Windowsunit、type/build；Mac20composition和4delayed-submit受控检查，DMG内App实际隔离保存重启；Windows真实runner安装/同版本重装/普通卸载保持合成snapshot/bak/marker，单实例/正常设置保存退出，ASAR及PE图标通过。当前CI无Windows Composer CtrlEnter端到端，物理IME/焦点/穿透/Agent/G7、多屏与旧版升级回滚仍待用户；formalAcceptance=false。

Macad-hoc签名，无Developer ID/公证；WindowsNotSigned。相同appId可覆盖安装身份，先退出并完整备份默认数据；普通卸载保持不等于显式删除参数也保持。未ACK尾部/未提交编辑/关机或强退不能承诺零丢失。详细操作见[发布说明](../docs/releases/preview6-notes.md)与[Windows清单](../docs/WINDOWS-ACCEPTANCE-V11-20261009.md)。

## 发布完成与最终交接

私有仓库 NocodeMrLi/thoughtline 的预发布 **v0.0.16-preview.6** 已于北京时间2026-10-09 15:54发布，release ID **407667273**；draft=false、prerelease=true，仓库保持private。annotated tag解析到main发布提交 `b89481926753377c66afe0bdf2ef8dd5d453bbb7`。最终收尾提交只补文档/证据，最终main SHA由本阶段根目录 RELEASE-PROGRESS.md 和最终回复记录；tag保持不可变。两个实际打包source与tag的完整生产/构建输入一致。

[服务端验收](evidence/release-0.0.16-preview.6/release-server-verification.json)确认全部7项资产 uploaded、size/digest精确匹配本地：两端安装包、合并SHA256SUMS、双端build manifest、隔离PowerShell启动器、合并release-manifest。合并manifest本地路径：`/Users/lihongwei/Documents/Codex/2026-10-09/task-7/releases/v0.0.16-preview.6/release-manifest.json`；Windows installer仍在原delivery路径，Mac DMG在releases路径，不重复拷贝安装包。

main自动触发的 Windows CI **37900797155** / job113722633915 已success/completed；106unit、type/build、NSIS、源/编译产物绑定、PE图标、隔离入口解析、实际安装/同版本重装/普通卸载保持均通过。artifact **11602427835**，ZIP digest `0fff1f6504510835abf58f3b35145e82ed4da65a956981ab8fb84ed673c96d59`，到期2026-11-08。[完整日志](evidence/release-0.0.16-preview.6/main-ci.log)、[步骤](evidence/release-0.0.16-preview.6/main-ci-final.json)和[产物元数据](evidence/release-0.0.16-preview.6/main-ci-artifacts.json)已保存；此main重建用于收敛验证，发布Windows仍复用已独立QA的545bac产物，不把两个installer或artifact ZIP hash混为一谈。

[11条远端分支清理receipt](evidence/release-0.0.16-preview.6/branch-cleanup-receipt.json)和[删除日志](evidence/release-0.0.16-preview.6/branch-delete.log)记录准确tip、main祖先恢复和atomic expected-tip deletion lease。删除前成功connector核实无开放PR、其他相关线程idle、原工作树clean；CLI两次PR TLS超时已用connector成功读补齐，未按超时推断无PR。远端仅保留main与`codex/thoughtline-g7-public-probe-20261009`。所有本地分支/附属工作树保留，原开发区本地main仍是旧5f9f293，未reset/checkout/覆盖；后续在停用原开发进程并确认clean后普通fast-forward同步main。

[清理记录](evidence/release-0.0.16-preview.6/release-cleanup.json)：隔离树out/dist冗余构建已清理，测试假数据/自有App进程已退出，DMG卸载并删空挂载目录；保留全部最终资产、借用依赖、旧.15/.5包和原安装/开发进程，不触碰真实笔记。项目笔记36与00/07入口追加同步，receipt随提交保存。

独立最终QA通过报告原样保留于[Windows独立报告](evidence/windows-v11/independent-qa/INDEPENDENT-WINDOWS-DELIVERY-QA.md)。前两次.6失败37892900652（CRLF）/37893261320（PE尺寸0代表256）及修正、旧.5负例均在windows-v11证据目录，没有删失败记录或放宽payload核验。App FileVersion/runtime为.6，App数值ProductVersion为0.0.16.0；installer字符串.6、固定数值0.0.16.0，这是已检查的资源差异。

没有当前发布阻挡。此处“发布完成”仅指构建、来源、私有资产和仓库收口完成；**formalAcceptance=false**。CtrlEnter只有逻辑单测，真实IME、焦点、热键/穿透、多屏、Agent/G7、旧版升级/回滚仍待Windows实机；签名/公证条件与备份要求保持上文。

[补充完整非文档输入比较](evidence/release-0.0.16-preview.6/complete-nondocument-input-identity.json)覆盖所有tracked非文档文件（含electron.vite.config.ts、tsconfig.json、gitignore）和交付PowerShell入口，双端来源与tag逐项一致；排除仅历史文档/acceptance证据。
