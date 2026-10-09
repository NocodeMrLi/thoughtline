# Thoughtline 第一轮修复优化

<!-- CURRENT_ROUND1_STATUS_START -->
## 当前实施状态（以下优先于历史阶段记录）

main 已提交并推送 `fa45cb88105db81806e419bba5d8029af9540389`。P1–P5受控实现和阶段限定复核完成；P6源码工具修补经限定复核关闭，实际最终包仍未构建。用户追加日历双向缩放的任务fix1通过限定复核；全分支审查发现旧Reader回执丢失新编辑内容、缩放非等比形变、满绳改Agent缺少提示、包验收版本路径问题，唯一统一修复轮已完成，ONE限定复核R1–R4全部ADDRESSED，Spec／Quality Approved，现可冻结来源。日历批准Logo红夹子标识通过task fix2与Spec／Quality范围复核，350／421／500／740宽度的完整3／123计数与原图比例已受控检查；不代表Windows物理视觉通过。

| 需求 | 实施／已测 | 剩余验证 |
|---|---|---|
| 1 分组即时删除 | 长按、连续删除、完成／退出不恢复、系统项、重启与整理撤销受控通过 | 两端物理输入与交互 |
| 2 三种拖动 | 起手意图、空位／合入／取消、反复拆合ID顺序内容、正文text/plain及显式复制受控通过 | 两端纸张拖放与目标接收 |
| 3 微信／豆包／WorkBuddy | 保留用户三类真实反馈与已补充版本；源端协议检查与受控载荷已测 | 三个真实输入框全部独立未测，未宣称修复或不支持 |
| 4 即时翻页 | 合并后台写入、旧世代拒绝、失败重试／离开拦截，受控250ms慢盘时即时显示 | 真实偶发慢原因与两端连续输入 |
| 5 新卡可见 | 左中右统一空位分配、保手动位置、新建／拆出／恢复真满提示受控通过 | 满绳改Agent提示已RED/GREEN修复和限定复核；100／125／150%物理缩放、多屏与窗口变化 |
| 6 原地自动保存 | 四字段、CAS、合成IME、关闭最后flush、失败保文受控通过 | 同／跨会话旧Reader回执丢文已RED/GREEN修复和限定复核；真中文输入法及物理快速切换／关闭 |
| 7 收起／删除 | 日历找回、软删恢复、永久单独确认、当前选择稳定受控通过 | 两端完整用户流程 |
| 8 窗口／材质 | 清洁拖动区、calendar调整大小／位置、clamp、vibrancy／acrylic及降级已实现 | 真实副屏断开与系统辅助设置；原生Liquid Glass未接入 |
| 9 详情图标 | 一行五操作、group才拆出、更多数量、hover／focus完整提示已实现 | 物理手感与可发现性 |
| 10 念头日历 | 索引／按需分页纸卡、日月年／范围／搜索／状态／最近删除／日期冻结／scroll已受控测，缩放任务限定复核通过，原Logo红夹子标识窄窗范围复核通过 | 六方向等比形态已RED/GREEN修复和限定复核；真机手感待独立QA；不是全列表永久DOM硬上限 |
| 11 目录／备份 | 排他复制＋SHA／完整加载再切换、旧副本保留、独立manifest与实际恢复重启、failclosed受控通过 | 真磁盘／权限／空间故障；恢复采用已验证手动步骤 |

P5 Windows runner `37929850895` 在 exact `fa45cb8...` 的preview.1上成功：182单测、类型、构建、严格schema3安装／数据保全／PE检查。P6候选Mac源全量178 passed／4 Windows-only skipped；这均不是最终preview.2包证据。P6 fix1独立复核关闭S1/S2/Q1/Q2，构建后完整输入检查须实际包阶段再运行。

源码推导、单测／故障注入、受控Electron、冻结包、Windows runner、物理两端、真实接收框与用户验收各自记录。物理Mac／Windows及真实接收端当前未测，用户验收不作通过声明。所有原失败证据保留；清理仅本轮自有目录与PID，正常保存退出后核实，不清依赖／旧包／其他工作树。原方案与新增交互在笔记库完整保留，归档清单可恢复。
<!-- CURRENT_ROUND1_STATUS_END -->

完整产品方案：`/Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline/Thoughtline第一轮修复优化.md`。本轮基线main `ff39779cbeb562083f3574db4d2998693091b0be`，仓库private，G7未整合；旧发布v0.0.16-preview.6不改。早期开发候选为0.0.17-preview.1，当前准备0.0.17-preview.2；不替换用户安装。

## P1 项目编辑（2026-10-09）

项目选择器500ms长按进入整理，×立即原子清除所有已挂/已收起记录和草稿中的同名project；实体仍由实际归属汇总，未更改schema2。正文、ID、物理夹与当前页保留。完成／退出只关面板，未分组无删除入口。减少动态效果去抖动。支持逐个连续删除，无逐次确认。整理撤销快照同步清除已删除项目，不复活分组。

独立FileRepository重启、项目数据3项红绿、类型检查与全量验证见 `acceptance/evidence/round1/`；隔离Electron pointer/DOM/IPC验证长按、删除、完成、退出、系统项、撤销与重启。`project-native-attempt1.log`保留Playwright稳定性等待与抖动冲突；第二次改为鼠标坐标点击，全部业务断言保持。此证据不是物理Windows/IME/外部输入框。

本轮方案归档回读216行18134字节，初始SHA256 `72ed476ee2f3fb03d7f65c55fa941171d3e56cadeccfaf6cbe8ea642b94ed183`。默认cwd已不存在改用明确目录；Mac Perl locale失败改LC_ALL=C。ui-ux-pro-max scripts/data安装为普通占位文件，已应用阅读所得UX规则，不改技能安装。

用户目标版本：Windows微信4.1.13.65、WorkBuddy5.7.6、豆包QQ浏览器；Windows版本、QQ浏览器版本和拖动起点未知。微信成功/豆包间歇/WorkBuddy反复失败是用户反馈，真实目标独立复现仍未测。

## 待做

P2：三种拖动、外拖、翻页测量／合并保存、全绳空位。P3：原地编辑／自动保存、最近删除、窗口拖动与统一图标材质。第二轮日历／历史检索／目录迁移与备份实际恢复。真实双端IME/DPI/多屏/焦点/目标接收、独立QA、用户验收待完成。旧安装PID28102与Electron30628保留，测试仅独立临时目录与合成文字；测试自有PID和数据清理receipt已保存。

## P2 整理、空位、翻页（开发检查点）

纸张上缘留白拖当前一张，木夹拖整组，正文保持text/plain复制拖动。合法空位预览、600ms兼容夹子合入，放开提交；无效落点/Esc不改数据。单纸30次往返拆合单测保存ID/顺序/正文；隔离Electron空位、兼容合入、Esc检查见paper-native.json。分配器搜索全部空隙，新建/拆出/恢复前固定旧位置；精度容差避免合法手动位置被反复归一化改写。真满新建保存后直接打开详情，显示“已保存，绳上暂时放不下”；拆出/恢复在辅助窗口提示。

翻页由同步ref累积点击，100ms合并/300ms最长等待后台保存；主进程只更新当前夹页并串行处理序号，旧请求不能覆盖新页。关闭/退出/整理前flush，失败阻止离开/整理，重复同序号可以重试。受控磁盘250ms延迟下三次点击从旧1/4变为即时4/4；观测9.2ms与28.6ms（两次）显示，IPC约265ms，序列化/写盘/广播见page-timing-*.json。这是受控因果测试，未独立复现用户偶发慢的设备原因。

Windows P1 CI37915342457 verify/package/manifest/parse通过，安装预检失败：隔离launcher严格绑定旧preview6版本。失败证据保留；旧脚本归档，新脚本和预检目录更新为0.0.17-preview.1，仍严格核对版本和独立目录。下一阶段源码CI重新验。

外拖接收矩阵和逐次验收步骤见acceptance/ROUND1-DRAG-MATRIX.md；三种真实接收端独立结果仍未测，不宣称WorkBuddy已修好或不支持。普通复制入口保持显式触发。

### 材质能力依据

核对本地Electron44.7.0类型及[官方BrowserWindow API](https://www.electronjs.org/docs/latest/api/browser-window)：vibrancy是macOS系统材质，Windows backgroundMaterial提供mica/acrylic等；未发现本地直接NSGlassEffectView桥接。[Apple NSGlassEffectView](https://developer.apple.com/documentation/appkit/nsglasseffectview)是Liquid Glass接口；本机macOS15.3.1不据此冒称原生Liquid Glass。本轮采用现有vibrancy/acrylic能力并按减少透明度/高对比降级，原生Liquid Glass待对应系统与桥接验证。未变更系统偏好。anysearch调用list_domains返回API tool not found，按已授权核实范围改查官方来源，未保存任何新key。

### P2 阶段验证闭环

2026-10-09 限定独立复核 Spec / Quality 通过，3 项 Important（离开失败、跨窗口重试、快速翻页展开）及 detached checkpoint 生命周期已修复。全量 verify exit0，115 passed / 4 Windows-only skipped，类型与构建通过。隔离 Electron 交接四场景、收起失败/重试、满位提交队列场景通过。queue 早期两份名为 green 的日志实际上失败（textContent 少了调用）；保留原日志，修正后 p2-queue-fixed.log 与最终 JSON/cleanup 才支持通过。见本目录 acceptance/evidence/round1/p2-*-report.md 和 p2-recheck.md。

文档小任务：21 篇历史阶段文件及历史版本/原始交付移至笔记库“归档”，保留完整方案、当前设计和正式交付；链接与入口提示前的原文及 SHA256 清单保留，可恢复。历史证据字节未改。

P2 main commit `97875dda8d85201ff088218a347f7de2c301dc7e` 已推送；Windows CI `37921662961` 对相同 headSha 完成并 success，严格隔离launcher的新版本绑定已通过安装预检。run JSON 与完整日志保留。该 CI 只验证 runner 类型、单测、打包、安装保全和来源，不代表物理 Windows 或外部输入框通过。最终交付包待 P3–P5 完成后另冻结，当前 CI 包非最终交付。

## P3 数据底层（未阶段提交，UI 接入中）

schema3 输出与新写入；旧 schema1/2 首次写前保留原字节备份。旧记录创建日按原 timestamp 偏移日期冻结，标 legacy-offset；新建按创建瞬间本地日期与时区。最近删除保 ID、正文和原状态；编辑四字段 CAS。未确认输入与过期 IPC 保护将在 UI 接入验证。数据范围 75 项覆盖单测 exit0，异常年份和旧 schema2 新建日期先红后绿并复核关闭。全工程 typecheck 尚有旧 Manage 状态类型错误 T1，交日历接入处理，不能写全工程通过。报告和失败证据见 acceptance/evidence/round1/p3-data-*。

回滚限制：旧 preview6 只识别 schema1/2，不能直接读取 schema3。需保留新旧副本，用升级前 snapshot.schema2.backup.json 等原备份在独立目录验证旧包。升级后新增、修改及最近删除不在旧备份中，不能承诺无损降级。目录迁移、独立备份与实际恢复待 P5。

## P3/P4 UI 集成检查点（独立审查中，未阶段提交）

原地四字段编辑、350/1500ms 自动保存、IME guard、最近删除、日历日/月/年、9+18分页和返回滚动、辅助窗口图标/材质/拖动/位置集成已完成。最后生产输入 verify exit0：163 passed /4 Windows-only skipped，typecheck/build通过；相关合成 Electron 回归见 p3-ui-report.md，不代表安装包或真机。

标题列表绕过保存 guard 的原始代码缺陷有真正 RED/GREEN；Agent 拆出保持同 ID 的 RED 为临时移除保护的断言敏感性测试，不能混作用户问题复现。日期格点击来源120ms过渡及减少动态效果、实际窗口 bounds 关闭重开恢复有受控证据。早期项目面板测试两次 Composer 焦点等待超时，后隔离两次通过；失败仍保留，不归因电脑。

独立审查发现从合夹收起当前纸后残留旧夹页码0/2，待修复/复核；该阶段暂不写通过。Windows schema2预检完整预期迁移交P5，实际冻结App测试交P6。清理审计只读检查29份P3相关收据的183个PID均退出；部分收据未记录目录路径，不能独立stat复验，以cleanup助手成功返回为证据。旧PID30628仍在。证据与报告保持历史版本，未覆盖已提交P2原件。

后续有效结论：R1已真正RED/GREEN修复并独立复核关闭，Spec无开放发现/Quality无新增阻断。独立archive-current与page-all自然exit0，新增收据含目录stat与PID审计；先前page-all人工清理的运行仍按非自然完成保留。测试脚本退出改为恢复故障、真实保存检查、正常关窗/释放锁/quit，移除app.exit与app.close竞态。P3/P4受控实现范围通过，安装包和物理范围未通过，目录迁移仍待P5。


## P5 目录迁移与独立备份（受控实现与限定复核完成）

设置显示实际念头目录/profile，可显式打开、更改位置、导出独立备份。先处理最后修改，复制排他目标、核每文件SHA256/字节数与完整快照、实际加载prepared仓库，位置配置原子提交后才切换；旧副本保留，备份不切换位置。manifest验证与新空目录实际恢复、两次重启完整快照检查见p5-storage-report.md。

独立审查R1复现检查后目录失联时底层新建空库；修复将configured禁止创建策略传入实际repository，prepared复制仓库也禁止创建。真正RED3项→相关25项GREEN，类型/构建与实际Electron启动时序故障进入恢复提示正常退出通过；默认首次启动仍能建库。限定Spec/Quality通过。P5最后全量175 passed/4Windows-only skipped在R1修复之前，之后有上述相关覆盖；最终全量在P6冻结时执行，不混用。

Windows严格schema2→schema3完整预期、首次旧原字节备份/restart以及位置配置保全预检已修改，尚未在Windowsrunner执行。5个原工作流根目录、72个去重PID与R1另2PID均有正常退出/stat清理收据；父核验无遗留，原失败日志保留。物理磁盘断开/权限/断电、真实双端IME/DPI/多屏/接收端与最终包未测。


用户追加动效：日历日／月／年进入与返回参考苹果手机日历的自然缩放，保留空间联系；现有120ms小幅淡入未完成这项补充，须最终冻结前完善。方案原话已追加笔记库，动画不能阻塞点击或丢失历史位置/编辑最后修改，减少动态效果降级。参考 [Apple Motion HIG](https://developer.apple.com/design/human-interface-guidelines/motion) 的连续/及时反馈原则，实际iPhone日历手感未并排验收，不声称一比一原生实现。

## 最终统一修复实施记录（限定再审中）

四项最终发现已完成统一代码修补与自审，尚未以此宣称最终审查或包验收通过。旧删除回执不再负责导航；当前快照和阅读器所有权决定稳定相邻选择，同／跨真实主进程会话的迟到回执不会卸载新的未保存编辑。日历六方向采用等比真实内容缩放，25／100ms受控帧保持中文、纸张及品牌夹子的比例。改Agent自动拆夹固定旧位置并搜索全部空位，只在本次新夹确实溢出时显示已保存及念头日历入口。实际包验收脚本从正确仓库层级载入版本；完整冻结App备份恢复验收仍待包门禁。

测试证据：`acceptance/evidence/round1/final-fix-report.md`、`final-fix/full-verify-once.log`：184 passed／4 Windows-only skipped，类型及构建通过；9个最终串行源Electron流程exit0。原始丢文、位置漂移、形变及版本解析的RED和早期harness错误保留。父独立核对157输入哈希与完整限定diff SHA一致；17份清理收据、101个自有去重PID均ESRCH，临时目录均ENOENT，旧原程序PID30628仍alive，只读检查未操作。

剩余问题：ONE限定再审、准确源码阶段提交和双端最终构建／包内验收；物理Mac／Windows输入法、DPI、多屏、焦点与真实微信／豆包／WorkBuddy接收仍未测。受控暂停帧不等于自然帧率或iPhone并排手感。

最终限定复核：`acceptance/evidence/round1/final-scoped-rereview.md`，R1–R4全部ADDRESSED，Spec／Quality Approved；157冻结输入、完整13文件diff、12张受控动效PNG、10项CI接入已独立核对，无新增阻断。184／4skip全量与9个最终串行源流程均通过；实际最终包、物理两端和真实目标接收仍须后续门禁。

P6实际包门禁fix2：9a862b7的Mac严格构建与签名通过，实际App迁移／编辑／关窗／重启／最近删除通过；备份对话框替身的global require上下文错误导致完整包fixture失败，原JSON／截图／日志保留。已限定改用evaluate提供的dialog；真实隔离source callback RED/GREEN与导出manifest/SHA通过，Spec／Quality PASS，原严格包断言未放宽。新sourcefreeze后重新构建两端和完整包fixture；旧9a包未批准。9a来源WindowsCI37942506422 success，188单测及10source工作流、严格NSIS预检通过，仅作阶段来源证据。
