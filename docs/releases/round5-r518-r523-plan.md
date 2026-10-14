# Thoughtline 第五轮追加 R5-18至R5-27 执行计划

> **For agentic workers:** Use executing-plans inline in this session. User explicitly authorized writing the approved spec then implementation/tests/push; no new approval round or worktree. No implementation delegation; whole-branch fresh review follows this skill.

**Goal:** 以0.0.31为基线完成R5-18至R5-27用户已确认追加；26/27覆盖前述冲突方案。
**Architecture:** 保留物理Clip与逐条Idea，夹子标签字段改为当前页派生值；筛选是成员投影，不能传投影成员作为完整写入。原Manage窗口复用，统一几何与准备首帧后显示。
**Tech Stack:** 仓库锁定Electron/React/TypeScript/Vitest/Playwright，沿用0.0.31依赖。
**Spec:** /Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline/Thoughtline第五轮修复优化.md — R5-18至R5-27最终执行合同。

## Constraints and rulings

- 主分组决定新合夹；旧跨组同标签叠放保留。未分组仅同标签新合夹。
- 新数据格式schema4；schema1/2/3按原字节备份后提交；schema4中的Clip.agentId仅当前页镜像，成员可不同标签。持久层保留旧叠放，不以新合并资格重新整理。新快照结构仍严查成员唯一性/状态/当前页/标签引用。
- 分类整体迁移保留叠放关系；后续新合夹重新按实际成员分组判断，避免分类删除隐式拆合。单条改组则单独分離；旧跨组同标签叠放改单标签时分離以保持明确语义。
- 展示投影保留真实clip，单独visibleIdeaIds；筛选翻页在当前视图临时选择，不覆盖筛选前完整当前页。复制/拖正文/右键命中当前显示id。
- 现有层级/显隐规则、名称/正文/提醒/独立备份、保护门禁保持；位置和流畅度独立验证。

## Review focus

1. 旧同标签跨分组结构在升级及分类删除后不丢失，schema3原字节备份不覆盖已有备份。
2. 混合标签叠放的删除恢复、容量溢出、换上、撤销不丢隐藏成员。
3. 筛选中当前页临时选择不被拖动/原生菜单回调当成完整成员集合。
4. 输入法组合键不提前选标签；外部点击/Esc关闭小面板，面板不越Shelf边界且搜索确能打字。
5. 页面准备首帧与保存保护、30秒窗口回收、重复打开并发没有旧页闪现或死锁。

## Task 1: 分组合夹与数据兼容（R5-18）
Files: shared/contracts.ts, clipModel.ts, clipCommands.ts, ideaCommands.ts, ideaPlacement.ts, ideaVisibility.ts, main/store/repository.ts; tests/unit/round5Grouping.test.ts及受新合同影响的旧合并夹具。
Interfaces: clipGroup(snapshot,clip):string|null; canMergeClips(snapshot,source,target):boolean; canMergeIdea(snapshot,ideaId,target):boolean; pruneClips状态清理并同步当前镜像。validateSnapshot读取1/2/3/4输出4。
- [x] 红：同组跨标签允许、跨组同标签拒绝、未分组不同标签拒绝、旧跨组结构读取不改原文；改单标签保留/改组分离；混合叠放删除恢复/拆分/换上/容量/撤销保全。
- [x] 最小实现；旧测试中同标签跨组新合夹条件按新合同调整夹具，保留专门旧快照读取测试。
- [x] npm test 全量；npm run typecheck；阶段记录后提交可回滚节点（不早触发安装包）。

## Task 2: 双条件筛选、搜索面板和名称（R5-21/22/19）
Files: shared/shelfFilter.ts, bridge.ts/messages.ts, preload/index.ts, main/index.ts, renderer/Shelf.tsx/ClipCard.tsx/Detail.tsx/PlacementPicker.tsx/ClassificationManager.tsx/Calendar.tsx, hooks/useClipPage.ts, ShelfFilterPicker.tsx及样式。
Interfaces: ShelfFilter={project:string|null,agentId:string}; matchingClipIds(snapshot,clip,filter):string[]; filteredClips(...)真实对象；filterTagOptions(...)仅当前范围挂着成员；bridge setShelfFilter/open/closePicker受信Shelf请求。
- [x] 红：只组/只标签跨组/交集、当前非匹配但夹子含匹配成员、无匹配、清除单条件与全部、读筛选不写snapshot。
- [x] 面板单行顶部无大标题，固定全部标签，最多6行内部滚动；键盘/IME/Esc/外部点击，group/agent独立；列表标签色点与短计数。
- [x] source Electron门禁验证真实菜单回调/IPC/renderer以及中英浅深宽窄面板；全文取用和拖动仍真实成员；分类页签键盘和命名回归。

## Task 3: 位置与打开准备（R5-20/23）
Files: main/windows/manageGeometry.ts, main/index.ts, renderer/main.tsx, bridge/preload；tests/unit/round5ManageBounds.test.ts, tests/electron/round5-window-workflow.cjs。
Interfaces: fitManageBounds附带可选避让Rect和锚点，在workArea内优先便签下方；screen目标按已开Manage/触发Shelf确定；show准备按manageSession/Mode的受信首帧ack，不固定sleep。并发相同打开请求复用。
- [x] baseline：已有运行产物上记录冷/热/回收/往返耗时和重定位次数，保留来源说明。
- [x] 红：大屏/小屏/负坐标/任务栏/Dock、多屏/旧保存位置及切换锚点，不越界/不压可操作头部；最近删除保持原窗口。
- [x] 实现统一位置，准备目标页及尺寸后显示，原保存保护及回收保持；实测比较耗时，是否预热据数据判断。

## Task 4: 完整交付
- [x] 已完成verify408pass/4Windows skip、独立review及8项红绿修复；后续边界由执行者原生红绿审计。用户最新要求只补新功能和受影响功能，不从头重复。
- [x] 冻结新版本源码，Mac源/实际DMG、Windows定向CI源/实际NSIS及安装验证，输入/包摘要绑定。
- [x] 私有安装包，逐资产读回，不覆盖历史或个人应用；六项结果与操作报告/第五轮/03/05/00/07同步。
- [x] owned数据/进程/挂载/重复包归档校验后清理，提交push和远程读回；物理缺项单列。

## Task 2历史追加（2026-10-13；下段菜单被R5-26/27替代）
菜单精简：新建念头/收起；只看当前分组/筛选标签/显示全部/Thoughtline 日历；整理子菜单直接合并目标、拆分叠放、自动整理和真实撤销名称，移除重复全文入口但保留明确展开图标。
R5-24详情翻页条：浏览/编辑均在正文下方居中、底部工具栏上方，无底色，单张物理夹子隐藏。原标题列表及翻页保存/IME/错误保护保持，双端源/包及两轮对照审查。

R5-24/25最终排列和图标一致性：用户最终指定铃铛进入详情动作栏第一位，其后复制/编辑/收起/拆分/更多；翻页复用原提醒单行居中。单张隐藏翻页，浏览/编辑同位。提醒紧凑图标仍暴露完整时间/状态小字提示和原设置/取消面板；日历详情同组件同顺序，新建、日历、详情、分类与设置同类操作图标/点击区域全局核查，双端浅深窄宽，两轮方案对照审查。铃铛靠右候选不实施。


## Task 5: R5-26 最新合并合同（2026-10-13授权）
Spec以第五轮R5-26为准，替代Task2菜单直接目标方案。增加schema4可选archivedClips持久日历叠放（未发布schema4兼容扩展，旧版不得回退误读），与capacityOverflow成员互斥；归档合并设置manual避免backfill，源只取当前张，撤销按受影响owner恢复关系/位置/状态及自动补位副作用，保留随后合法变更。新增统一目标枚举、受信Shelf合并面板、顶部全文搜索去重/数字中列/来源日期及长名独立省略。Detail和Calendar当前阅读共用日历叠放翻页与守卫；拆分留日历、主动挂上整叠恢复。编辑/删除恢复/迁移/存储备份都保全并验证。
- [x] 单元RED→GREEN：归档目标/剩余源/去重全员搜索/容量补位/重启验证/拆分挂回/历史与删除恢复/撤销。
- [x] source Electron RED→GREEN：单入口/合并目标面板、顶部搜索、三列长名350px、不动真实数据的取消、归档后日历阅读、IO与IME。
- [x] 两轮合同对照审查、全量verify、双端新增/受影响实包、提交push/私有发布读回/owned清理和操作报告。

R5-27用户已确认并要求写入：收起为整理首项；一级条件撤销换上限实际成功且有效记录，日历/新建一致，整理不重复；其他动态撤销只一项且无记录隐藏。替代旧主菜单收起/子菜单swap安排，纳入Task5及终审。

R5-27最终覆盖：一级有效挂上/换上动态撤销只一项；整理仅收起/合并/拆分/自动整理及对应四种动态撤销之一。支持撤销收起完整恢复和自动补位回滚，日历/详情/新建精确名称共享。用户确认最终全文布局并授权严格落地。

2026-10-14测试范围修订：用户要求只测新增与受影响功能。旧门禁定义保留；复用必须绑定确切生产文件/编译指纹。Windows构建与安装预检38489171294已过（80相关单测+类型/构建+5源套），其中源码专用fixture误放实包列表的拒绝保留，日历实际通过；38490095906复用同一SHA256安装包与359输入执行剩余实包，并将详情保护移回源码入口，不重复已通过部分。

2026-10-14最终技术收口：源码/tag6135608，Windows构建/保数据38489171294＋同包定向续测38490095906成功；Mac当前22常规＋FAST及英文浅深菜单专项通过，未变旧门禁按指纹复用。两轮合同核对、清理和Release412225874十附件摘要读回完成。用户物理与体验验收保持待办；main后续文档/工作流提交不是包源码。
