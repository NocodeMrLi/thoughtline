# 第一轮数据升级、备份与回滚

## 最新同源包检查（2026-10-10）

私有preview.3已发布，Mac／Windows均从`01017c9525ac971b6e97461ef2910140944eda19`构建；详见[当前交付](../acceptance/RELEASE-0.0.17-preview.3.md)。实际Mac挂载包6项保存／schema2升级／日历删除恢复／备份检查、完整恢复后两次重启及3项界面偏好重启检查通过。Windows CI37974164754实际NSIS安装、schema2备份升级／保存／备份重启、偏好3项、同版本重装和普通卸载保数据通过。各端自动证据独立记录，不证明物理磁盘故障、真实输入法关窗、用户双端恢复或验收。

**念头schema3与profile界面偏好分开。** 导出念头备份不包含preferences.json；完整profile迁移需另外保留该文件与data-location.json及它指向的念头目录。正文、ID、顺序、创建日和当前页需实际重启核对。迁移校验后才切换，失败继续原目录，原副本保留。当前没有一键恢复按钮，下面的独立恢复步骤继续适用。

preview.2与.3均为schema3，回到preview.2不恢复旧schema且该版不消费新界面偏好。preview.6不能直接读取schema3，独立目录使用升级前备份只恢复升级前内容，不能承诺无损降级。旧发布和回滚包均保留。下方历史d9cf等候选结果仅作历史，不替代上述当前冻结源。

本文件记录数据契约。P5源码目录迁移／独立备份与合成恢复、最终preview.2实际Mac包完整备份恢复两次重启及同源Windows runner安装保全检查已通过；见 acceptance/RELEASE-0.0.17-preview.2.md。物理磁盘、真实两端操作及用户验收仍待完成。

## schema3 升级

旧 schema1/2 可读取，首次实际提交新快照前将原始 JSON 字节保存为同目录的 `snapshot.schema1.backup.json` 或 `snapshot.schema2.backup.json`。已有同名备份不覆盖；备份写入失败则不替换原主文件。未知版本不转换为空库。损坏主文件的恢复保留损坏原件，常规备份为 `snapshot.bak.json`。

创建日是独立的 `createdDay`，创建时区是 `creationTimeZone`。旧记录按原 `createdAt` 字符串中的偏移日期冻结；无偏移按 UTC，并标记 `legacy-offset`。新建按创建瞬间本地日期及系统时区记录。编辑、收起、删除恢复和后来的时区变化均不重算历史创建日。日历当天高亮可以刷新，历史记录不因此移到今天。

收起保留念头；最近删除保留完整内容和原状态，可以恢复。永久删除只针对最近删除的条目，独立确认，不定时自动清空。项目删除立即清除相关归属，包括最近删除及草稿，完成/退出及整理撤销都不能复活分组。

## 旧版本回滚限制

已发布 v0.0.16-preview.6 只理解旧格式，不能直接读取 schema3 数据。保留整个新数据目录，再将升级前专用原始备份复制为独立空测试目录中的 `snapshot.json`，用旧包和独立 `THOUGHTLINE_DATA_DIR` 验证。不要向当前新目录直接启动旧包，也不要覆盖当前新数据。

专用旧备份只含首次升级前的内容。升级后新增、编辑、删除或恢复不会出现在它里面，不能承诺无损降级。升级后仍需保留新数据副本与适配的新版本。旧发布包、tag 和生产图标不覆盖。

## 验证状态

P3 数据层 75 项覆盖单测通过，包含原字节备份、备份写入失败、未知版本拒绝、日期迁移与重验、最近删除和编辑 CAS；见 `acceptance/evidence/round1/p3-data-report.md` 与独立审查。原地编辑、日历、目录切换和实际备份恢复的集成验证另记录，Mac 受控测试与 Windows runner、物理双端及真实接收端分别标记。

## P5 念头目录、迁移与独立备份

设置中显示当前“念头数据位置”的真实绝对路径，可打开文件夹、更改位置或导出备份。更改位置需选一个已存在的空文件夹；应用先等待编辑和翻页保存，输入法候选未确认或保存失败时停止。只复制 `snapshot.json`、`snapshot.bak.json`、专用 schema1/2 原字节备份及损坏原件，不搬浏览器缓存。复制后逐文件比对 SHA256/大小、完整快照及修订号，并实际创建新 FileRepository 读取成功，最后才原子写位置配置并切换。旧目录不删除。

`THOUGHTLINE_DATA_DIR`（如设置）或默认 userData 仍是应用 profile。`data-location.json` 保存在 profile，格式为 `{"schemaVersion":1,"path":"绝对念头目录"}`。缓存、应用锁和该位置配置仍在 profile；快捷键等业务设置随念头快照保存。备份 profile 时也保留此配置；它不是念头正文副本。配置指向的磁盘失联、目录缺少主快照和备份、配置损坏或未知版本均进入启动恢复提示，不新建空库。可重新连接磁盘、打开配置文件夹检查、重试或退出；不要通过删除配置掩盖失联问题。

导出备份会在所选父目录创建时间+UUID 命名的独立子目录。`manifest.json` 记录清单版本、应用版本、快照版本、revision、时间以及每个文件的 SHA256 和字节数；导出不更改当前目录。拒绝已存在目标文件、目录/数据文件链接、复制失败、文件校验不符和磁盘/当前快照不一致。失败仅清理本次创建且 hash/大小仍能核实归属的文件；外部改写或不完整文件可能保留供诊断，不能保证每种故障后目标仍为空。

### 从独立备份恢复到新位置（当前没有一键恢复按钮）

1. 正常退出 Thoughtline，保留当前念头目录、profile 和原备份，不直接在备份目录启动应用。
2. 打开备份的 `manifest.json`。仅接受清单版本1、合法 snapshot 文件名；文件应与清单一一对应（另有 manifest），无链接或未知文件。用 Mac `LC_ALL=C /usr/bin/shasum -a 256 文件路径` / Windows PowerShell `Get-FileHash -Algorithm SHA256 文件路径` 逐个比对 SHA256，并按文件属性比对字节数。损坏或不完整时停止，不覆盖现有数据。
3. 新建一个独立空目录，将清单列出的 snapshot 文件复制进去；不复制 manifest 或缓存。再次逐项核验副本。不要将恢复内容合并进当前目录。
4. 使用**支持 schema3 的当前新版本**及独立 `THOUGHTLINE_DATA_DIR` 启动这个恢复目录。Mac 可在终端用 `open --env 'THOUGHTLINE_DATA_DIR=/绝对路径/恢复副本' '/应用路径/Thoughtline.app'`；Windows 在临时 PowerShell 会话设置 `$env:THOUGHTLINE_DATA_DIR='D:\恢复副本'` 后运行实际 `Thoughtline.exe`，测试后关闭该终端。启动前须退出其他 Thoughtline。检查正文、ID/顺序、创建日、状态、夹子当前页和草稿，正常退出后再次启动确认。
5. 确认恢复副本后，若要让日常 profile 使用该目录，先正常退出，再保留原 `data-location.json` 副本，并将其中 path 改为恢复目录的绝对路径（JSON 中 Windows 反斜杠须写作 `\\`）。若没有位置配置，则创建上述 schemaVersion1 格式。重启核对设置所显示路径。保留旧目录，直到确认恢复内容完整。

开发纯模块 `restoreBackup` 提供同样的清单/版本/路径/链接/哈希/快照校验、排他复制及实际 FileRepository 读取；它不自动更改 profile 配置。合成 source Electron 已按独立备份执行复制恢复并两次启动完整快照比对，另有纯模块真实恢复测试。见 `acceptance/evidence/round1/p5-storage/`；这不是物理磁盘断连/权限/断电、Windows 实机或安装包验收。

旧 preview6 不能读 schema3。降级只能在独立目录使用升级前 `snapshot.schema2.backup.json`（或 schema1 原备份）作为 `snapshot.json`；那份备份不包含升级后的新增、编辑、最近删除等变化。保留当前 schema3 副本和新版应用，不能把换回旧 App 视为无损降级。

## preview.3 界面偏好与念头数据分开

中英语言与日夜外观保存在应用 profile 的独立 `preferences.json`，格式为 `{"schemaVersion":1,"version":0,"locale":"zh-CN","theme":"system"}`；locale可为`en`，theme可为`light`／`dark`，version随偏好写入递增。它不修改念头schema3、修订号、正文、ID、创建日或快捷键，不随“更改念头保存位置”迁走。窗口共享顺序写入，过期回复不能覆盖新选择；写入失败显示错误并保持最后持久值，损坏／未知／外部改写的偏好文件保留供恢复。

导出的念头备份只包含上文列出的snapshot文件和清单，**不自动带走profile界面偏好**。若需完整迁移profile，应在正常退出后独立保留`preferences.json`及`data-location.json`，确认指向的念头目录也已备份；不要把位置配置当正文副本。恢复念头备份到新profile时，语言／主题按新profile默认或用户选择重新设置。

preview.3与preview.2的念头格式均为schema3。回滚到preview.2不会将念头格式降回schema2，该版不消费新偏好文件；保留新profile与念头目录副本，在独立目录核对回滚后的正文、ID、日期、草稿与当前页。回到v0.0.16-preview.6的限制仍以上文旧版本说明为准，不能承诺降级保留升级后的修改。

同源d9cf75b的preview.3实际Mac包6项schema2／保存／日历／备份验证（包含实际恢复后两次重启）及Windows runner实际安装schema2／保存／备份／重启、同版重装与普通卸载保数据检查通过。Windows runner与Mac受控包结果不证明真实磁盘断连／断电／权限故障或用户双端验收。证据见`acceptance/evidence/appearance/task2-rebuild-d9cf75b/`。
