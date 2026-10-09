# Thoughtline 第一轮修复优化

完整产品方案：`/Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline/Thoughtline第一轮修复优化.md`。本轮基线main `ff39779cbeb562083f3574db4d2998693091b0be`，仓库private，G7未整合；旧发布v0.0.16-preview.6不改。开发候选使用0.0.17-preview.1，不替换用户安装。

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
