# 双端私有预发布与 main 收敛

2026-10-09（北京时间）。以本条覆盖此前“未合并main/未新发布”的阶段状态；旧条目保留作历史。双端 **0.0.16-preview.6** 私有预发布已发布，tag **v0.0.16-preview.6**，release ID407667273；仓库仍private。Mac为Apple Silicon arm64 DMG，Windows为x64 NSIS，没有IntelMac/原生WindowsARM64/x86包或自动更新。

发布tag/main源提交：`b89481926753377c66afe0bdf2ef8dd5d453bbb7`。收尾提交只补文档证据，最终main SHA见任务根RELEASE-PROGRESS.md及交接；annotated tag保持不变。Windows实际构建aa23b210ce26de956f88c48851dc1681ab233f6b/run37893774452/artifact11598913007；Mac实际构建723356385af5518cddae65d2ae023707a0c804b6。全部生产/构建Git输入逐项mode/blob一致，清单没有冒称两包在文档HEAD打包。

全部7项发布资产服务端size/SHA256与本地匹配。main自动Windows CI37900797155已成功，artifact11602427835为收敛验证包；正式交付复用独立QA通过的原Windows installer。Mac盘内Appstrict资源签名、全部out/assets/ICNS绑定、隔离编辑取消/保存重启/草稿保持通过；Mac102unit/20合成composition/4延迟续作，Windows106unit/type/build/NSIS/ASAR/7帧PE/实际安装重装普通卸载保持通过。

有效功能与独立QA历史已收敛到main。11条完全可从main恢复的远端分支已按准确tip atomic删除，远端仅main/G7；恢复精确tip记录在证据。G7有7项未集成实验，保留。所有本地工作树/分支、旧.15/.5包、真实数据与原安装/开发进程保留；原开发区本地main未强制同步，停用旧dev且clean后再fast-forward。后续默认开发main，不为普通增量另建分支。

普通Windows卸载保留数据；显式--delete-app-data会删除默认profile，不传此参数。Macad-hoc、无DeveloperID/公证；WindowsNotSigned。安全机制/策略阻挡时记录原文，不关闭或改执行策略。覆盖前退出旧App、备份完整默认数据目录并保留旧包；隔离数据不等于并排安装。回滚先保留新旧两份完整数据，对副本隔离验证，勿覆盖唯一新数据。与.15存储代码相同不等于跨版本升级回滚实机通过。

**formalAcceptance=false**。WindowsCtrlEnter仅逻辑单测，没有Composer键盘端到端；真实IME、焦点/热键/空白穿透、多屏/图标缓存、Agent/G7、旧版升级回滚待用户。使用35的实机清单与附带隔离启动器，只用合成笔记，取消安装完成页自动运行。未ACK草稿尾部、未提交编辑、关机/强退不承诺零丢失。

最终报告与可操作清单、发布server receipt、来源一致性、CI、分支恢复记录在证据/main与双端预发布-20261009。收尾只清理本轮out/dist冗余构建与空挂载目录，最终包/依赖/证据保留。
