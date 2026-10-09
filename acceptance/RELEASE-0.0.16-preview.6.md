# 双端 .6 私有预发布与 main 收敛

2026-10-09（北京时间）。当前阶段准备发布；远端操作结果会补在本文，未发布时不提前宣称成功。用户明确授权发布双端、收敛 main 和删除确认无用分支，保持仓库 private，不替换用户安装版或真实数据。

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
