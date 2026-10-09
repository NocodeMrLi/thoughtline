# ONE final scoped re-review — R1–R4

日期：2026-10-09。独立只读席位；原全分支审查者已不可调用，本次以完整 `final-review.md` 为约束上下文，仅复核单次最终修复的 13 文件差异及另批 Task8/CI 接入，不重复全分支审查。

## 结论与冻结

**Spec：Approved（限定复审范围）。Quality：Approved（限定复审范围）。**

| 原发现 | 原级别 | 本次裁定 | 结论依据 |
|---|---|---|---|
| R1 旧 Reader 删除回执丢失新编辑 | Important / P1 | **ADDRESSED** | 删除回执已无父导航权限；当前快照负责稳定邻接选择，Reader/Detail/编辑完成有生命周期保护；真实 main 跨会话和同会话 RED/GREEN 关闭原失败 |
| R2 日历内容非等比变形 | Important / P2 | **ADDRESSED** | 双向等比缩放与中心平移；亲自查看六路径各 25/100ms 共 12 张实际 PNG，文字、纸张、品牌夹子比例保持 |
| R3 改 Agent 自动拆夹满位无提示 | Important / P2 | **ADDRESSED** | 仅实际分离时固定旧位置，沿原分配器寻找全绳空位；只检查本次新夹溢出；六单测和真实 main 提示/继续编辑证据通过 |
| R4 包验收 package.json 路径错误 | Important / P2 | **ADDRESSED** | 正确从仓库加载一次并复用候选版本，严格备份及两次恢复断言保留；本席位只读解析/语法 probe 通过 |

本次范围未发现新增 Critical、Important 或需阻断冻结的 Minor。允许父控制器进入**源码冻结及后续实际包门禁**；本结论不等于包验收、真实双端验收或发布许可已完成。本席位报告完成后停止写入。

## 输入身份与方法

- 已读 `final-scoped-rereview-brief.md`、原 `final-review.md`、`final-fix-brief.md`、`final-fix-report.md`、完整限定差异及当前相关实现；核对 Task8 独立审查最终 fixround2 裁定、`calendar-brand-clip-fix2.diff`、当前任务计划/进度、上级 AGENTS 与 03/04/05/08/09 中适用条款、外部第一轮方案的最新约束。
- 实查 HEAD `fa45cb88105db81806e419bba5d8029af9540389`；候选 `0.0.17-preview.2`。Node **v24.19.0**。
- 本席位独立只读计算 `final-fix-scoped.diff` 为 **57364 bytes / SHA256 35f9df112604aade54b2aa06b15cdf883061fc721b7b2b9d1ce646bb43a2e982**。`final-fix-after-sha256.json` 的 **157 输入全部相符**；逐项对照 before 副本得 **10 changed + 3 new**，与 `final-fix-input-delta.json` 一致。
- code-review 双轴独立判断；按本任务明确约束不再委派。planning-with-files 复用父计划与本指定报告，未改共享计划。轻量 memory registry 无 Thoughtline 命中；恢复 hook 已尝试，报告 WordPet 目录不存在，未创建或声称读取。

## R1 证据核对

`IdeaReader.tsx:15–29` 在 leave、page flush、info、mutation 的 await 后检查 mounted/session/idea/operation；run 同步 pending 阻止重复起动，错误及 busy 更新亦受所有权约束。原 `onRemoved` 删除，故旧成功响应无法改变新 Reader。`Calendar.tsx:98–107` 与 `Detail.tsx:24–32` 用前次当前选择、顺序、session/intent 和已提交快照恢复相邻条，避免正常删除广播先卸载 Reader 后丢失邻接导航。实际删除持久化不回滚。

核对原始 `acceptance/evidence/round1/final-fix/reader-placement-red3-IKuu8J/receipt.json`：真实 main session **2→3** 后 reader=b/editor=0；同会话 **4→4** 后 reader=b2/editor=0，均丢失 C 未保存编辑器。原 fixture 先 await 原主进程删除处理器（写盘/广播完成）再 hold 回复，并检查合成 snapshot 的 deleted，未伪造 session 广播。

核对最终 `final-reader-placement-workflow-final-rwm4jW/final-green-HvjOxv/receipt.json`：两条路径均 reader=c/editor=1，分别保留 `UNSAVED cross C` 与 `UNSAVED same C`；同会话开始前持久化已含上次 cross 文本，支持正常 close flush。Calendar 删除 d→e；Detail e→f→empty；拆出的最后 r 删除后不退回旧 q。`Detail.tsx:35–38` 队列在执行时取最新 refs，保留双击前进/后退队列；标题列表/undo 有 session/intent 检查。真实保存完成但延迟回复的 finish 测试在回复前保留 editor，回复后显示已存正文。`InlineIdeaEditor.tsx:40,49` 回调需 live。

补充核对最终 serial 的 inline-edit、archive-current、page-handoff 原始 stdout：保存失败保文/重试、合成 IME 阻止关闭、同 ID Agent 拆出保编辑器、归档当前无旧页码、重新挂上身份、快速翻页当前正文、失败 checkpoint/retry 均有通过记录。这些是实施者/已有夹具结果，本席位未重复运行，也未将合成 IME 说成物理输入法验收。

## R2 像素与行为核对

`Calendar.tsx:71–75` 双方向采用 `min(widthRatio,heightRatio)` 单值 scale，按剩余空间居中平移；内容副本仍是可见区域真实节点，容器裁切，纸张副本最多 18。210/230ms、可打断、saved/system reduced-motion、forced-colors、scroll/resize 取消机制保留。

本席位通过 view_image 亲自查看 `acceptance/evidence/round1/final-fix/shape-green1-o5Sr7q/` 下全部以下文件，各含 `-25.png` 和 `-100.png`：

- `empty-day-expand`、`empty-day-return`：早帧真实“这里还没有念头。”保持正常字形；返回中帧小且淡，位置沿原日期格方向收缩，无旧纵向拉长。
- `paper-day-expand`、`paper-day-return`：真实标题/正文、纵向纸卡与珊瑚红斜夹同向等比变化；返回早帧为可见纸卡，100ms 已接近日期格且淡出，未退成空框。
- `month-to-year`、`year-to-month`：真实星期/日期格/数量/标识缩入十月位置或由该位置展开；早中帧均保持字形与矩形比例。

原 RED `shape-red-8Cd3VE/receipt.json` 六路径均 unequal；GREEN 同路径 12 组 matrix 的 X/Y 相等。例如空日返回 25ms 由旧 0.599924/1.91255 改为 0.599924/0.599924；月→年 25ms 为 0.637022/0.637022。位置与内容判断同时依据源代码、像素、坐标，不只看 dataset。最终 calendar-motion/fix1/geometry serial 日志通过，保留返回滚动、resize、可见空日、打断、日期锚点和编辑 guard；旧 synthetic-session 项仍按合成证据标注。未证明自然帧率或 iPhone 并排手感。

## R3 数据、分配与提示

`ideaCommands.ts:73–80` 先做四字段 CAS，再只在 grouped owner 的 Agent 变更时 capture 当前布局；未改公共 IPC 签名或正常纯文字编辑。`main/index.ts:296–301` 在同一写队列捕获 prior clip IDs，成功保存后仅实际新生成且包含该 paper 的夹触发检查，overflow 条件也绑定该 paper；无关既存 overflow 不产生新的虚假警告。后续普通编辑不清掉满位查看指引。

六单测覆盖自动位置、左/中/右空位、真满、普通编辑含无关 overflow；核对测试正文及 `agent-placement-unit-green.log` 6/6。包含旧中心不动、全 idea ID、正文/创建时间、原组成员和 currentId、新夹 currentId、继续编辑稳定断言。RED 自动位置 610→500 的失败保留。最终真实 main h 改 Codex 并继续修改正文后，receipt 记录全部 ID 稳定、原组只余 g、新 h currentId 正确、notice 为“已保存，绳上暂时放不下，可在念头日历查看”；原 RED3 同样操作提示为空的失败保留。未见本限定分支引入丢 ID、丢页或重排旧夹的证据。

## R4 严格包门禁

`tests/electron/package-acceptance.cjs:2,30,33` 正确只加载一次 `../../package.json`，两处复用 `packageInfo.version`。差异未删改 manifest revision、文件白名单/size/SHA256、COPYFILE_EXCL、真实 backup 还原 snapshot、两次重启或最终 completedChecks 条件。

本席位以 Node24 的 `createRequire(path.resolve('tests/electron/package-acceptance.cjs'))` 独立解析得到实际 `app/package.json` 和 `0.0.17-preview.2`，完整脚本 `new Function('require',source)` 语法通过，并断言正确 require 出现一次。probe exit0，没有启动 App、写数据或执行打包验收。原 package-path-red/green 与 worker 结果一致。实际冻结 DMG/App 的全流程仍 pending。

## Task8 addendum / CI

- 另批 Task8 的 fixround2 限定 Spec/Quality Approved 维持；当前修复只变其 fixture 的平台诊断。原批准 JPEG 本席位复算 SHA256 仍 **313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778**。
- 月/年/纸卡继续共用 SVG 原像素视口与 CSS clip-path，原倾角/弹簧可见；12 张本次 motion PNG 同时显示品牌形态未被拉伸。独立 Task8 之前的小尺寸像素审查作为 addendum 证据，不冒称本席位重做其所有 UI 验收。
- 最新 `calendar-brand-clip-workflow-final-epVd3E/final-green-1791554351034-67289/receipt.json` stage=complete、isolatedDataDir=true，350/421/500/740 各含 3/123；fixture 仍断言数字/夹子均留格内并保比例。normalClose/fixtureRemoved=true，Mac30628 before/after=true。
- `.github/workflows/test-packages.yml:31` 保留原 7 并添加 badge、reader-placement、shape，共 **10**。CI run root 含 run/attempt/GUID；每测试单独 attempt，新增夹具再用 mkdtemp 或 timestamp/PID 构成独立路径；always artifact 仍覆盖指定根。Task8 fixture 两处固定30628探测均包在 `process.platform==='darwin'` 条件，Windows 返回 not-applicable，不检查无关固定 PID。这里只确认集成代码，最终 Windows CI 未跑不记通过。

## 验证、清理和 declined-to-judge

本席位新增执行仅文件/源码/回执读取、12 PNG 视查、Node24 输入哈希及 require/语法 probe（exit0）；没有启动 Electron 或建立合成数据目录，所以**没有本席位自有 Electron PID/临时数据需要清理**。没有 kill/app.exit、真实资料读取、源码/测试/依赖编辑、commit/push、打包或发布。首个简报只读命令使用显式 workdir 但未覆盖默认 shell；其后全部 `/bin/sh`、login=false、显式 repo workdir，Node 命令均前置指定 Node24 PATH。定位 AGENTS 首次 app 路径不存在后正确读取上级；不影响源码。

现有 `full-verify-once.log` 明确 **184 passed / 4 Windows-only skipped**，typecheck/build 通过；`serial-final-results.json` **9/9 exit0**。原 shape GREEN 之后仅 Detail 表示调整，当前 Calendar/shape 输入与冻结哈希相符，最终两条原 motion serial 也通过；不为本次阅读重复全套。父只读 cleanup 审计 `controller-final-fix-cleanup-audit.json` 已核对：17 回执/101 去重 PID 全 ESRCH、所有记录目录 ENOENT；这是父的当前独立清理证据，非本席位新执行。原30628仍存活由父及最终 badge 回执确认。

以下明确暂不裁定为通过，也不新增为本修复缺陷：

1. 最终冻结源 SHA 下实际 Mac/Windows 包、签名/manifest/compiled source vector、post-build guard、包内备份与两次恢复、Windows 10-fixture CI；由父完成后续交付门禁。
2. 物理 Mac/Windows IME、DPI、多屏、窗口拖动/焦点/材质辅助设置；自然动效帧率及 iPhone 并排手感。
3. 微信4.1.13.65成功、QQ豆包间歇、WorkBuddy5.7.6失败仍为用户观察；本席位未发送真实消息或尝试外部输入框，不作接收率结论。
4. 原报告 parked 的长期按需加载 DOM 硬上限、G7 全屏悬停/Intel Mac、真实断电/磁盘拔插等边界保持原裁定。只可称“初始/按需加载与有界动画副本”，不能由本次复审升级为恒定全 DOM 上限。

**报告冻结。R1–R4 无开放项，Task8 addendum 与 CI 源码接入无新增阻断；后续源码冻结和实际交付证据由父控制器负责。**
