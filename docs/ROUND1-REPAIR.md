# Thoughtline 第一轮修复优化

完整产品方案：`/Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline/Thoughtline第一轮修复优化.md`。本轮基线main `ff39779cbeb562083f3574db4d2998693091b0be`，仓库private，G7未整合；旧发布v0.0.16-preview.6不改。开发候选使用0.0.17-preview.1，不替换用户安装。

## P1 项目编辑（2026-10-09）

项目选择器500ms长按进入整理，×立即原子清除所有已挂/已收起记录和草稿中的同名project；实体仍由实际归属汇总，未更改schema2。正文、ID、物理夹与当前页保留。完成／退出只关面板，未分组无删除入口。减少动态效果去抖动。支持逐个连续删除，无逐次确认。整理撤销快照同步清除已删除项目，不复活分组。

独立FileRepository重启、项目数据3项红绿、类型检查与全量验证见 `acceptance/evidence/round1/`；隔离Electron pointer/DOM/IPC验证长按、删除、完成、退出、系统项、撤销与重启。`project-native-attempt1.log`保留Playwright稳定性等待与抖动冲突；第二次改为鼠标坐标点击，全部业务断言保持。此证据不是物理Windows/IME/外部输入框。

本轮方案归档回读216行18134字节，初始SHA256 `72ed476ee2f3fb03d7f65c55fa941171d3e56cadeccfaf6cbe8ea642b94ed183`。默认cwd已不存在改用明确目录；Mac Perl locale失败改LC_ALL=C。ui-ux-pro-max scripts/data安装为普通占位文件，已应用阅读所得UX规则，不改技能安装。

用户目标版本：Windows微信4.1.13.65、WorkBuddy5.7.6、豆包QQ浏览器；Windows版本、QQ浏览器版本和拖动起点未知。微信成功/豆包间歇/WorkBuddy反复失败是用户反馈，真实目标独立复现仍未测。

## 待做

P2：三种拖动、外拖、翻页测量／合并保存、全绳空位。P3：原地编辑／自动保存、最近删除、窗口拖动与统一图标材质。第二轮日历／历史检索／目录迁移与备份实际恢复。真实双端IME/DPI/多屏/焦点/目标接收、独立QA、用户验收待完成。旧安装PID28102与Electron30628保留，测试仅独立临时目录与合成文字；测试自有PID和数据清理receipt已保存。
