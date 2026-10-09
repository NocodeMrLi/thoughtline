# P3/P4 独立 Spec / Quality 审查

审查基线：main HEAD `e4bb97c75c87a032ba1a8052d5a22b35e1cb806d`，生产 working tree 冻结。范围包括 tracked diff、未跟踪 renderer / geometry / history 文件及相关测试；工作包为 `p3-ui-working.diff`，实际源码与最终 `p3-ui-report.md` 补充核对。未修改生产代码、未 commit/push、未读写真数据、未触碰旧 Electron PID 30628。

采用 code-review 两轴；在父任务已经独立委派 reviewer 的范围内分别记录 Spec 和 Quality，未另启动重复审查进程。planning-with-files 使用父计划和本指定审查文件承接。恢复钩子已尝试，返回指定笔记目录不存在；以现存任务新规格优先旧方案。

## Spec：需修复 1 项 P2

### R1 [P2] 当前纸张归档后保留旧夹分页，显示 0/2

- 位置：`src/renderer/components/Detail.tsx:15-22`、`:36`。`trackedClip` 消失时 `heldClip` 继续指向原夹，`visibleId` 仍选已归档的 manageSelection；原夹还有至少两张时 index=-1，却继续渲染分页。
- 触发：独立临时目录创建同夹 i/j/k 三张合成纸；打开 i 的 Detail；点击「收起当前念头」。
- 预期：保留归档后的当前正文时停止显示旧夹分页，或显式转到同夹相邻纸并显示真实索引。不得把已离夹的记录展示为该夹第 0 张。
- 实际：reader=i（已归档），原夹仅剩 j/k，界面 `‹0/2›`，下一张和「本夹标题列表」仍可用。这会向用户表达错误的当前归属和页码。
- 依据：brief 的 Detail 当前夹/页码安全及归档操作集成要求；该行为也不满足有效分页的基本不变量。
- 证据层级：独立 Mac Electron source runtime + 合成 profile + DOM/IPC 受控复现，非源码猜测。`acceptance/evidence/round1/p3-ui-independent-review.log` 的 ARCHIVE 记录，进程 exit 0。
- 建议限定修复：分页/标题列表只引用包含当前展示 ID 的 clip，且同步考虑归档后下一张与重新挂上的行为。不需扩大数据层范围。

其他核对结论（分别标证据强度）：

- 源码：updateIdea 的可信主 frame、session、owner 在入口/队列执行处检查；四字段 CAS 按执行时 snapshot 读取。主要 snapshot mutation 共用 composerWrite；prepareViews 在队列外。settings 保留 calendarBounds，undo 在编辑/软删后清理，projectDelete 对保留 undo 快照同步清组。
- 源码及实现者最终受控日志：标题列表打开先 prepareLeave，mousedown 不强制 blur；350/1500 保存；中文 composing guard；失败保存可重试。Agent 自动拆出后 Detail 跟踪实际 clip，仍保相同 reader ID 并继续编辑。
- 独立受控：本轮在磁盘 rename 注入失败，调用原生 BrowserWindow.close()；窗口仍 visible、正文「独立审查保留文字」保留；恢复写盘后显式重试落盘。见同一独立日志 CLOSEFAIL。
- 源码及最终 calendar 日志：9+18 分页、3列/窄2列、12月、搜索、归档计数、软删恢复、reader 返回的 loaded 数量与实际 click 时 scroll 保留。冻结 createdDay 来自数据层，today 每分钟/focus 刷新而历史日期不重算。
- 源码及 geometry 最终日志：点击格 origin 为实际坐标（507.5px 125px）；120ms/reduced-motion；日历几何保存/恢复与 settings、Detail 隔离。纯 helper 的缩放/副屏移除测试属于模拟，不是物理多屏。
- 源码：永久删除仅 deleted 记录出现，并有第二步明确确认；按钮完整 label/hover/focus tooltip，header drag 与可操作区域 no-drag；材质没有声称原生 Liquid Glass。

## Quality：代码安全与测试保全无新增阻断项

未发现应单独列为 Quality 阻断项的队列互等、覆盖新 draft、撤销复活内容或项目删除问题。R1 已按 Spec 单列，不跨轴重复计数。

已核对旧 workflow / draft-safety / composition-safety / group 测试 diff：旧「取消编辑」改成用户要求的原地 autosave/close flush；保留正文、ID、创建时间、独立新建草稿及重启检查。schema3 迁移预期增加 frozen 日期字段，没有用删除完整正文断言换通过。旧 red/attempt 日志仍存在。未为 review 重跑已经通过的全量或长 idle。

最终实现者证据已读取：`p3-ui-verify-final.log` 32 test files / 163 passed，4 Windows-only skipped，typecheck/build 完成；`p3-ui-inline-edit-workflow-final.log`、`p3-ui-calendar-workflow-final.log`、`p3-ui-calendar-geometry-attempt2.log` 与最终报告相符。这些属于实现者执行证据，本审查不伪称独立全量复跑。

清理核对：cleanupIdleFixture 源码先核对本 fixture PID 全退出才 rm 临时目录；不是无依据写 true。独立复现 PID 45118–45123，清理助手成功返回后另外 fs.access 确认目录不存在，具体路径与 PIDs 保存在独立日志。只清理自有 fixture。

## 仍开放门禁

1. R1 修复后限定回归与独立复核；当前不签署 Spec 全通过。
2. Windows strict installed-preflight schema3 精确迁移比较转 P5；当前不称 Windows 阶段通过。
3. P5 目录迁移、独立备份、实际恢复与失败回退；P6 新冻结包来源和包内运行验收。
4. 真实 Mac/Windows IME、焦点、DPI/多屏/窗口拖动和材质可访问性；三真实接收端 Windows 微信 4.1.13.65、WorkBuddy 5.7.6、豆包 QQ 浏览器。当前均不能用 source DOM/IPC 或 CI 替代。
5. 跨午夜/时区刷新、永久删除确认和大历史规模等本审查以源码/已有单元覆盖为据，未新增物理或长时受控验收。

两轴结果：Spec 1 项 P2 待修；Quality 0 项新增阻断。没有提交/发布/设备验收通过结论。

补充清理证据：父任务 `acceptance/evidence/round1/p3-ui-cleanup-audit.json` 只读复查 29 份 P3 收据，共 183 个去重自有 PID，alivePids=[]。部分收据 directory=null，因此目录删除只能依据 cleanup helper 成功返回与原收据，不能提升为独立 stat 证明。

## R1 与 fixture 正常退出限定复核（后续结论）

本节更新前述 R1 开放状态：**R1 关闭；当前 Spec 0 项开放发现，Quality 0 项新增阻断**。物理双端、真实接收端、P5/P6 门禁不变。仅审查 R1 改动、相关受控回归和 page-handoff fixture finally，没有扩大生产范围。

### 生产修复

对比 `.superpowers/sdd/task_plan/p3-ui-before-fix.tsx` 与当前 Detail：去掉 stale heldClip，`src/renderer/components/Detail.tsx:11-12` 只查包含当前 trackedId 的 clip；后续分页、标题列表、键盘切纸都用同一实际 clip。归档纸仍保当前正文和 ID，旧夹不再充当其归属。重新挂上后按实际新夹恢复控制；删除当前纸的 onRemoved 仍在操作闭包中保留原邻项。

已读 genuine RED `p3-ui-archive-current-red.log`（旧分页实际 1、预期 0），原失败证据保留。独立重跑最终 archive workflow 自然 exit 0，覆盖当前 i 的 ID/全文、归档无旧分页、键盘不跳旧夹、重新挂上归属与真实页码、删除 j 后稳定 k、最终完整正文/ID/状态比较。没有改断言或生产。

### Fixture 生命周期

`tests/electron/page-handoff-workflow.cjs` 的 finally 现在顺序恢复磁盘故障开关、等待 Shelf 真正 leave-ready 回执、正式 closeManage 并断言成功、释放 dragLock，再 await app.close；没有 app.exit/定时强退。cleanupIdleFixture 在自有 PID 全退出后才删除目录，随后保存有 dir/PID/normalClose 的收据。源码与独立受控运行一致。

独立 all 重跑自然 exit 0，保留四个原场景：失败 checkpoint 阻止 browse/settings 并重试；Shelf 旧失败重试不覆盖 Detail 新选择；组件卸载保留失败 checkpoint；快速翻页展开/复制 d。最终 Ideas 完整字段和夹顺序 deepEqual 断言仍在。此次没有 TERM/KILL、没有人工终止进程。

先前 PID 46013 的 all run 曾人工干预退出，仍只算业务断言通过，不提升为自然完成。新 fixture 通过不追溯改写旧结果；目前证据支持测试退出路径修复，没有据此宣称发现或修复真实应用异常退出。

### 精确独立命令与证据

所有命令在 `/Users/lihongwei/Desktop/晾念头 : Thoughtline/app` 执行，shell `/bin/sh`、login=false：

```sh
PATH=/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin THOUGHTLINE_FAKE_CLIPBOARD=1 THOUGHTLINE_ATTEMPT=independent-r1-review node tests/electron/archive-current-workflow.cjs > acceptance/evidence/round1/p3-ui-archive-independent-review.log 2>&1
PATH=/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin THOUGHTLINE_FAKE_CLIPBOARD=1 THOUGHTLINE_EVIDENCE_DIR=acceptance/evidence/round1/p3-ui THOUGHTLINE_ATTEMPT=independent-exit-review THOUGHTLINE_PAGE_CASE=all node tests/electron/page-handoff-workflow.cjs > acceptance/evidence/round1/p3-ui-page-all-independent-review.log 2>&1
```

两条均 shell exit 0，不重复全量 verify / 长 idle。实现者 R1 后 typecheck/build、inline、page status/expand 证据已随最终报告核对；本次独立执行只包含上面两个有限场景。

最后以 Node `process.kill(pid,0)` 和 `fs.statSync(dir)` 独立回查三个收据：本 review archive 的 47231/47232/47233/47234/47239/47240、本 review all 的 47263/47264/47265/47266/47275/47276、实现者 normal-exit-1 的 46969–46974，全部 ESRCH；三目录 stat 均精确 ENOENT。结果 `acceptance/evidence/round1/p3-ui-independent-r1-cleanup-audit.json`。无自有 fixture 残留；未操作其他应用/真实数据。

此次只追加审查报告和独立测试 evidence，未改生产、未 commit/push。两轴通过限定于当前 P3/P4 源码及上述受控证据，不是设备/安装包/发布验收通过。
