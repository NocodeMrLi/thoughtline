# Thoughtline 0.0.17-preview.2 第一轮修复交付

<!-- FINAL_RELEASE_STATE_START -->
同源双端包及适用自动检查已通过；[新的私有测试预发布](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2) 已发布，15项资产名称／大小／服务器摘要全部一致。release ID408004525，draft=false、prerelease=true、仓库PRIVATE。用户独立验收未宣称通过。
<!-- FINAL_RELEASE_STATE_END -->

## 来源与版本

- 私有仓库 `NocodeMrLi/thoughtline`，main开发，保留G7实验与其他工作树。
- 源码冻结／tag目标／实际Mac与Windows构建来源：`ca2137b1c7af1458643ac2988c6cc4ed9ce15e35`。
- 最终测试版本／tag：`0.0.17-preview.2`／`v0.0.17-preview.2`。旧 `v0.0.16-preview.6` 未替换。
- 206项生产、构建、测试及交付输入的Git mode/blob向量SHA256：`099ce1eb5e4b56c1d377c944d953f3c70f1a83b1e29fefe73d7baa84b99a4200`。两端逐项相同；LF／CRLF导致原工作区字节向量不同，清单分别记录。
- 后续文档／证据提交不改变源码tag或安装包；最终main文档提交另见项目37篇交付记录及Git。

## 包与隔离入口

目录：`/Users/lihongwei/Documents/Codex/2026-10-09/thoughtline-round1-repair/delivery/v0.0.17-preview.2`。

| 文件 | 目标与大小 | SHA256 |
|---|---|---|
| Thoughtline-0.0.17-preview.2-mac-arm64.dmg | macOS arm64；133377669 bytes | `9ef50f9804edeaf4c3b3a15713037047e403372de98d40fba27110465edbdd45` |
| Thoughtline-0.0.17-preview.2-win-x64.exe | Windows x64 App／NSIS；113089690 bytes | `1ccc1e4badd2ea8db7bea3da3b5fa563fa294234f9181bee93ff7e6d50e2d3d5` |

Mac包内asar SHA：`dfdfb1f194fcdd7d6bcaa9270130d26511859091c97354b8fc4b9b9ae6308301`。Mac为ad-hoc完整资源签名，非Developer ID／公证；Windows App与安装器NotSigned。NSIS自身PE是32位bootstrapper（0x14c），安装后App实测x64。

Mac入口 `Start-Thoughtline-Isolated-Mac.command` 由冻结生成器输出后按GitHub文件名约束使用ASCII交付别名，字节不变，SHA `ca743d321f035f487d92c2ec00cd1f71ce75d65c512199608447f6728cab090c`。先用 `--check-only` 核对固定DMG／asar／版本／签名；默认通过正常系统打开流程运行只读DMG内App，并使用交付目录内独立数据。固定路径要求DMG及入口位于上述目录；不自动安装或替换原App。源码模板中的中文名是生成时名称，正式交付按本页ASCII名。

Windows入口 `Start-Thoughtline-Isolated.ps1` 在独立测试环境中核对已安装App严格版本，`-CheckOnly` 不建数据目录／不启动。安装器应用身份可替换旧安装，不能将数据隔离误当并排安装。不得绕过Gatekeeper、SmartScreen、SAC或企业策略；受阻保留原提示及未测范围。

发布资产与`SHA256SUMS`一一对应：15资产、14校验目标；包含双端包、blockmap、两种入口、构建／签名／安装／图标清单及来源向量。支持清单一并发布，下载后无需忽略缺失项。旧提案和GitHub中文名清洗过程保留为证据。

## 实现及测试

11项逐项状态见 [本轮记录](../docs/ROUND1-REPAIR.md)：分组长按即时删除；三类拖动与拆合；源text/plain和显式复制；即时翻页；全绳空位；原地自动保存及迟到回执保护；收起与最近删除；窗口拖动／材质降级；详情图标；念头日历、等比双向缩放与批准Logo红夹子；目录迁移与独立备份。

Mac macOS15.3.1 arm64／Electron44.7.0：184通过、4Windows专属跳过，类型／构建通过；最终9串行源Electron流程通过。实际只读DMG App的6项检查全部通过，含schema2迁移、自动保存及关窗flush、重启全文／元数据／草稿、日历搜索／删除恢复、独立备份逐文件SHA、备份恢复两次实际重启。构建App与DMG内App严格签名和206输入后验通过。

Windows [最终CI37943540735](https://github.com/NocodeMrLi/thoughtline/actions/runs/37943540735) 同一ca2137b：188／188单测、类型／构建、10源Electron交互、NSIS安装／重装／卸载数据保全、旧schema2原字节备份／重启、实际打包输出及批准图标校验通过。runner win32 x64／10.0.26100；7夹具记录独立host字段，3夹具由同run及Windows路径定位，不伪补字段。源UI artifact内两份旧Mac根文件被明确排除，不作为Windows证据。

来源／验收／失败／清理证据见 `evidence/round1/p6-delivery-local/`、`final-fix-report.md`、`final-scoped-rereview.md`。9a来源首个Mac包在测试对话框上下文失败，部分检查通过不当成整包通过；限定一行harness修复后双端按新来源重建，完整包验收才通过。全部原始红例、错误probe与失败日志保留。

## 未测与回滚

物理Mac／Windows输入法、DPI、多屏、焦点／原生窗口拖动、辅助设置、自然动效帧率与iPhone并排手感、三个真实接收端均未测。微信4.1.13.65成功、QQ豆包间歇、WorkBuddy5.7.6持续失败仍是用户反馈；不能宣称已修好或不支持。真实矩阵见 [拖出验收](ROUND1-DRAG-MATRIX.md)。不自动写剪贴板／全局粘贴／Enter／发送，不向真实会话发送测试内容。

schema1／2首次写3前保原字节；创建日冻结，编辑不改记录日期；迁移校验后才切换且保旧副本。独立备份实际恢复已测，手动恢复与降级步骤见 [数据安全](../docs/ROUND1-DATA-SAFETY.md)。旧preview6不能直接读schema3；升级前备份缺升级后的修改，不承诺无损降级。真实磁盘拔插、满盘和断电未作为物理测试通过。

测试垃圾仅清本轮自有目录／进程／重复构建与下载，先保存并正常退出再核PID/stat。最终包、必要截图／日志／哈希／失败记录／旧回滚包保留；原运行程序、真实数据／安装、依赖缓存、out、G7和其他工作树保留。最终清理自有重复副本696785896逻辑字节，逐路径 `evidence/round1/p6-delivery-local/cleanup-after-release-ca2137b.json`。控制器另只读核118条可定位Mac临时收据、517记录PID：目录均ENOENT／PID均ESRCH；92条历史记录缺目录不能独立stat，旧空JSON失败仍保留，见 `evidence/round1/controller-final-cleanup-audit.json`。本轮SDD工作区完整压缩留存后仅清自身scratch，索引 `evidence/round1/sdd-records-index.md`。

下一轮按 [独立QA清单](ROUND1-INDEPENDENT-QA.md) 提交优先级、复现步骤、预期／实际与证据，回到当前项目继续修复。**formalAcceptance=false**。

发布后元数据：release-manifest SHA `78e7f1a9cb97638c803dbf0af376b83b4e7afb7ec689e92d306eb4c648849783`；SHA256SUMS SHA `bf61da6e19ec344e067a8759e75690ded4576af2a990d75f790497ff3f889599`。证据 `evidence/round1/p6-delivery-local/release-published-ca2137b.json` 与 `release-tag-ca2137b.json`。
