# 第一轮全分支最终独立审查

日期：2026-10-09。审查席位独立执行 Spec / Quality 两轴，不另派代理，不改生产/测试实现，不提交、推送、打包或发布。

## 审查对象与结论

- 基线 `ff39779cbeb562083f3574db4d2998693091b0be`；实查 HEAD `fa45cb88105db81806e419bba5d8029af9540389`，main 上冻结 P6 / Task 7 WIP。
- 完整净源码包 `.superpowers/sdd/task_plan/final-source-review.diff`，独立计算为 **522931 bytes / SHA256 c03d81fb543f1d61a2bce2661890954f66e90f9c7d004da9344d3fe1672e627c**。直接通读实际 main/preload、全部活跃 renderer components/hooks、shared commands/layout/history、repository/storage、打包与来源/验收脚本；旧 committed raw logs 仅按阶段报告定向读取。
- 规格以笔记库 `Thoughtline第一轮修复优化.md` 原方案及新增苹果日历动效约束为准；历史 160×112、数量下沉、取消编辑、旧两轮排期不覆盖本轮要求。项目 AGENTS、03/04/05/08/09 的适用约束、task_plan、SDD ledger、ROUND1-REPAIR/DATA-SAFETY 和各阶段审查/复核均已核对。
- **Spec：Needs fixes。Quality：Needs fixes。Critical 0；Important 4（P1 1 项、P2 3 项）；新增 Minor 0。** R1 已独立受控证实丢失新会话尚未保存正文；工程尚不能作为“开发完成、可交最终独立 QA”的版本冻结。真实外拖/物理两端/最终包缺证据单独列门禁，不冒认为已发生产品缺陷。
- 用户本次审查中追加“日历夹子采用认可 TL Logo 的珊瑚红正面倾斜夹子”，父正在准备有界新增任务。本报告的源码包尚不含新 badge；该追加需要另附最终 diff/证据后核对，不把旧通用 SVG 擅自判成违反刚提出的新要求。

## 发现

### R1 · Important / P1 · 旧阅读器删除回执会卸载新会话 dirty editor，末次正文丢失

**Spec 轴；同时构成 Quality 生命周期缺陷，仅计一项。**

位置：`src/renderer/components/IdeaReader.tsx:13-17`；`src/renderer/components/Calendar.tsx:103`；后果落在 `InlineIdeaEditor.tsx:27` 的正常卸载 dispose。`IdeaReader.run()` 在 `await task(current)` 后无挂载、会话或原操作身份检查，继续调用捕获的 `onRemoved`。Calendar 的该回调无条件 `setSelected(next)`，绕过当前阅读器的 leave guard。Calendar 自身 go/back/run 的新保护没有覆盖这个子组件回执。

**独立受控复现，实际主进程会话切换；不是合成 manageSession 广播：**

1. 仅在新建 tmp profile 写合成 a/b/c 三条，打开日历，搜索共同关键词 `review-probe`，打开 a。
2. 测试侧包装真实 `thoughtline:idea-history` handler：先 `await original(...args)` 完成正常删除、写盘和广播，然后暂缓给 renderer 的成功回执。没有修改生产处理器语义、没有注入保存失败。
3. 在 a 点“更多→删除当前念头”。确认旧成功回执正在等待后，由真实 Shelf bridge `openManage()` 打开日历，主进程 manageSession 从 **2 到 3**。
4. 新会话搜索并打开 c，点击编辑，填入 `UNSAVED new session C`；在 350ms 自动保存前释放 a 的旧成功回执。
5. 实际：新阅读器从 **c 跳到 b**，编辑器数变为 **0**，c 持久化正文仍为 **review-probe-c**。新输入已失去可恢复的编辑器；卸载 dispose 取消其待写定时器，源码路径也没有退出补存这份已卸载 draft 的机制。

原始独立输出（shell exit 0 是复现/清理完成，不代表产品通过）：

```json
{"case":"late-reader-delete-response","priorSession":2,"newSession":3,"readerBefore":"c","readerAfter":"b","inlineCount":0,"cSavedText":"review-probe-c","expected":"reader C and UNSAVED C retained or saved","actualLost":true}
```

预期：旧删除已成功应保留其真实持久化结果，但其迟到 UI 回执必须失效，不能改变新阅读器/层级或销毁新输入。原需求明确要求快速切换、过期回调、切卡末次修改保全。复现包含受控 IPC 回复延迟、真实 Electron/DOM/IPC 和真实 main 会话路由；没有证明自然机器上发生频率，不据此夸大为普遍必现。

**限定修复建议：** Reader 在每个异步边界后核对挂载、当前 session/idea/操作所有权；失效后不再发送父导航回调或更新新会话 UI。Calendar 的 onRemoved 也应校验来源仍是当前阅读器。不能只校验 session：同一会话返回列表并打开另一张时，旧 Reader 也已失效。邻接核对 Detail choose/flip/标题列表与 Reader 完成编辑的异步回调，避免同一缺口保留在其他入口；不回滚已成功删除。限定回归至少覆盖本次跨会话复现及同会话返回重开、保存失败仍保文、正常删当前选相邻。

### R2 · Important / P2 · 日历过渡用非等比缩放，真实文字与纸张明显变形

**Spec 轴（新增“自然、舒服的日/月/年缩放”）；视觉品质问题，不是数据 Critical。**

位置：`src/renderer/components/Calendar.tsx:69-71`。离开副本使用 `scale(to.width/from.width, to.height/from.height)`；进入的真实目标同样分别以宽高比缩放。日内容区域、空日文字段、日期格和月份格纵横比差异很大，因此字体与 A4 纸卡随着不同轴速度压缩/拉伸。

独立视查 `acceptance/evidence/round1/calendar-motion/fix1-green-20261009-4/empty-day-return-controlled-early.png`：25ms 暂停帧中的“这里还没有念头。”被明显横向压窄、纵向拉长，叠在月历星期区。该图是真实源 Electron 像素；本席位亲自读取视查，不只接受 dataset 的正确 anchor。源代码同时证明该机制适用于非空日/月/年内容，后者的每条路径未各新增视图复现。

预期：可见文字、夹子和纸张保持等比形态，空间位置/容器边界传递层级关系；不以拉伸正文来强行对齐不同纵横比矩形。实际：锚点正确而内容形态被扭曲。建议用等比内容 scale + 平移、容器裁切/遮罩与短淡变协调不同形状，保留简短、可打断、reduced-motion 和真实内容过渡；不退回只有空框或只有淡入。修后在空日、有纸日和月↔年抽取早/中帧核对文字/纸卡比例，再保留自然帧率与 iPhone 并排手感为物理 QA。现有暂停帧不证明自然帧率，也不以未见 iPhone 为失败依据。

### R3 · Important / P2 · 改 Agent 自动拆夹未接入真满提示

**Spec 轴。**

位置：`src/main/index.ts:292-297`，对照同文件 restore/status/split 的 placementNotice 分支；`src/shared/ideaCommands.ts:66-77`；`InlineIdeaEditor.tsx:14-20,47`。

前置：当前绳已满，其中一个夹含 a/b 两张。编辑 b，把归属改为另一 Agent，并按 UI 明确确认拆成独立夹。`editIdeaIfUnchanged → editIdea` 正确生成独立夹；但 `thoughtline:update-idea` 直接返回 save，既不判断本次生成夹的 overflow，也不发布满位提示。编辑器成功态只显示“已保存”，确认文案消失；返回桌面后 b 不可见且没有告知去哪里查看。源码也没有像统一 split/new/restore 那样先 capture 当前布局。

独立 Node 24 只在内存 bundle 实际生产纯模块，无数据目录：width=900，a/b 合夹及 c 独立夹均可见；改 b 为 codex 后结果如下：

```json
{"case":"agent-split-full-rope","beforeVisible":["clip:a","clip:c"],"afterOK":true,"afterVisible":["clip:a","clip:c"],"overflow":[{"id":"clip:b","ideaIds":["b"]}],"retainedIdeas":3}
```

这是实际数据/布局模块的受控结果；“无提示”依据真实主进程 update-idea 分支与 UI 源码，未另跑第二个 Electron fixture。内容/ID 未丢失。用户要求新建、拆分、重新挂上统一空间规则，真满时不能静默隐藏，因此自动 Agent 拆出也须覆盖。

限定修复：只在这次编辑真正导致独立夹变化时，按统一空间规则保已有位置，判断该新夹是否 overflow，发布明确“已保存，绳上暂时放不下，可在念头日历查看”等入口提示。不要因原先无关溢出而误报本次编辑失败。回归覆盖有空位、真满、后续继续编辑 ID/正文稳定。

### R4 · Important / P2 · 实际 Mac 包验收脚本的 package.json 相对层级错误，恢复验收不可达

**Quality / delivery verification 轴。**

位置：`tests/electron/package-acceptance.cjs:29,32`。

该文件在 tests/electron，`require('../package.json')` 解析成不存在的 tests/package.json。实际冻结包流程一旦走到独立备份 appVersion 对比必抛 `MODULE_NOT_FOUND`，后面的文件哈希复制与两次恢复重启断言不能执行；即使跳过第一处，末尾版本记录仍有同一错误。当前没有最终包，不声称已跑包失败；这是确定的运行时路径缺陷，node --check 与“可执行文件不存在”的负向 probe 都无法覆盖。

独立只读 Node 24 用 `createRequire(path.resolve('tests/electron/package-acceptance.cjs'))` 得到：

```json
{"request":"../package.json","error":"MODULE_NOT_FOUND","message":"Cannot find module '../package.json'\nRequire stack:\n- /Users/lihongwei/Desktop/晾念头 : Thoughtline/app/tests/electron/package-acceptance.cjs"}
{"request":"../../package.json","resolved":"/Users/lihongwei/Desktop/晾念头 : Thoughtline/app/package.json","version":"0.0.17-preview.2"}
```

预期：严格绑定实际仓库/候选版本，实际包的备份/恢复验收可执行至最后。建议一次在脚本顶部正确载入并复用版本，并用不启动 App 的解析 probe 查此输入；真正冻结 App 的完整通过仍归后续包门禁，不在此次修复中假造。

## 全 11 项交叉核对

| 原需求 | 本席位核对与当前边界 |
|---|---|
| 1 项目立即删除 | removeProject 同时清 ideas（含 deleted）/draft；projectDelete 在共享队列内执行、同步清保存的 undo；完成和退出只关面板。当前实现及 P1/P2 证据未见新阻断。 |
| 2 三种拖动/拆合 | Shelf 起手锁 clip/paper，ClipCard 正文只 text/plain/copy；无效/Esc 不落 mutation；合并目标位置和成员顺序、单纸 ID、currentId 回退/undo 保留。未新增物理复验。固定绳与 A4、既有批准品牌资产未被本包替换。 |
| 3 真实外拖 | 源协议/显式复制无自动全局 paste、Enter 或隐式剪贴板回退；用户三接收端反馈仍待真实矩阵。不能宣布已修好或不支持。 |
| 4 即时翻页 | renderer 同步 ref 选择、后台100/300合并，主进程跨 sender 世代及旧 retry 拒绝；离开失败/卸载 checkpoint 保留、submit overflow 在写队列外 openDetail。现有相关受控证据支持，无新队列互等发现。 |
| 5 新卡与空位 | 分配器遍历全部 gap，新建/显式拆出/恢复先固定旧位置，真满分支有提示；**R3 自动 Agent 拆出跨边界遗漏**。 |
| 6 原地编辑/最后保存 | 四字段 CAS、session+owner、同 queue 取最新、350/1500 autosave、组合输入暂停与错误保文；**R1 旧 Reader 回执绕过 guard，末次输入已受控丢失**。不能标该需求完成。 |
| 7 收起/删除/恢复 | archive 和 delete 分离，deletedFrom 恢复、永久仅 deleted 且独立确认；正常当前相邻选择已修，但**R1 迟到相邻选择影响新读者**。 |
| 8 窗口/材质/几何 | 交互区 no-drag、顶栏 drag、calendar bounds 同队列保存、clamp 适用工作区、材质/辅助能力降级无 Liquid Glass 冒称。物理 DPI/多屏/OS 设置未在此证明。 |
| 9 图标/提示 | 详情工具行图标、仅 group 拆出、more 张数、undo 有状态才出现、portal hover/focus 完整提示。新 Logo 日历 badge 是父正在实施的追加，另待最终差分核对。 |
| 10 日历/历史/动效 | frozen createdDay、正常/删除计数分离，day/month/year/range/query/status，9+18加载与返回 scroll，animation clone 限可见18张、scroll/resize/reduced取消。**R1 导航保文和 R2 非等比形变未过**；“全 DOM 永久硬上限”不应从9+18实现/日志推定，见下面暂缓项。 |
| 11 路径/迁移/备份 | 实际路径、打开、config failclosed、排他copy/哈希/完整load后才切换、prepared仓库引用替换、原目录保留、独立manifest与restore模块、旧schema备份。未发现新的实际旧库写入或迁移回退缺陷。旧 preview6 不识别 schema3 的回滚边界文档清楚。**R4 实际包恢复验收脚本阻断交付证据**。 |

## 历史 Minor / deferred / parked 裁定

- P2 Q2 renderer 恢复路径覆盖与 queue 测试漏调用：后续 p2-recheck 的最后附录、真实 queue-fixed JSON/log 和现源码 textContent() 已关闭，早期名为 green 的失败不转写通过。
- P3 数据 D1 迁移生成日期未重验：ideaCommands 迁移后 dayOK 再校验存在；对应 RED/GREEN 和限定复核支持关闭。T1 旧 Manage deleted 类型集成不是仍开放问题；父最终全量日志可见 178 passed / 4 Windows-only skipped、type/build exit0，旧历史失败保留。
- P3 UI archive 当前页0/2：Detail 仅找实际包含 trackedId 的 clip；独立 R1 限定复核和其真实归档/重新挂回/删除相邻记录支持关闭。本次 R1 是新异步跨组件缺陷，不重开同一个0/2问题。
- P5 R1 configured 检查后失联：FileRepository allowCreate:false 在实际 load 生效，prepared copy 同样禁止空库，默认首次启动可创建。已有真实 RED 与受控启动回归支持关闭。
- P6 S1/S2/Q1 与 deferred Q2：后验 source-input-vector、唯一 attempt、finally 恢复注入和通过旗标延后源码均存在；p6-source-review 的 fix1 附录支持其原范围关闭。实际 post-build guard 仍未运行，属于未来门禁。**R4 是该脚本先前 probe 未覆盖的新确定缺陷，不应因旧限定批准跳过。**
- Task7 S1/S2/Q1：Calendar go/back/openIdea 的 session/intent、空日 visual、scroll/resize 取消已落实；原限定修复认可。R1 来自未纳入当时范围的 Reader 子回执，R2 来自真实内容形变，不否认旧几何/空日可见性断言已通过。

## Declined to judge / 暂缓行为（逐项，供父裁定）

1. **物理 Mac/Windows 输入、DPI、多屏、原生窗口拖动、焦点、IME、材质辅助设置**：本机 source Electron 与模拟事件/纯几何不等于设备验收；本审查不冒称通过，也不因缺环境判产品不支持。
2. **Windows 微信4.1.13.65、QQ豆包、WorkBuddy5.7.6 实际文本接收/成功率**：未启动真实目标或发送内容。用户反馈和 source text/plain 只支持各自事实；仍需真实输入框已有草稿/取消/拒收/长文/emoji 多次矩阵。
3. **自然动画帧率、iPhone 并排手感**：仅视查受控暂停像素，不将它当自然运行视频；R2 是明确可观察的非等比形变，可先修，最终舒服程度仍用户独立 QA。
4. **最终双端包、签名、manifest/完整SHA、actual source vector、Windows CI7用例最终运行、Mac隔离启动入口**：源码尚未冻结且无实际最终包；现有P5 Windows成功只属于fa45/preview.1。修复及新 badge 后须冻结新SHA再建立两端来源与包内运行证据。
5. **Detail 自身 choose/flip/标题列表 pending 回调的另一个独立跨会话缺陷**：源码缺 Calendar 同等失效保护，但 main prepareViews 的真实时序可能先完成这些回调；本次不凭相似写法另列必现缺陷。将其作为R1邻接核对，不用纯合成session事件冒充自然路由证据。
6. **长期反复“显示更多”的全 DOM 硬上限**：当前是9+18累积加载，limit无常数上限，全部按需加载后可能渲染所有匹配记录；动画副本的18上限不是全列表上限。原用户明确允许分页/索引且要求“不一次渲染全部历史”，现实现有按需加载，未独立测到实际大历史性能失败，因此暂不新增P2或擅自改成交互分页。但交付措辞应限定“初始/按需加载与有界动画副本”，不能宣传恒定DOM上限；若父要求永久有界，需明确列后续项及上限契约。
7. **进程崩溃、断电与真实磁盘拔插/空间耗尽**：现有故障注入只证明相应软件分支，不能推定物理恢复和所有原子持久性均完成。本轮未新增此类破坏性测试。
8. **新 TL 日历夹子 badge**：父审查中告知新增用户授权，当前包未包含资源/代码；先不判其像素复用、尺寸清晰度、使用位置或来源通过，待实际输入。
9. **既有 G7 全屏悬停抑制与 Intel Mac**：旧文档已有未验收/独立分支边界，本包无相应新实现，不擅自整合实验或扩建架构；交付保留真实平台/架构与未测说明。

## 独立执行、证据与清理

- 技能采用 code-review 双轴、planning-with-files 复用父计划和本指定报告；未另派子代理。轻量 memory registry 搜索无本任务相关命中，不引用历史项目记忆为事实。恢复 hook 已尝试，指定 WordPet 笔记目录不存在；没有伪称读取或创建它。
- 所有命令显式 workdir、`/bin/sh`、login=false。Node 前置 `/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`。没有重复全量 verify 或长 native/performance测试；父 `round1-final-source-verify-attempt1.log` 的178/4skip是父执行证据，不写为本席位新跑。
- R4 createRequire 与 R3 esbuild `write:false` 内存 bundle 的只读 probes 均 exit0，前者验证缺陷解析结果、后者验证真实布局溢出；没有数据目录或生产文件写入。
- R1 仅一次独立 source Electron fixture，`THOUGHTLINE_FAKE_CLIPBOARD=1`，新 tmp `thoughtline-final-review-reader-tp3zQa`。真实删除先保存后只延迟回执，通过真实主进程 openManage 切新会话。结束恢复持有回执、closeManage、正常 app.close、cleanupIdleFixture，再 stat ENOENT；无 app.exit、TERM/KILL 或全局清理。
- 原始清理结果：目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-final-review-reader-tp3zQa`；自有 PID **62379, 62383, 62384, 62386, 62387, 62388**。后续独立 `process.kill(pid,0)` 对六个全部 **ESRCH**，目录不存在再次确认。旧 PID30628、真人数据/安装、其他树未操作。
- 只生成本审查报告。发现交父汇总为 **ONE final fix wave + ONE 限定再审**；未自行修代码、提交/推送、构建包或发布。
