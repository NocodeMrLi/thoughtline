# Task 7｜日历双向空间缩放实现报告（待独立 Spec＋Quality）

工作目录：`/Users/lihongwei/Desktop/晾念头 : Thoughtline/app`，main 工作树。本任务改 `src/renderer/components/Calendar.tsx`、`src/renderer/styles/auxiliary.css` 的日历段，新增 `tests/electron/calendar-motion-workflow.cjs`；父任务后续将受影响的既有 `tests/electron/calendar-geometry-workflow.cjs` 明确纳入本任务所有权，已将其旧动效断言更新为本轮契约。P6 版本、CI、打包和其他 workflow WIP 没有编辑；没有 commit、push、package 或 tag。

## 方案与实际视觉

月份标题只是进入全年入口。视觉来源是当前 `month-grid` 可见内容，210ms 收缩到全年中同一个月格；点全年月份格后，真实 `month-grid` 从该格用 230ms 展开。点日期格时，真实纸卡组从该格展开 230ms；返回时只复制当前滚动窗内可见的纸卡与日期标题，将其在 210ms 内缩回原日期格。卡片进入阅读区也使用来源卡片与目标阅读区的短过渡；返回阅读区时不复制可能含编辑输入的活 DOM，目标卡片轻淡入。均是普通单击或“返回”，业务导航不等待动画结束。

过渡使用当前层级的受控视觉副本与目标本身的 WAAPI 变换。视觉副本 `aria-hidden`、`inert`、`pointer-events:none`，去除重复的 id、data 定位属性与 aria 属性，按钮不可聚焦；纸卡副本最多取滚动窗内 18 张可见卡，不复制离屏的已加载卡或输入框。新导航、搜索、筛选、翻月、“今天”、加载更多、系统动态偏好改变、设置改变或卸载会取消动画并移除副本。异步 `prepareLeave` 后再取来源；`navigationIntent` 阻止较早的异步导航覆盖新操作。系统或应用“减少动态效果”下无空间动画；强制高对比模式也直接显示终态以保持文字可读。

父任务视查指出首版只有空色块移动，未让日历内容参与缩放；因此保留该尝试的帧图作为不足证据，并改为当前月历/纸卡真实内容缩放。受控帧图是源码 Electron 的实际像素，但通过暂停 WAAPI、设置 `currentTime` 取 25/约110/末帧，不是自然墙钟耗时或 iPhone 实机录像。

## RED / GREEN 与回归

所有命令均在上述工作目录以 `/bin/sh`、`login:false`、`PATH=/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin` 执行。

| 检查 | 命令与结果 | 证据范围 |
| --- | --- | --- |
| 受控 RED | `node tests/electron/calendar-motion-workflow.cjs`，退出码 1。原终端输出为 `locator.evaluate: Timeout 30000ms exceeded`，等待 `[data-calendar-motion]`，位置为 `calendar-motion-workflow.cjs:25:61`、`:27:21`、`:36:9`。这是实现前对几何层缺口的受控测试失败，非用户设备复现；终端输出取自本轮工具记录，首个 attempt 当时只写了 cleanup.json，没有伪称已捕获原始日志。 | `acceptance/evidence/round1/calendar-motion/attempt-1791550229068-55913/cleanup.json` |
| 最终 motion GREEN | `node tests/electron/calendar-motion-workflow.cjs`，退出码 0，host 为 `darwin/arm64/24.3.0`。验证月↔年、月↔日方向与锚点、真实目标缩放、纸卡返回内容收缩、210/230ms、连续切换取消旧层、系统与已保存应用减少动态效果、返回滚动、窄窗两列、9→27 卡、有界副本、合成 composition 阻止离开及结束后最后修改保存、无残留。 | `acceptance/evidence/round1/calendar-motion/attempt-1791551142478-58524/` |
| 既有业务 workflow | `THOUGHTLINE_EVIDENCE_DIR=acceptance/evidence/round1/calendar-motion/workflow-attempt-20261009-2 THOUGHTLINE_ATTEMPT=calendar-motion-20261009-2 node tests/electron/calendar-workflow.cjs`，退出码 0。覆盖今日数量、9 卡/加载更多、三列/两列、原地编辑与返回滚动、全年 12 月、搜索、软删除恢复。 | `acceptance/evidence/round1/calendar-motion/workflow-attempt-20261009-2/` |
| 编译与构建 | `npm run typecheck` 退出码 0；`npm run build` 退出码 0（最终源码修改后）。`git diff --check` 无输出、退出码 0。 | 本轮终端输出；没有全量测试或安装包结果。 |
| 几何集成补验 | `node --check tests/electron/calendar-geometry-workflow.cjs` 退出码 0；`THOUGHTLINE_EVIDENCE_DIR=acceptance/evidence/round1/calendar-motion THOUGHTLINE_ATTEMPT=geometry-attempt-20261009-1 node tests/electron/calendar-geometry-workflow.cjs` 退出码 0；补验后 `git diff --check` 退出码 0。保留原窗口 bounds 记忆、Detail 不污染、设置值、仓库正文断言，并检查月↔日、月↔年双向来源和 210/230ms。此补验只修改测试，未重跑 typecheck/build/全量。 | `acceptance/evidence/round1/calendar-motion/geometry-attempt-20261009-1/` |

最终 `sampled-frames.json` 的几何数据：月历可见副本宽度 465.5→236.1→218.5 DIP，对应月份格约 218.3 DIP；日纸卡真实目标宽度 344.9→656.4→678.9 DIP；返回可见纸卡副本宽度 407.3→92.9 DIP，对应日期格约 92.7 DIP。对应 PNG 为 `month-to-year-frame-{1,2,3}.png`、`month-to-day-frame-{1,2,3}.png`、`day-to-month-frame-{1,2}.png`。这些数值证实受控时间点的空间变化，不证明自然帧率或主观手感。

最终 motion fixture 临时目录为 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-calendar-motion-XlxyQg`；应用正常 `app.close()`，记录 PID `58525, 58527, 58528, 58532, 58533, 58534`（58525 在进程指标中重复），等待退出后删除自有目录，`stat` 返回 ENOENT，`cleanup.json` 中 `normalClose/dataRemoved/allExited/passed` 均为 true，`recoveryError/cleanupError` 为 null。既有 workflow 的自有临时目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-round2-calendar-ANFQ7X` 同样正常关闭、PID 退出、删除与 ENOENT；详见其 cleanup JSON。失败 attempt 亦保留独立回执与帧图，没有覆盖旧日志或 kill 进程。

自检中的两项测试脚本问题分别是 Playwright 点击卡片会自动滚动，改为记录真实点击时的 scroll；以及曾在 calendar 模式直接调用只允许 settings 模式的 `saveSettings`，得到“请录制有效的组合快捷键”，改为在 settings 模式保存后复测。这些是测试设计修正，不记作产品故障。首版空色块与普通截图管线只捕获终态的证据均保留在较早 attempt 中，不能用于声称最终缩放效果。

## 保留的验收边界

本轮是 macOS arm64 上的源码 Electron 合成数据检查，没有 Windows 实机、真实 iPhone 对照、物理 IME、真实保存失败注入、自然运行帧率或用户手感验收。原地编辑的成功保存与返回滚动由既有 workflow 覆盖；新 workflow 用合成 composition 事件验证未确认时不离开、结束后保存最后修改，不能替代物理输入法测试。真实保存失败的取消路径仍未注入验证，`prepareLeave` 顺序保持。Apple Motion HIG 只作“层级过渡帮助用户跟踪来源”的方向参考；没有读取到需声称的完整页面正文，也不称一比一复现。当前冻结等待父任务独立 Spec＋Quality 审查。

原先 `tests/electron/calendar-geometry-workflow.cjs` 仍断言旧的 120ms CSS 动画与 `transformOrigin`，初次冻结时未纳入 Task 7 所有权、也未重跑；这段历史状态保留在前次报告与父任务记录中。父任务随后明确扩大所有权，本次只更新该 fixture 的过时动效断言，不删其窗口/存储检查。新断言依真实元素验证日期格→纸卡 230ms、纸卡→日期格 210ms、月历→全年对应月份 210ms、月份格→月历 230ms、返回全年同月 210ms，并确认进入目标的真实内容有 scale keyframe。几何补验的临时目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-calendar-geometry-iyER2l` 正常 `app.close()`；PID `58965,58966,58967,58968,58970,58973`（58965 重复记录）均退出后移除自有目录，`stat` 为 ENOENT，回执 `normalClose/dataRemoved/allExited/passed=true`，`failure/cleanupError=null`。这是源码 Electron 的模拟 bounds 验证，不是物理多屏/DPI 验收。现在再次冻结，等待父任务独立 Spec＋Quality 审查。

## 独立审查修复轮 1／5：S1、S2、Q1

父任务的只读审查在 `calendar-motion-review.md` 提出三个**源码推导**缺口：等待 `prepareLeave` 的旧导航可能跨 `manageSession` 继续；空日期返回副本漏掉 `.empty-list`；滚动时活动副本仍使用旧锚点。本轮先新增 `tests/electron/calendar-motion-fix1-workflow.cjs`，在生产修改前用源码 Electron、合成数据和受控状态验证。所有下述命令继续使用上述显式工作目录、`/bin/sh`、`login:false`、Node 24 PATH；实际 host 为 `darwin/arm64/24.3.0`。

| 检查 | 命令与实际结果 | 回执 |
| --- | --- | --- |
| 修复轮 RED | `THOUGHTLINE_ATTEMPT=fix1-red-20261009-1 node tests/electron/calendar-motion-fix1-workflow.cjs`，退出码 1。四项分别失败：空日副本 `.empty-list` 为 0（期望 1）；滚动后活动层为 1（期望 0）；窗口 resize 后活动层为 1（期望 0）；旧保存回执释放后新会话 `.month-grid` 为 0（期望 1）。`cleanup.json` 原样保留四条 AssertionError，不把它们写成用户设备复现。 | `acceptance/evidence/round1/calendar-motion/fix1-red-20261009-1/cleanup.json` |
| 修复轮最终 GREEN | `THOUGHTLINE_ATTEMPT=fix1-green-20261009-4 node tests/electron/calendar-motion-fix1-workflow.cjs`，退出码 0。五项通过：空日文字真实缩回、用户滚动取消、程序化返回滚动不误取消、窗口尺寸变化取消、旧保存完成后不覆盖新会话且正文已保存。中间 `fix1-green-20261009-1/2/3` 均通过，按唯一 attempt 留存；最后一个 attempt 新增受控 25/100ms 空日逐帧图。 | `acceptance/evidence/round1/calendar-motion/fix1-green-20261009-4/` |
| 受影响原工作流 | `THOUGHTLINE_ATTEMPT=fix1-motion-20261009-1 node tests/electron/calendar-motion-workflow.cjs`、`THOUGHTLINE_ATTEMPT=fix1-geometry-20261009-1 node tests/electron/calendar-geometry-workflow.cjs`，均退出码 0。`THOUGHTLINE_EVIDENCE_DIR=acceptance/evidence/round1/calendar-motion/fix1-calendar-20261009-2 THOUGHTLINE_ATTEMPT=fix1-calendar-20261009-2 node tests/electron/calendar-workflow.cjs`，退出码 0；原有日历断言全部保留。 | 对应三个 `fix1-*` attempt 目录 |
| 最后生产修改后的静态检查 | `npm run typecheck`、`npm run build`、`node --check tests/electron/calendar-motion-fix1-workflow.cjs`、`git diff --check` 均退出码 0。测试脚本最后只增受控帧拍摄，不涉及生产源码，无需再次构建。未跑全量测试或安装包。 | 本轮终端记录 |

生产修复仅在 `Calendar.tsx`：等待保存前记录发起的 `manageSession` 和 intent，保存 Promise 返回后同时核对组件仍挂载、会话仍相同、操作仍最新，才改变导航。会话重置使旧 intent 失效，并清除旧返回滚动与工具面板；卸载也使 intent 失效并清除活动层。`run()` 同样避免旧会话回调设置当前页面提示或发起动作。`prepareLeave` 仍先完成，合成输入法未确认或保存失败仍阻止离开。空日的有界可见副本纳入 `.empty-list`，继续沿用 aria-hidden/inert/禁指针与选择器清理。活动层在**实际 scrollTop 偏离创建时锚点**或窗口 resize 时立即取消；恢复历史 scrollTop 后队列里的程序化 scroll 事件因位置与新锚点相同而忽略。新用例确认有 180px 实际滚动时取消，而程序化返回仍有 `day-to-month` 动画。

S1 用测试侧 Electron `ipcMain` 包装器让更新先由原处理器真正保存、再暂缓给阅读器的成功回执；随后通过 `thoughtline:info-update` **合成发布**新 `manageSession`，释放旧回执。RED 时旧 `go('trash')` 把新会话月历改成最近删除，GREEN 时保持月历，主进程快照正文为“跨会话保存必须先完成”。这是受控组件边界与保存顺序验证，不声称真实托盘连续操作已复现同一竞态；卸载分支有显式失效代码但本 fixture 没有独立可观察的卸载竞态断言。空日的 `empty-day-return-controlled-early.png` 与 `...-mid.png` 是暂停 WAAPI 设为 25/100ms 的源码 Electron 像素，不是自然帧率；早帧能看到空状态文字向原日期格移动，中帧文字接近淡出。仍待独立真机手感与 Windows 运行验证。

修复轮 RED 临时目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-calendar-motion-fix1-1PAuBG`，PID `60446,60447,60448,60449,60450,60451`；最后 GREEN 目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-calendar-motion-fix1-gHh0QT`，PID `60909,60910,60911,60912,60913,60914`。两个目录均正常 `app.close()`、等待 PID 退出、仅删除自有临时目录、`stat` 确认为 ENOENT；RED 的 `passed=false`、GREEN 的 `passed=true`，两者 `recoveryError/cleanupError=null`。原 motion、geometry 复跑回执分别记录 `normalClose/dataRemoved/allExited/passed=true`、失败字段为空；正确 evidence 目录中的既有 calendar workflow 回执记录正常关闭、PID 退出、目录 ENOENT，其脚本没有 `passed` 字段，成功依据是退出码 0 和原断言完整执行。

测试流程错误：首次复跑 `calendar-workflow.cjs` 时我漏设 `THOUGHTLINE_EVIDENCE_DIR`，它向原 `acceptance/evidence/round1/` 的五张 tracked P3 PNG 路径重新写入图像。我随即对 `p3-ui-month.png`、`p3-ui-day-3col.png`、`p3-ui-day-2col.png`、`p3-ui-year.png`、`calendar-workflow.png` 执行定向 `git diff --exit-code`，退出码 0；再逐个比较 `git hash-object` 与 `git rev-parse HEAD:path`，五对哈希全部相同，确认五张文件字节与 HEAD 相同。该次新生成的 `acceptance/evidence/round1/calendar-cleanup-fix1-calendar-20261009-1.json` 原本就是唯一新文件，已移至 `acceptance/evidence/round1/calendar-motion/fix1-calendar-20261009-1/cleanup.json`；没有覆盖原有 JSON。随后设置唯一 evidence 目录正确重跑为 `fix1-calendar-20261009-2`，保留全部原断言和回执。此错误只影响证据落点与 mtime，没有改变五张 tracked PNG 内容。

本轮再次冻结，交父任务以 before-fix1 限定差分独立复核；没有 commit、push、package 或 tag，也未改 P6 文件。
