# 第五轮追加：两轮合同对照审查

最新依据为正式第五轮文档R5-18至R5-27，26/27覆盖历史候选。当前阶段：第一轮源码对照及独立review修复完成；第二轮按用户最新要求核新增及受影响实包，旧功能按指纹复用，双端定向验证与输入绑定完成，发布读回单独记录。既有0.0.31验收不覆盖新增WIP。

| 合同 | 实现与正反例 | 当前证据 |
|---|---|---|
| R5-18分组底座、独立纸张与旧数据 | clipModel/ideaCommands/clipCommands；同组跨标签正例、跨组与未分组异标签反例、schema3原字节保护、旧混组删除恢复 | round5Grouping、round5MergeTargets、repository/storageLocations单测；group-filter原生 |
| R5-21独立筛选、交集、展示投影 | ideaVisibility与Shelf；匹配隐藏成员，全文复制/拖动按当前成员，退出筛选不改真实叠放 | round5ShelfFilter、group-filter与filter-ui原生 |
| R5-22顶部轻搜索/全部标签/六行与动态高度 | ShelfFilterPicker/CompactPopover；输入法、键盘、外部关闭、屏内与大量长名 | filter-ui8场景；picker-style8场景 |
| R5-19分组优先与三页签 | ClassificationManager/Calendar/元信息；已移除独立滚动与默认保护 | 原R5/R4分类回归、group-filter |
| R5-20同屏避让与手动位置 | manageGeometry/index；真实纸张障碍、16/12DIP、小屏适配、有效跨屏保存位置/断屏 | round5ManageBounds；window8项及31秒回收；物理多屏单列 |
| R5-23真实ready与复用 | session/request首帧确认，重复打开coalesce，保留30秒回收/保存/IME | window原生及此前同环境15例性能；当前6135608同生产指纹样本warm29.7ms/cold241.1ms/回收后193.0ms，未外推提速 |
| R5-24/25正文后pager、铃铛首位、标题跳转 | Detail/CalendarStackReader/IdeaReader/ReminderControl；单张隐藏、浏览编辑同位、18px操作图标 | pager8场景、reminder12项、visual71项；IO/IME反例 |
| R5-26完整目标/单入口/三列/目标落位 | stackCommands/ShelfMergePicker；全成员搜索去重、旧溢出和筛选显露目标、长名省略、当前源仅一张 | MergeTargets单测、merge-picker10项；picker-style8场景 |
| 日历持久叠放、拆分与整体挂上/换上 | archivedClips/capacityOverflow；重启/全拆/删除恢复/改组确认，连续换上ID唯一 | stack14类原生；Placement/Grouping/MergeTargets正反例 |
| R5-27单有效撤销与菜单分流 | index有效记录，一级hang/swap与整理四动作不重复，普通打开/复制/筛选不生成 | stack原生、旧merge/split/capacity/native-menu回归；真实Mac菜单截图 |
| 保存/IME/IO/后续合法修改保护 | owner-scoped undo、页码generation、原编辑和草稿guards、CAS拒绝旧修订 | 单测红绿；stack/pager/inline/settings原生；旧失败保留 |
| 全链统一设计语言 | 原生Menu仅两级，两个搜索面板共用中性轻量菜单基座，功能槽位与密度可不同 | picker-style：两面板computed样式与8场景；真实Mac一级/整理截图 |

## 独立审查与一次修复

只读独立review：0Critical、8Important、0Minor。重要项为：撤销覆盖后续日历拆分、整叠换上UI与后端不一致、连续换上ID碰撞、容量owner遗漏、筛选显露目标落位错判、跨屏手动位置丢失、旧混组恢复误套新合并规则、owner全局身份/状态校验缺失。均已用独立单测或原生红例复现并修复；最终verify398通过/4Windows专用跳过，typecheck/build通过。日志见acceptance/evidence/round5/group-filter/review-*-red.log与review-final-verify.log。

不存在未处理的独立review重要项或延期minor。review未独立判断的包/Windows/物理环境/整体视觉/最终性能由执行者按本计划完成；低层证据不升级为设备或用户验收。

## 第二轮：历史候选过程（最终结论见末尾）

最终生产修改e51cb72；后续提交只校正测试与监督，最终构建源将按双端清单记录。Windows真实回执与受控原生红绿确认了页码检查点/CAS并发、面板预保存与迟到blur的三处边界；仅补已有保护与真实焦点判断，不改层级、不放宽权限或修订号。源受影响回归与398单测/4Windows专用skip通过。最终执行中：Mac实际DMG、Windows完整源/NSIS/安装重装普通卸载保数据；菜单与文档一致性；源/tag、构建输入、包SHA256和远端Release读回；清理归属与回滚材料。

第二轮进行中补记：e51实际Mac24套完整绿；Windows已修复真实迟到blur并通过旧菜单失败点，但分类UIheld-ack用例未过且退出保护拒绝，原日志/ZIP归档。58ca0b6仅诊断与既有外层180秒fixture监督，不改生产；当前完整Windows38453315931继续。不能以Mac或单测数量宣称双端交付已完成。

第二轮继续：58分类18项正常退出通过，87实际Mac分类18/pager5/merge10通过；87包36编译/资源hash及asar与e51完全相同，可按fingerprint复用24套实际包证据。Windows原生菜单探针两次暴露不适用的#32768假设与Playwright shell启动器PID，已按Electron44.7与本地Playwright1.62源码校正并保留旧失败；真实两级Esc及callback/外部点击门禁保持，当前5e86完整Windows38459402641待核。无失败节点冒充发布。

Windows5e86菜单原生状态门禁已绿。后续stack挂回失败通过真实receipt与Mac1024红例确认是测试硬hang忽略碎片空间的合法拒绝；38测试走实际详情挂上/整理挂上并保留拒绝不写入反例，1024与真实Mac宽全14类正常退出绿。生产不变，Windows完整38461802440及实际NSIS仍待核。

间歇启动补核：38的settings首窗30秒超时没有业务检查，根因未确定；fb只加被动源启动/原对话框日志，不延长等待/重试。Mac连续20冷启动真实ready与正常退出通过（前19次PID全部退出后再启动），再完成36项设置，保留旧失败，不将其改写为已修产品bug。Windows完整与实际包仍待核。

保存边界补核：fb完整job证明旧Calendar编辑后返回失败。独立受控2800ms旧组记忆与合法窗口bounds提交复现rev2→3的严格版本拒绝；新版分类RPC仅准确返回CONFLICT（所有权限/owner/CAS保留），客户端只在可证明仍同live/session/未删同组且revision增加时最多fresh重试一次。10单测与408+4skip全verify、6受影响源套绿；真实轨迹CONFLICT(rev2)→成功(rev3)、完成编辑后12张/原scroll/search/restore过。IO/INVALID/组或session变化/退役/二次冲突仍阻断。Main/Renderer指纹变，Mac新实际25套与新性能及Windows687完整38469711750全部重跑，不复用旧24。一次settings首窗超时原因仍未独立确认；source/包各20冷启动加入该设置门禁，失败原资料保留。

2026-10-14 最终ready复用补核：生产12d32e0保留已确认窗口的session、日历搜索/阅读位置、管理搜索/返回位置和设置页签，仍先执行真实保存/IME/IO guard，再以真实ready确认显示。8项源检查含同一renderer turn的3次并发、隐藏缓存重开、实际目标切换及31秒正常回收均通过。当前96e5cba Mac实际25套执行到packaged-round21时，旧脚本仍把openManage当重置导航；Windows96更早在同类more-menu旧门禁停下。已按真实返回控件修正测试前置，不删除16场景、空正文、通知路由或退出断言；不是生产行为回退。隐藏管理首次openSettings本次Windows4项及正常退出通过，前次偶发根因仍未独立确认。最终双端门禁继续，未创建新版tag/Release。

导航测试最终校正：more-menu16场景、title-only详情/日历两入口、reminder12类源回归全部退出0且正常退出/清理；Mac实际packaged-round21的24场景及容量/位置退出0。新增辅助函数只点实际返回按钮并等待可观察导航变化，保存/IME失败会阻断返回，不直接修改页面状态或放宽deadline。当前冻结源码f026d26，359构建输入，verify408通过/4Windows专用跳过、type/build0；完整Windows38476641307与新Mac25套重跑，避免把前候选包当最终包。

最终f026d26 Mac25套实际DMG完整退出0，所有成功套正常退出；Windows该版原生键盘菜单红例记录owner1376但foreground5996，三次真实外部点击关闭均通过，RPC打开不等于OS上下文点击。测试ad9b6eb改由真实系统右击纸张，先确认foreground为实际runtimePID，再保留1→2→1→0、每个Esc和callback断言；不改生产焦点或增加Esc重试。Windows完整38477185054在执行，新版Mac同源重建后实际25套再核。

第二轮真实入口缺口：源码复查发现托盘和挂绳右键日历仍走旧openBrowse，仅内部bridge复用不足。原生菜单action红例一次同turn3点击令session13→16，确认实际重置而非假说。统一bare-calendar到同一coalesce key/openBrowse，在prepareViews、ensureManage及quitting之后才复用确切confirmed window/session/mode；所有保存保护与真实ready保留。增加挂绳/托盘各3次真实MenuItem.click并等待新request的真实view-ready，再查同session、仅1request及搜索保留。当前源10项及相关原回归执行；ad9 Windows取消为被替代候选，不算完整PASS。主进程指纹改变，最终性能和双端实际包再绑定。

所有日历入口同源修复47ec9d2：新增挂绳/托盘入口红→绿，窗口10项与隐藏管理4项、旧日历、16场景菜单、设置20冷启动+36、pager保存故障、stack14类，共7源套退出0。完整verify408+4skip/type/build0；生产仅6行共享/coalesce/reuse接线，不动层级、guard或存储。新版性能15例、Mac实际25及完整Windows再次绑定当前源。

旧迟到删除门禁校正：47 Windows主要R5源套均过，后在final-reader-placement工作流首两项失败，原脚本将重复打开视为新的会话。测试改经真实settings→calendar切换来建立新session，并在保留搜索结果的旧阅读页面通过返回进入搜索；不修改主进程、权限或保存guard。Mac源7项业务检查及2项原始状态回执共9项全绿、正常退出且profile消失，跨session2→4与同session4→4，当前新正文/编辑器均保留。7a76ad8只改这一个测试；359输入，完整Windows重跑。新Mac包将核整个App269文件+36编译资源+asar是否与47全25套运行对象逐字节相同，满足才按指纹复用该25套并补当前包代表回归，不冒充重跑。

安装包预检脚本最后适配：Windows7a的412单测及全部8源阶段成功，NSIS已安装、真实App基本校验与外观已过；预检packaged-split-worker仍找一级Split/Merge及Undo clip action，所以整体失败，不记录安装保数据通过。按R5-26/27改读Organize→Split stack/Undo split/Merge…/Undo merge，合并必须无第三层submenu并在实际面板选唯一目标(2张)。原4类关系/全文/撤销断言保留，当前Mac实际包4项及正常退出绿。2e73712只改此测试，仍完整Windows重跑，无skip/关闭门禁。已过源阶段的完整raw job/manifest另存，失败附件在SHA/CRC校验归档后处理。最终候选物理与用户验收仍false。

2026-10-14 实际Windows2e：完整源码及NSIS安装/重装/普通卸载保数据均已过，实包25套行进至merge-picker第6检查后失败；Main保存页码但没有undo IPC，旧资料保留。独立同turn源码红例(标题选择→撤销)同样页码保存、无alerts但undoReplies=[]，证明早先排队的choose完成会递增intent，取消独立启动的Undo。Detail撤销接入已有selectionQueue，先前选择结束后才启动token/prepareLeave/flush/fresh revision/受信RPC，原IO/IME/会话/CAS保护完整。源码红→绿与永久fast模式均恢复关系并正常退出。日历同turn原实现已过，未改变日历。正常点击与源受影响6套/全verify在执行；新增FAST模式与原普通点击分别加入CI源/实际包，不删门禁。此次Renderer代码改变，之前603相同的复用证明不再覆盖最新代码，最终Mac完整26套/Windows完整必须重新绑定。

## 2026-10-14 最终定向验收范围

用户明确要求只测新功能与受影响功能，不从头重跑。重复完整Windows运行已取消。定向工作流38489171294从独立工作流提交b030a26精确checkout包源码6135608；不改生产源码或降低保存/IME/IO/权限/CAS保护。Mac当前22套实包和FAST标题撤销已过；旧英文日历菜单样本单次间隙失败保留，英文浅深两场景专项检查及正常退出通过，根因未确认。旧容量和标签位置按主进程及共享模型Git对象相同复用47ec9d2；该时点359份双端输入绑定与发布尚待；现已由最终结论及release-verification.json确认完成。范围证据targeted-validation-scope.json。上文候选过程逐段按其记录时点阅读，不能当作最终包当前失败或通过的合并结论。

## 最终两轮结论

第一轮：R5-18至R5-27逐条对应源码及正反例，分组/独立筛选/顶部搜索/管理保护/位置与ready/详情pager与铃铛/目标归位/日历持久叠放/菜单及共享有效撤销均有证据。独立review的8Important已完成红绿修复；随后发现的页码持久边界、合并prepare保存、旧分组记忆合法冲突、真实日历入口复用与标题选择/Undo队列由执行者补原生红绿，未冒充再次独立review。保存、IO、IME、权限和CAS反例保护保留。

第二轮：当前Mac与Windows定向实际包核新合同、菜单链及中英浅深宽窄；Mac22常规+FAST+英文浅深菜单专项、Windows80相关单测及源/安装预检/实际9常规+FAST+先前当前日历实包均通过。源专用fixture错误路由的原失败保留并改到正确源码入口，不修改生产。旧容量、位置及其他未变旧功能依确切生产指纹复用；不声称全套重跑。359项双端Git输入一致；实际NSIS提取确认Renderer JS一致、CSS/HTML仅验证过的行尾和派生资源名差异。实际安装后输出一致，安装/重装/普通卸载保数据通过。物理设备与用户验收仍false。Release及main读回另记对应证明。
