# 第五轮实现计划

> 执行方式：executing-plans 当前会话顺序实施。用户已明确授权文档后直接执行、main提交push及双端新包发布，不重复审批，不启动其他代理。

Goal: 落实第五轮九项及最终三页签/双滚动/固定操作合同。
Architecture: 复用现有分类变更和共享浮层，更新目录迁移、主进程浏览共存、统一编辑控件；保留保存及退出协议。
Tech: 固定Node24.19.0、Electron44.7/React19.3/TypeScript/Vitest/Playwright。
Spec: /Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline/Thoughtline第五轮修复优化.md

Global Constraints: 保留已认可纸框/藤蔓/默认分类/原偏好；保护真实App和个人数据；隔离数据；中英浅深窄窗；受控不等同物理验收。
Review Focus: 活动草稿遇分类迁移；长按取消与抬起点击；固定窗口内创建表单；详情变更标签拆夹；共存窗口关闭/重开和退出。

## Task 1 数据与共存
Files: shared/ideaCommands.ts/bridge.ts, preload/index.ts, main/index.ts, unit/classification.test.ts, electron/round5-workflow.cjs。
Interface: projectDelete(project,revision,replacement?) 原默认未分组兼容；browse不结束composer，分类返回复用原详情会话。
- [x] 新分组迁移单测及原生共存/返回红例。
- [x] 分组迁移保全部历史/草稿与目录、原子提交；浏览入口不锁写作，详情分类管理返回保护。
- [x] 单测绿及原生定向绿。

## Task 2 分类与界面
Files: ClassificationPicker/Manager/Form, CompactPopover, Composer, InlineIdeaEditor, styles/classification.css/overlay.css, locale。
Interfaces: 共享ClassificationPicker有编辑会话prepare与manager返回；三页签tags/projects/removed。
- [x] 原生长按/三页签/固定高度/独立滚动/旧入口红例。
- [x] 整理模式叉号/完成、固定浮层；manager三页签与统一删除；新建工具栏/无框名称；详情同控件。
- [x] 源UI/中英浅深窄窗/IO/IME/退出和旧流程回归绿。

## Task 3 双端包与交付
Files: CI workflow/tests/scripts, package/lock/readmes/launchers, acceptance/gates, release report。
- [x] 0.0.28版本一致、完整Mac verify、双端源码/实际包测试。
- [x] 冻结输入及摘要绑定；Windows安装重装卸载保数据；保留原失败。
- [x] 清理自有临时物及正常退出回读；阶段main提交push、最终源码tag、双端私有发布。
- [x] 发布附件摘要读回、文档及可照操作报告。

## Errors
默认cwd无效须显式项目workdir；初读误用windows-native.yml（实际test-packages.yml），未改生产。旧locale glob不存在，按实际文件路径读。

## Storage side task (complete)
131 valid artifacts 5.76765GiB. Per-ID archive/API digest+ZIP CRC before deletion; latest0.27 final/UI+small diagnostics retained. CI gates unchanged; single delivery installer, short retention, per-run evidence delta. Both stages completed with per-ID API digest/ZIP CRC archive and deletion readback. Latest installer preserved in verified private Release; latest UI and small diagnostics retained.

最终结果：0.0.28第五轮双端技术验证、清理和私有发布完成。构建/tag源码 `4c9567fef38dd43ccd0e0c3bc18d557c4b945843`；Windows完整CI [38287260286](https://github.com/NocodeMrLi/thoughtline/actions/runs/38287260286) success；[私有发行页](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.28)（Release 410883610），10份附件大小与SHA256读回一致。main后续文档证据提交不改变安装包源码。
Actions 34份/65932941bytes；归档与发布后清理读回通过。

## Task 4 R5-12 已移除按钮追加修复（0.0.29，已完成）
- [x] 获批方案同步；原生灰态与点击说明红例。
- [x] 最小按钮/浮层修复；中英浅深宽窄、2.5秒/重复点击/Esc/外部点击/键盘/恢复/删除回归。
- [x] 双端源/实际包验证及摘要绑定，独立0.0.29发布、清理、main推送和报告。
保护用户运行0.0.28 PID68573和个人数据；只改已移除编辑/改名灰态与说明。

R5-12完成：0.0.29（第五轮R5-12）已完成双端技术验证、清理及私有发布。构建/tag源码 66e88363d34f042b18a7ca4f88c8d7c29a115595；Windows完整运行 38333752315 success；Release 411180836，10份附件大小/SHA256读回一致。main后续文档提交不改变包来源。
