# 发现

R5-17：用户否决大面板，确认三行小菜单。原exportBackup含校验清单，restoreBackup拒绝未知附加文件；文档独立导出，不混入备份目录。当前无DOCX运行依赖。UI保留按钮行和联系栏，仅在隔离测试数据库验证。

基线main ac701d4。分类打开强制窗口至少350DIP；inline仍ProjectOptions/select；browse显式拦composer；第四轮测试旧浏览器肩型和长按直接停用需要按已批准合同更新，不放松数据/关闭断言。

分组迁移核心红例2→17单测绿；原生首轮7检查绿，扩展共存/迁移/详情返回检查已绿，日历元信息检查首轮因未进入卡片列表超时（fixture），改真实搜索入口后绿。i18n旧预期Project与新版Group冲突，按用户术语更新预期，完整verify344+4skip/类型/构建绿。旧第四轮流程11、UI18已按批准新合同适配并保持历史/IO/关闭/重启原断言。R5-10用户明确纳入并要求全局检查。

Task5收口：0.0.30（第五轮R5-13至R5-16）已完成双端技术验证、私有发布、文档同步与本轮自有垃圾清理。构建/tag源码 f81cafeab2acad10e31d21c388e0c265656dccff；Windows完整运行 38346921371 success；Release 411296088，10份附件大小/SHA256读回一致。main后续文档提交不改变包来源。
Mac349单测通过、4项Windows专用跳过；Windows353全部通过，类型与构建通过。Mac实际DMG8套回归、Windows完整源/实际包/NSIS安装、重装、普通卸载保数据通过。两端源和实际包各36项设置/存储行为、16个名称聚焦场景，32项联系行为、24个布局场景；335构建输入一致，306份文本差异仅经过逐字节核验的LF/CRLF。
联系栏在设置三个页签底部，沿用原配色和形态，按双端字体与可用宽度自然排布；邮箱完整可读，复制成功/失败使用短暂小字。固定GitHub、mailto和复制动作的系统边界已验证，实际浏览器/邮件客户端、物理IME/DPI/多屏和个人手感仍独立确认。普通设置与草稿双向共存；备份自动检查点，迁移仅在实际操作时要求关闭新建，原输入/未保存设置/退出保护保持。日历更多菜单顺序为最近删除、标签与分组、存储与设置。
独立终审的托盘忙碌状态问题已按真实Tray红→绿补修，操作结束/取消/失败均及时刷新。首轮Windows启动未进入功能断言，原失败ZIP/日志保留；只增加观测，未放宽门禁，最终完整运行已通过。
本轮Mac 38个自有临时路径均不存在，8份失败残留先归档校验再清理；早期退出未成功的进程按专有PID、启动路径及父进程核实后停止，没有按名称杀进程。挂载、空隔离目录及当前重复构建包已清理，真实App仍0.0.28，未覆盖个人数据。22个旧Release附件及本地0.0.22/23历史包保持。
Actions已删除本轮安装器副本和已归档失败UI产物，最新验收UI继续保留；当前37份约189.8MiB，验证门禁、私有状态与预算保持。本月累计提醒不会因删除立即归零。
[操作报告](</Users/lihongwei/Desktop/晾念头 : Thoughtline/app/docs/releases/round5-v0.0.30-delivery.md>)；[私有安装包](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.30)。formalAcceptance/physicalAcceptance保持false，等待实际使用反馈。

R5-17实测：17导出行为/8菜单场景在Mac源与DMG均通过；macOS textutil可回读标准DOCX。Windows首轮360单测通过，但旧round2-arrange首次窗口URL超时未进入cases，原ZIP11796716448已校验归档，同源完整重跑。读取GitHub出现间歇TLS握手超时，不改仓库权限或预算。

Task6收口：0.0.31（第五轮R5-17）已完成极简导出、双端技术验证、私有发布、文档同步及本轮自有垃圾清理。构建/tag源码 9d4ea599e71b4cb85707145ed6ca46e674cfafb0；Windows完整运行 38369828529 success；Release 411486213，10份附件大小/SHA256读回一致。main后续文档提交不改变安装包源码。
数据与备份页仅一个“导出”入口，三行小菜单为导出TXT、导出DOCX、备份数据。文档依次含分组、标签、名称、完整正文；按分组归集，含已收起及已移除分类下的有效内容，不混入草稿或最近删除。原JSON完整恢复备份保持，未增加范围控件或新页签。
Mac356单测通过、4项Windows专用跳过；Windows360全部通过，类型与构建通过。Mac源码6套、实际DMG9套回归通过，最后仅增加测试诊断后重新打包，asar/所有编译输出与已验证包完全一致，最终DMG再通过17项导出行为及8个中英浅深宽窄场景。Windows完整源/实际包及NSIS安装、重装、普通卸载保数据通过，源/实际包各17项导出行为及8个菜单场景；340份构建输入同源。DOCX独立ZIP/XML及Mac文本读取器回读通过。
早期Windows存在初始URL等待、仅标题详情自动保存等待超时，原日志/ZIP保留。后续诊断明确旧自动整理用例误用已按30秒规则回收的隐藏窗口；Mac等待31秒稳定复现相同错误，再通过正常入口重开窗口后7项原断言全部通过。仅修测试生命周期并补诊断，不改产品交互或超时门槛；其余未独立复现的超时不宣称为产品bug已修复。
Mac 23个本轮隔离路径确认不存在；失败残留先校验归档再清理。测试进程按自有PID/路径核实后退出或停止，最终挂载/隔离启动空目录/重复构建包已清理。真实应用及个人数据未动，旧Release和历史安装包保留。
Actions安装器副本与三份本轮已归档失败UI已清理，最新验收UI仍保留；当前38份/272741961bytes。原验证门禁、仓库私有状态和预算保持，累计账期用量不会因清理立即归零。
[操作验证报告](</Users/lihongwei/Desktop/晾念头 : Thoughtline/app/docs/releases/round5-v0.0.31-delivery.md>)；[私有安装包](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.31)。原生自动验证与受控系统保存边界已完成，个人设备文件选择体验、Word/WPS排版和物理IME/DPI/多屏仍独立确认，formalAcceptance/physicalAcceptance保持false。

Task7源码事实：boundsFor y=workArea.y+24；fitManageBounds只有屏内约束；分类/设置重用Manage并重设顶部默认；最近删除是Calendar内部nav.level=trash。host.showShelf含moveTop，Mac shelf为panel，两窗alwaysOnTop。默认避让和层级需一起验证；卡顿无当前耗时证据，方案先分阶段计时。UI技能空间查询首轮偏VisionOS，窄化命中Web content-jumping只作位置稳定原则参考，不当作Electron平台事实。

R5-20纠正：用户指出Manage存在期间挂绳保持展开，普通同屏页面往返不会重显。shelfState中非composer锁阻止自动收起；日历/分类/设置保留manage锁，最近删除为内部go(trash)，edge.render仅before=hidden才showShelf。撤回moveTop是用户这条操作链根因的推断。方案收敛三种Manage形态的出现/切换/返回位置与性能，现有层级/显隐不预设改动。

Task7模型11项新增行为已绿。全量首次27失败：3项待实现几何；余24为新schema4输出、旧同标签跨组新合夹及同组改标签自动拆分合同变化。逐项调整有效合夹夹具为同分组，并保留历史跨组快照读取测试；位置分離测试改为真实改组而非改标签。未删除原全文/位置/身份/旧CAS/旧备份断言。单测夹具第三标签初用claude（新默认不存在）导致无效，修成已有preset:colleague，生产不新增默认标签。

2026-10-13 23:25 用户要求暂停并交接：此后不继续生产修改、不打包、不提交/推送。当前npm test 385pass/4Windows skip、typecheck退出0；pause-full-unit.log/pause-typecheck.log。新增R5-26原生6业务CHECK不等于整体PASS，正常离开第7项尚未通过；obsolete-page-owner-red.json保持原FAIL。旧group-spatial-green.log实际FAIL，当前+12几何读数需按width/2校准；不再把未证实pointer假说当根因。双端新版实际包、两轮最终合同审查、交付清理仍未完成。
检查点和可恢复源归档：/Users/lihongwei/Documents/Codex/2026-10-13/thoughtline-r526-pause-20261013-232510
77源码/计划文件归档，Git展开469变动（含证据）；本轮精确原生runner/R526 Electron已无活动，失败55文件逐SHA验证归档后清理；只停已登记原型6011/49324，个人App68573与归属未明Electron95997保留。其他历史/全轮临时对象未宣称全清。
外部主文00/07/第五轮暂停状态和新接续提示词已同步；通用文档3处去重补强，升级05无新增候选。保存责任与IO/IME门禁不放宽。任务7保持未完成，0.0.31既有交付不重置。

接续复现：当前源码重新build后merge-picker完整7项通过，closeManage返回ok且正常app.close/数据清理通过（resume-merge-owner.log和merge-picker-darwin-source.json）。既有owner防护在本次条件有效，无需再猜测或追加生产修复。旧group-workflow几何断言用硬编码+12，真实peg宽26，改为width/2；保留端点、全部三夹可见、早放手、停留合夹断言。标题列表按当前获批pager入口展开后选标题，不能依赖已移除常驻标题。

完整stack原生矩阵先通过9类行为，归档改组确认红例复现：inline只查clips导致确认缺失并自动拆分写入。Inline/Composer改为共享storedClipFor覆盖clips/archivedClips/capacityOverflow，不改保存或IME协议。stack-owner-confirm-red.log为改前失败。group按稳定clip ID修正后完整绿（resume-group-id.log），实际成员/原文/位置/正常重启保全断言保持。

R5-26全目标审查红例：旧hanging溢出夹被当挂绳目标。按实际无筛选物理layout可见ID判断目标位置（隐藏筛选成员仍随真实位置），列表和提交共用width。当前源仍仅挂绳，日历目标完整成员转manual archived，不参与补位。overflow-target-red.log保留。此为最终合同落地缺口，不新增范围。

设置回归33通过/3失败：第一项在waitHidden已确认新建不可见后托盘write仍disabled，后两项被失败善后再开writer污染，不独立归因。closeConfirmedComposer在host.closeComposer返回后刷新真实Tray；原hide回调可能早于native可见性终态，必须按完整close后的状态刷新。保持保存确认前不关闭、迁移门禁不变。保留resume-regression-3原失败与隔离回执，重新完整设置36项验证。

Windows9a94 402单测/类型/构建通过，旧round2-workflow只从一级找“收起当前念头”失败；按R527整理→收起改脚本，Mac完整9项绿，原业务保全断言保持。Mac实际DMG前20套绿；旧packaged-round3固定10月11夹具在Mac跨日后只显示近3天的新候选，>=4行断言失败并非布局；从实际“更早”入口展开后保留>=4及逐行日期/影响文字不裁剪断言，不修改产品日期规则。positioning旧原生菜单同类tag直接枚举已替换为顶部筛选面板，保留读取无写入和自定义标签溢出可見断言。

2026-10-14 最终候选47ec9d2：第二轮发现挂绳/托盘日历未共享复用，真实MenuItem action红例session13→16，已同一guard/coalesce/ready链修复。源窗口10项与7受影响套退出0；最终源verify408pass/4Windows skip/type/build0，Mac同源实际DMG25套全部退出0、36编译/资源hash核一致及隔离launcher check-only0。15样本warm30.9→25.8/cold289.2→247.8/retired171.5→205.2ms，最后一项变慢不宣称整体提升。Windows完整38478829786仍在执行，尚无v32tag/Release。旧ad9因源码变更取消，之前实际OS纸张右击、1→2→1→0与全R5主要源套通过不外推新候选完整成功；468文件ZIP/SHA归档后移除其Actions副本。最新Mac图329张归档、保留8关键图；本地重复解包269文件/333755401bytes与重复DMG清理，交付DMG保留。正式0.31回滚/暂停备份/依赖/历史tracked图片/个人App68573/未知95997保护。任务7继续等Windows、绑定、发布读回和最终清理。

最终0.0.32技术交付：Release412225874已私有正常发布，10附件size/digest读回；source/tag6135608，source359向量一致；Windows38490095906定向同包续测success，构建/安装保数据38489171294复用严格摘要。无新增整套重复，物理/负责人false；详细边界见round5-v0.0.32-delivery.md。
