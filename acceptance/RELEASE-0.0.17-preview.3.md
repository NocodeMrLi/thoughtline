# v0.0.17-preview.3 同源双端测试交付

## 当前交付：私有 preview.3 已发布（2026-10-10）

**开发与受控交付完成，独立实体验收待进行。** [下载 v0.0.17-preview.3](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.3)，私有仓库保持 PRIVATE。发布 ID408155486，发布时间2026-10-09T18:56:29Z；新 tag、实际 Mac／Windows 包和清单均绑定冻结源码 `01017c9525ac971b6e97461ef2910140944eda19`。后续 README、证据和文档提交不是安装包源码。

| 平台 | 安装包 | 字节 | SHA256 |
|---|---|---:|---|
| macOS arm64 | Thoughtline-0.0.17-preview.3-mac-arm64.dmg | 133417660 | `4799af1772eff9d013942d207c6235cce6a239ef89f3a2910994ef2ff5758a3d` |
| Windows x64 | Thoughtline-0.0.17-preview.3-win-x64.exe | 113101943 | `68c6f4f1f35a5ded1c8d1a04e3c063c4d372fd003fba73ceaa4e77c7921da235` |

本地目录：`/Users/lihongwei/Documents/Codex/2026-10-09/thoughtline-round1-repair/delivery/v0.0.17-preview.3`。完整24文件，23项 SHA256SUMS、22项清单非自身哈希已回读；发布前真实下载证明、发布后全部附件 ID／大小／digest、PRIVATE、新tag及旧preview.2／preview.6未改均核对。227项规范输入 SHA256 `72314079c3dbfb77ef813a5d4c852e9eb46fe2ab85d1b45e671acaedf49242f9`；Mac原始向量 `5a030846d935c3b6d38d690b76a5ff0a14d654fd2a62b5f152f0844bfa492431`，Windows原始向量 `315b609c42c0c9a219c94e66da2a302a03250d1d4fd23ccd2852bcb671db3736`。全部227 mode/blob及各端实际捕获对应；未将后续文档 HEAD 冒作构建来源。

### 方案／实施状态

原第一轮11项修复已在preview.2实施；preview.3加入中英全界面、首层中/EN与太阳/月亮滑动胶囊、跟随系统、独立顺序偏好保存。新建／展开／日历右上角直接可见；常驻主界面仍只有绳、夹子、纸张。项目叉号即时删除，完成和退出都不恢复；未分组不可删，念头保留，整理撤销不复活已删分组。日历使用获认可Logo红夹子，日/月/年进入与返回保留可打断短缩放，纸张薄、柔和、哑光。

双端已实现协调的日夜配色和现有Mac vibrancy／Windows acrylic及不透明降级；进一步玻璃打磨仍属独立评估，不冒称原生Liquid Glass，不把纸做成玻璃。README七份语言描述及preview徽章已更新为真实中英功能；七种README语言不等于七种应用语言。用户要求宣传展示图／GIF完工并独立验证后再制作，本次保持图像字节。

### 测试证据

Mac15.3.1／Darwin24.3.0 arm64、Node24.19／Electron44.7：226单测通过、4Windows专用跳过，类型／构建通过；源主外观20＋修复11项；实际挂载包6项数据检查（含完整备份恢复后两次重启）＋3项外观检查。新真实DMG及生成启动器搬到含空格、中文、单引号目录，从不同cwd检查相邻DMG、缺失／损坏和profile符号链接：正常0，拒收1；原生产包可用时也不会回退误用它。

Windows hosted Server2025 build26100 x64：[CI37974164754 attempt1](https://github.com/NocodeMrLi/thoughtline/actions/runs/37974164754)成功，冻结源一致，230单测、类型／构建、源20＋11及原源流程通过；实际NSIS安装schema2／保存／备份／重启、实际外观3项、同版本重装和普通卸载保数据通过。此CI不能替代Windows实机。Mac严格ad-hoc、未Developer ID／公证；Windows安装器及App未签名，系统安全保护未关闭。

源码唯一终审修复限定复审、CRLF夹具复审、启动器复审及最终真实双包消费复审均通过，剩0Critical／0Important／1非阻断Minor（Windows DEP0190，来源未证明，不隐藏告警）。最终消费者复审后的四份元数据已实际上传／下载比对，再发布。证据： [新双包报告](evidence/appearance/task2-final-rebuild-01017c9/task-2-report-copy.md)、[最终消费复审](evidence/appearance/controller-final/task-2-final-consumer-review.md)、[发布核对](evidence/appearance/controller-final/controller-final-publication-audit.json)、[清理清单](evidence/appearance/controller-final/controller-own-clone-cleanup-receipt.json)。

最后本轮Mac受控测试64个自建进程（63 App＋1监督器）和7个profile已退出／清理；自建临时构建目录18555条记录逐项归档哈希后清理，未发送信号。原PID30628仍在，现有安装、真实数据、原out／依赖／缓存及另外11工作树受保护。此前失败与两例被迫清理的启动测试记录保留，不能概括所有历史为正常退出。仅清理本轮自建重复文件；不清空废纸篓。

### 剩余问题／独立测试

真实Mac与Windows输入法、100%／125%／150%DPI、多屏／断开副屏、焦点、窗口拖动、系统辅助设置和材质／动画手感待分别验证。微信4.1.13.65成功、QQ浏览器豆包间歇、WorkBuddy5.7.6持续失败仍是用户反馈，真实接收框重复外拖独立未测；Windows版本、QQ浏览器版本和起拖点未知。不得宣布WorkBuddy不支持或已修复，不自动发送、覆盖草稿、抢焦点或失败后改剪贴板。

独立测试请用完整同版目录和隔离入口，先看实际QA指南。Mac由`/bin/zsh ./Start-Thoughtline-Isolated-Mac.command --check-only`核验，再去掉参数启动；下载权限位不作为前提。Windows相同App标识安装器可能覆盖已有安装，应在独立测试环境操作。按[增量QA表](LOCALE-APPEARANCE-INDEPENDENT-QA.md)及[原轮QA表](ROUND1-INDEPENDENT-QA.md)，报告优先级、条件、步骤、预期／实际、证据和连续测试成功率；保留所有失败。

schema3、新profile preferences.json与念头备份分开、迁移／恢复／回滚限制见[数据安全](../docs/ROUND1-DATA-SAFETY.md)。当前无一键备份恢复按钮；preview.2仍支持schema3但不消费新界面偏好，preview.6只可在独立目录用升级前备份验证，其不包含升级后修改。进一步材质打磨和README交互GIF后置；用户验收未宣称通过。

## 历史检查点（完整保留，均非当前交付）

最新检查点：4191双端实际包与24附件已验证，但独立消费复审发现Mac隔离启动器引用生产者绝对路径，禁止发布该候选。仅修复生成器于`062a626a69c63156ccdbdd0b4f64a97c3f0e461b`；真实旧DMG搬迁RED／GREEN证明相邻目录解析、缺失／损坏拒收及profile链接保护。原包不改、测试副本清理。[限定复审](evidence/appearance/controller-final/task-2-portable-launcher-scoped-review.md)Spec／Quality通过，I1／M1／M2全部解决，未新增Critical／Important。新227输入canonical`72314079c3dbfb77ef813a5d4c852e9eb46fe2ab85d1b45e671acaedf49242f9`；接下来必须新冻结源码双端重建与实际包消费验收。草稿未发布，无preview.3 tag，真实双端验收仍未测。

以下为保留的历史检查点，不能作为当前新源码安装包或发布证明。

最新消费检查点：Windows `37968756145` 从3fa4683在verify阶段222通过／4夹具失败，未生成安装器；该次Mac6+3通过仅为阻断候选。保留[失败报告](evidence/appearance/task2-final-rebuild-3fa4683/task-2-report.md)。已仅修复LF／CRLF回调提取夹具，8项对照通过、Mac完整单测226通过／4平台跳过、类型通过；[限定复审](evidence/appearance/controller-final/task-2-crlf-fixture-review.md)Spec／Quality通过。生产I1／M1源码和唯一终审复审不变，新227输入canonical为`10367d7b3dc5d920af5e781b13b9daa1848e273cec4c542d5e652a198a68dffa`，必须从新冻结源码重建双端后再发布。

下方d9cf旧候选与3fa单Mac均为历史，当前最终交付目录尚不存在；历史目录分别为`delivery/failed-final-review-d9cf75b-v0.0.17-preview.3`、`delivery/blocked-final-rebuild-3fa4683-v0.0.17-preview.3`。草稿仍未发布，旧tag未改。


当前状态：整个增量终审的I1／M1已修复并通过唯一限定复审，剩0Critical／0Important／1非阻断Minor。必须新源码同源双端重建后才发布；下方d9cf双包／24附件是旧候选历史，不含f809fe3并发提示修复。用户和物理双端验收未通过。原第一轮修复已交付preview.2；本增量加入完整中英界面及首层太阳／月亮滑动胶囊，保留绳、夹子、纸张的主界面。

| 平台 | 包 | 字节 | SHA256 |
|---|---|---:|---|
| macOS arm64 | Thoughtline-0.0.17-preview.3-mac-arm64.dmg | 133417388 | `9c33bd508978b12a6367941b079e995087fe68be2a1c54df69a658c56c3cd2ac` |
| Windows x64 | Thoughtline-0.0.17-preview.3-win-x64.exe | 113101708 | `ad5401e0cf3fb9489a6520efbc9d49fcaf7ae2a94bf6e3a358588ca7fbf71f89` |

两端实际构建源码与草稿target均为`d9cf75b425464589e6761abd8dff9954f3e2ad0c`，225输入canonical SHA256 `7b658b2d8a88b499c722bfe51a9bba0889b13673e0ee0661364f4eb5129764cc`。后续证据／README／文档提交不是安装包源码。Mac原始文件向量`c92393d605869b6f7003d315ca05414287eff24b98bd0f25c5218acd2c4a8992`；Windows原始向量`e10c8252a66687fa2533914f3a9a78eca474c560c6e5f5ea9f9115f2ad0f9ccb`，CRLF／LF规范Git对象相同。

Mac15.3.1 arm64／Node24.19／Electron44.7：216单测通过、4Windows专用跳过，类型／构建通过；实际挂载包6项数据及3项外观检查通过，正常退出和自建profile清理。Windows hosted Server2025 10.0.26100 x64：CI[37963724007 attempt1](https://github.com/NocodeMrLi/thoughtline/actions/runs/37963724007)成功，220单测、17主外观／11修复、原源端流程、NSIS实际安装schema2与备份／重启、实际外观3项、同版本重装和普通卸载保数据通过。Mac严格ad-hoc签名，未Developer ID或公证；Windows未签名。系统安全保护未关闭。

本地交付目录`/Users/lihongwei/Documents/Codex/2026-10-09/thoughtline-round1-repair/delivery/v0.0.17-preview.3`含24文件／23校验目标、ASCII Mac隔离启动脚本、Windows隔离脚本、实际事实QA指南、完整来源及结果。私有草稿ID408155486仍未发布；24远端附件名称／大小／digest与本地相同，新增和替换13文件实际重下载，其余11与原下载receipt和当前同assetID／digest对应。旧13附件checkpoint、3cb首次失败及原始日志保留。

实施与完整测试／清理见[Task2报告](evidence/appearance/task2-rebuild-d9cf75b/task-2-report.md)，独立测试见[英文与外观检查表](LOCALE-APPEARANCE-INDEPENDENT-QA.md)及[原第一轮检查表](ROUND1-INDEPENDENT-QA.md)。微信4.1.13.65、QQ浏览器豆包及WorkBuddy5.7.6仍只是用户反馈；真实接收框、双端物理输入法／DPI／多屏／焦点／动画与材质手感未测。纸保持哑光薄纸；额外玻璃材质只是双端评估，README宣传图／GIF按用户要求后置。

念头schema3与独立profile偏好保存／备份／回滚见[数据安全](../docs/ROUND1-DATA-SAFETY.md)。旧preview.2／v0.0.16-preview.6、真实安装／数据、原out／依赖、其他工作树和原Electron进程保护。当前记录不是用户验收通过声明。

## 最终源码修复复审（2026-10-10）

source`f809fe36b72bee8f8bdc9afe0607591c98013b23`，证据22d1ccc／报告修正a94f0ad，227canonical`0f0b1048ba136430216b731d51aa6b7db050f1c788c17d9299084e50efab3c7b`。语言／主题前一次成功不再隐藏最新失败提示；短期IPC提交来源按真实webContents投影，不改偏好文件或念头schema／revision。10focused、222单测／4平台跳过、type/build、实际Mac源20+11通过，全部227输入一致，35PID／5profile正常清理。详见[最终源修复报告](evidence/appearance/final-fix/report.md)和[限定复审](evidence/appearance/controller-final/final-scoped-rereview.md)。新实际包尚待Task2同源重建；旧d9cf候选不可直接发布。
