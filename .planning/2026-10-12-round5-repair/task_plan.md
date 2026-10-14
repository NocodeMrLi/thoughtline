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

## Task 5 R5-13至R5-16 分类描边与设置共存（完成）
Baseline: main 57bc006；0.0.29包源66e8836；真实用户App版本/PID现场刷新，不操作真实数据。
Files: classification.css, main/index.ts, shared/messages.ts/contact.ts, SettingsContact/Calendar/bridge/preload, tests/electron/round5-settings-workflow.cjs/round5-contact-workflow.cjs, workflow, version/delivery metadata。
Interfaces: prepareWindow(composer)已有离开协议只刷新草稿，不关闭/冻结输入；composerWrite串行提交保证备份一致快照；设置显示与存储迁移分离。
Review Focus: 备份checkpoint失败/IME/正在创建分类；文件选择期间写作与迁移竞态；dirty Settings共存及退出保护；无框顶部名称不回归；原日历导航/搜索/滚动还原。
2026-10-13追加授权R5-15/16：设置三页签底部联系栏（固定GitHub/邮箱/复制，标准14px图标12px文字、窄窗两行）；日历更多菜单最近删除/标签与分组/存储与设置。先红例后实现，外部目标固定并限定可见设置授权，测试不真实打开浏览器/邮箱或改个人剪贴板。
- [x] 原方案追加第五轮、03/05同步、先红例验证现象。
- [x] 修复内侧focus、双向普通设置共存、备份flush及迁移门禁；绿与旧回归。
- [x] 全verify、独立最终review、双端源/实际包及安装验证。
- [x] 新版源/包绑定、私有发行与main推送、结果文档、owned垃圾清理。
Ruling: 此次在main顺序执行并沿用既有私有包/推送授权；用户要求先写文档后执行，优先于技能默认新worktree/再次许可。

## Task 6 R5-17 极简念头导出（完成）
基线 main add6b22 / 0.0.30，开始时工作树干净。用户认可三行小菜单并授权执行；继续双端验证、更新包、提交推送、文档和自有测试垃圾清理。
- [x] 刷新源码和第五轮，明确获准最小界面与数据合同。
- [x] 行为红例：全文/范围/中文/空名称/同名/空行/长内容、取消、IO和菜单原生行为。
- [x] 三行菜单、受信IPC、一致快照文档生成、安全写入；原备份保持。
- [x] 全verify、Mac源/实际包、Windows源/实际包与安装验证。
- [x] 0.0.31源码包绑定、私有交付和main推送、文档结果、自有垃圾清理。
具体合同见 docs/releases/round5-r517-plan.md 与第五轮文档 R5-17。执行中失败和测试结果记录本目录 progress/findings。


## Task 7 第五轮追加R5-18至R5-27（技术交付完成，用户验收待办）
- [x] R5-18获准合夹方案写入第五轮，03/05引用同步。
- [x] 现场源码核对，R5-19页签顺序需求和R5-20避让/流畅度待审方案记录。
- [x] 用户认可最终方案并明确授权连续实施/测试/提交push/自有垃圾清理。
- [x] 数据与分组合夹红→绿、旧数据/拆分/换上/恢复/容量。
- [x] 双条件筛选/统一搜索面板/分组优先命名红→绿。
- [x] 窗口位置与性能基线/优化/原保存保护回归。
- [x] 已完成verify和审查；后续按用户新指令只补新增/受影响源与实际包，私有交付与清理完成。
当前实现基线bc61e70/包源9d4ea59；此前草图和讨论记录保留，六项实施与验收分别记录。用户真实应用/个人数据保护。

R5-26已由用户2026-10-13授权：合并搜索＋三列自适应＋目标归位＋日历叠放持久化。先更新最新合同，扩展数据/阅读/面板边界与双端红绿；两轮审查及交付义务保持。

2026-10-13 23:25 用户要求暂停并交接：此后不继续生产修改、不打包、不提交/推送。当前npm test 385pass/4Windows skip、typecheck退出0；pause-full-unit.log/pause-typecheck.log。新增R5-26原生6业务CHECK不等于整体PASS，正常离开第7项尚未通过；obsolete-page-owner-red.json保持原FAIL。旧group-spatial-green.log实际FAIL，当前+12几何读数需按width/2校准；不再把未证实pointer假说当根因。双端新版实际包、两轮最终合同审查、交付清理仍未完成。
检查点和可恢复源归档：/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r526-pause-20261013-232510
77源码/计划文件归档，Git展开469变动（含证据）；本轮精确原生runner/R526 Electron已无活动，失败55文件逐SHA验证归档后清理；只停已登记原型6011/49324，个人App68573与归属未明Electron95997保留。其他历史/全轮临时对象未宣称全清。
外部主文00/07/第五轮暂停状态和新接续提示词已同步；通用文档3处去重补强，升级05无新增候选。保存责任与IO/IME门禁不放宽。任务7保持未完成，0.0.31既有交付不重置。

2026-10-14候选0.0.32：本地全verify398+4Windows专用skip、受影响原生12套及共用菜单面板8场景通过；独立review8Important一次红绿修复完成。原暂停终止约束已被本窗口用户接续和休息前继续执行授权撤销；WIP始终保留。准备冻结源码提交触发完整Windows CI、生成Mac实际包；发布仍待双端门禁与第二轮对照。

2026-10-14最终技术收口：源码/tag6135608，Windows构建/保数据38489171294＋同包定向续测38490095906成功；Mac当前22常规＋FAST及英文浅深菜单专项通过，未变旧门禁按指纹复用。两轮合同核对、清理和Release412225874十附件摘要读回完成。用户物理与体验验收保持待办；main后续文档/工作流提交不是包源码。

## Task 8 0.0.32后接续提示与经验复盘（2026-10-14）
- [x] Skill路由、主分支/tag/Release/真实App身份只读刷新；历史暂停不当当前状态。
- [x] 两份通用主文及升级03/04/05、当前套件合同去重；只补真正通用增量。
- [x] 整理并保存一键复制接续提示词，同步原入口；保护源码/tag/包和产品范围。
- [x] 文档变更、备份、引用及事实读回；交付全文并分列候选/未实施状态。
