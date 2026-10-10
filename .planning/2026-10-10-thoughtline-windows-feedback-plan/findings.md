# Findings & Decisions

## Requirements
- Seven Windows feedback photos: oversized/obstructing hints; calendar height/resizing and tiny arrows; settings return; shelf current-note stash; editor focus ring clipping in both reader views; desktop click dismiss and calendar naming; measured smoothness without deleting effects/features.
- User explicitly requests review of repair proposal before implementation. Preserve rope/clip/paper-only resident UI, matte paper, both OS quality and reduced-motion behavior.
- Source main d2ff3a36d4c71c1bb47ca08ab72acee906591169, clean before planning; package.json 0.0.17-preview.4. Current Windows installed exact build/DPI not confirmed.

## Research Findings
- User confirmed Windows installed 0.0.17-preview.4; Windows OS build and DPI still unknown. Mac installed readonly version is preview.3, running PID67908 protected; current inspected source is preview.4. Do not conflate installed Mac and source.
- ActionIcon.tsx immediately displays a fixed 280px portal tooltip and also sets native title. Tooltip z-index1000 vs reader-more z-index8; no click/menu-open dismissal. Matches user photo obstruction from shared renderer, not yet native Mac reproduction.
- auxiliary.css month-grid defines only columns; date-cell min-height57px, no remaining-height rows. Prev/next use text glyphs at12px. Existing calendar geometry test checks window bounds and animations, not resized grid fill.
- Settings has only closeManage on X/Escape; main.openSettings resets selection, increments session, changes bounds. main.tsx switches Calendar to Settings, unmounting Calendar-local nav/history/query/scroll. Agent/trash instead use Calendar internal go/back and retain state.
- InlineIdeaEditor is shared in Detail/Calendar; overflow:auto and width100% children, global focus-visible outline2px +offset2px extend outside child rectangle. preferences-theme.css further focus rule must be read before exact diagnosis.
- Shelf native menu is owned by focusable:false transparent Shelf; popup callback only releases menu lock. No current-note stash item, old calendar label present in shelf/tray. Desktop outside clicks cross native boundary and cannot be solved/proved by DOM events alone; owner/focus hypothesis not independently proven.
- UI skill narrower searches still lack exact tooltip/flexible-calendar-height match; project source and design contract are fallback basis. Back-button UX result supports preserving navigation state, while mobile-specific sizing is not imported into desktop UI.
- preferences-theme.css focus token is shared theme --focus (not derived from Agent in this file). Preserve user's requested Agent-associated cue, but do not claim current source already binds every editor focus ring to Agent color. Global offset outline plus scroll-container edge remains the clipping hypothesis to test.
- Native card-copy title contains the long drag instruction, matching the lingering OS tooltip visible across multiple supplied photos. Include its dismissal/lifecycle in tooltip scope, not just IconButton.
- Existing source fixture replaces Menu.popup with a stub, so it cannot prove desktop outside-click dismissal. Electron44.7 local typings provide popup and closePopup; plan native tests without that stub, validate OS owner/focus handling before choosing minimal adapter.
- Geometry persists through a350ms debounce then full repository commit/broadcast; calendar memo index depends on whole snapshot object. Potential needless index rebuild after geometry-only change is a profiling lead, not measured performance root cause. React skill memo result supports measured hotspots, not blanket memo/compiler migration.
- Root .agents and guessed App.tsx do not exist; actual app route is renderer/main.tsx. Project09 requires current-main inline work, no delegation. Existing12worktrees intact; this turn launched no App or test process.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Compaction hook returned 1: configured WordPet memory directory missing | Recorded limitation; project documentation remains the project source of truth. |
| UI skill first tooltip/height queries returned generic/off-topic results | One narrower retry required; do not persist them as specific verified guidance. |

## Resources
-

## Execution findings
User approved plan save then implementation, canonical second round doc saved. Nine latest Mac checks pass. Existing calendar geometry regression exposed untouched settings falsely becoming dirty after external save; fixed with per-field baseline rebasing, retained failing receipt. Explicit discard clears hidden guard; prompt supports keyboard focus and Escape. Native Windows outside-click pending owner comparison.

Right-click menu currently lacks split; IdeaReader already shares split/splitAll commands. Existing split searches full rope gaps and explicitly reports true overflow with calendar entry. Reuse it instead of a new write route. UI skill searches did not return a verified menu/undo match; project UX contract and existing implementation are fallback design basis.


## 2026-10-10 新反馈：绳满前置处理与换上（仅方案审阅）
用户四图显示：满绳新建自动打开详情，详情/日历重复容量提示，期望新建原窗口解决并在未挂上阅读页提供替换。用户要求先看方案，尚未授权此增量实现。
当前 clean main HEAD8558523。源码依据：main thoughtline:submit 在提交成功后计算 overflowId 并 openBrowseDetail；newIdea 总写 hanging 独立 clip；status hanging 也先提交再检查溢出。IdeaReader 与 Detail/Calendar footer 均读取同一个全局 placementNotice，解释截图重复显示，属于源码推导而非本轮独立平台复现。Shelf 对 Agent 过滤后独立 layout，容量检查需保证完成后新念头实际可见，不能将筛选隐藏等同物理容量满。
UI技能 targeted progressive disclosure inline feedback 返回 Inline Validation / Error Placement，支持前置检测和原窗口关联反馈；Heading Line Balance 不匹配本任务，不作为依据。沿用既有产品边界与共享布局：无手动位置静默挤占，纸张哑光，主界面只有绳夹纸，同Agent叠纸。
建议方向供用户审阅：有合法空位挂上；碎片容量足够时显式整理后挂上；真满主按钮保存并提供可见的换上小入口。选择器只列实际在绳上的目标，近3天优先但更早可选；默认换一张并收起旧张，同Agent叠纸原索引换入，跨Agent叠纸只能用户明确收起整夹并标张数。保存/替换原子执行，取消保留草稿，过期目标/写盘失败不损内容；新建换上撤销保留新记录仅还原挂绳关系。日历原收起/重新挂上槽按实际挂绳/容量状态呈现重新挂上或换上；旧溢出记录也可换上，无复制创建。
本轮未运行应用、未安装依赖、未测试或发布；不宣称问题已修复。hook配置目录缺失退出1，记为限制；初次猜测Composer/Detail根路径不存在，经 rg --files 改为components实际位置。无新增垃圾/进程。
