# Task8 Calendar TL 品牌夹子范围审查

> **最终门禁（fixround2 后）：Spec ✅；Quality Approved。** 下方保留初审与 fixround1 的失败证据，最终结论以文末 fixround2 限定再审为准。

范围：只审 `calendar-brand-clip-brief.md` 对应的 preTask8→Task8 差异（`Calendar.tsx` 的导入与 `MiniClip`、`auxiliary.css` 的新增样式、独立 Electron 夹具），并核对实施报告、回执和实际 PNG。未把同一工作树里的日历动效、P6 或其他未提交改动纳入结论。

## Spec：❌（一处边界未满足）

**Important — 最窄日历窗口里计数越出日期格，三位数被邻格遮住。** 任务要求“counts/day text remain clear”和小而安静的标识；`src/main/windows/manage.ts:5` 允许 350px 宽。`src/renderer/styles/auxiliary.css:11` 将每枚标识增至 22×17，而 `:10` 的 `.day-count` 保持 5px 间距，`:12` 的窄窗日期格内边距为 6px。在 350px 的隔离 Electron 实测中，含 3 条念头的日期格右边为 274.28px，计数行右边为 276.53px，越出格边 2.25px；实际截图中数字“3”已落在格外。另一次同宽度、同日 123 条的合成数据探测，计数行右边为 288.41px，越出格边 14.13px；实际截图中数字与右邻日期格相叠，第三位不可完整辨读。建议仅针对窄窗压缩标识/间距或调整日期格布局，复测 350px 月历中一位和三位计数均完整留在本格，日期数字也不被标识遮挡。对应调用点 `src/renderer/components/Calendar.tsx:107`。

其余本任务规格符合：月日期、年月份和纸张共用 `MiniClip`；空日期、空月份无标识；原 JPEG 作为资源显示，SHA256 实查为 `313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778`，没有改动源图。实际月、年、纸张和动效 PNG 中可见斜向珊瑚红双臂及弹簧，普通大小无方形奶油底或深青字母；纸张上缘只遮住少量标识，仍可辨认且未遮正文。`aria-hidden`、`focusable="false"` 未增加焦点目标。动效克隆在 ID/ARIA 清除后仍显示自包含裁切。未见 Shelf、主夹子、编辑或导航的 Task8 范围改动。

## Quality：Needs fixes

同一处窄窗溢出是唯一需修复的质量发现。固定 22px 标识与 5px 间距在七列月历中没有为最小窗口留出空间，属于可复现的响应式布局问题；其余新逻辑小且集中，没有发现新的资源重复打包、ID 依赖或测试夹具越权清理。

## 核验与边界

- 实施者记录 `npm run typecheck`、`npm run build`、独立 Electron 夹具和 `git diff --check` 均 exit 0；本审查核对最终 `receipt.json` 的隔离目录、四处 1254×1254 资源加载、裁切、导航/计数断言和正常关闭，并独立执行范围内 `git diff --check`（exit 0）。`out/renderer/assets` 中只有一份该 JPEG 资源。本审查未重复完整构建或全套测试。
- 实际查看最终尝试的 `month.png`、`marker-closeup.png`、`year.png`、`day-paper.png`、`day-to-month-motion.png`，路径位于 `acceptance/evidence/round1/calendar-brand-clip/attempt-1791552901250-63361/`。图像加载断言仅证明资源可解码，外观结论来自这些 PNG 的目视检查。
- 四份已有回执：首次在 Shelf 调用 Manage 专用 `storageInfo` 报“无效操作”，其后三份完成；四份均 `normalClose=true`、`fixtureRemoved=true`。实际 JSON 中共有 **19 个去重的所属 PID**，审查时均已退出；真实应用 PID 30628 仍运行。
- 为核实上述唯一窄窗风险，另用隔离合成资料做了三次 350px 探测，命令形态为 `node <<'NODE'`（通过 `tests/electron/window-fixture.cjs` 启动源码 Electron、先核对 Manage 的 `storageInfo().directory`、主进程 `BrowserWindow.setBounds({width:350,height:540})`、读取 DOM 矩形与截图、`closeManage()`/`app.close()`、`cleanupIdleFixture()`）。最初一次脚本 exit 1，原始错误为 `locator.evaluate: TypeError: e.getBoundingClientRect is not a function`，原因是把计数文本节点当元素测量；其所属 PID 为 63871–63875，清理输出为 `{"fixtureRemoved":true,"pids":[63871,63872,63873,63874,63875]}`。修正后 3 条探测 exit 0，原始关键输出为 `windowWidth=350, cell.right=274.28125, dayCount.right=276.53125, marker.width=22, dayCount.width=33.9609375, isolated=true`，清理输出为 `{"fixtureRemoved":true,"pids":[63902,63903,63904,63905,63906]}`。截图已存 `acceptance/evidence/round1/calendar-brand-clip/review-350/count-3.png`。
- 同一风险的 123 条探测命令在上述 Node here-doc 外加 `set -o pipefail`，stdout 通过 `tee` 原样保存在 `acceptance/evidence/round1/calendar-brand-clip/review-350/count-123.log`，截图在同目录 `count-123.png`。exit 0；原始输出含 `ariaLabel="2026-10-09，123条念头"`、`cell.right=274.28125`、`dayCount.right=288.40625`、`number.right=288.40625`、`isolated=true`。实际独立数据目录为 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-brand-review-UYDx9q`，回执含 `fixtureRemoved=true`，审查时该路径为 `ENOENT`；所属 PID 64056–64060 均为 `ESRCH`，真实应用 PID 30628 仍存活。日志保留执行时截图的旧路径 `reviewer-350/count-123.png`；截图完成后整体证据目录改名为 `review-350`，图像内容未变。首两次探测没有在 stdout 打印各自临时目录的完整路径，现已移除，不能补造该字段；15 个探测所属 PID 复核均为 `ESRCH`，没有读取真实念头资料。临时 `/tmp/thoughtline-brand-review-350.png` 已复制到 `review-350/count-3.png`，可以移除。
- 这些是 macOS 源码 Electron 与合成数据证据，不能当作 Windows、打包应用或用户真实资料的原生验收。旧 R1–R4 动效/模型事项及最后的 CI 集成由上级处理，不计入本任务的发现。

结论：Spec 1 个 Important；Quality 1 个同源 Important。修复并复测 350px 月历后可重审此边界。

## Fixround1 限定再审（原结论保留为历史）

范围只含 `calendar-brand-clip-fix1.diff` 中的日历窄窗 CSS 与夹具新断言，不重新审其他工作树改动。

**Spec：❌；Quality：Needs fixes。** 350px 原失败点已修复：最终回执 `fix1-final-1791553372936-64801/receipt.json` 中，3 条计数右边 267.13px < 格右边 274.28px；123 条在夹子下换行，右边 215.69px < 格右边 230.57px、下边 315.09px < 格下边 321.09px。实际 `month-350-one-three-digit.png` 中两种计数、日期及夹子完整可见。新断言先在原样式下 RED（`fix1-red-1791553297778-64447/receipt.json` 的 `3 count escapes date cell horizontally`），再在新样式下 GREEN；构建和范围内 `git diff --check` 均 exit 0。最终夹具正常关闭、清理合成目录，原图 SHA 不变，真实 PID 30628 存活。

**Important — 420px 断点后一像素仍越格。** 新 CSS 位于 `src/renderer/styles/auxiliary.css:13`，仅对 `max-width:420px` 生效；到 421px 即恢复 22px 标识、5px 间距和日期格 6px 内边距。为核实而做的单次隔离 Electron 421px、同日 123 条探测（命令形态仍为 `node <<'NODE'`，只设窗口宽并读 DOM，未重跑全套）得到 `cell.right=335.140625`、`number.right=339.1171875`，计数越出格 3.98px。实际截图中“123”越过本格右边界。原始输出及截图分别为 `acceptance/evidence/round1/calendar-brand-clip/review-width-boundary/width-421.log`、`width-421.png`。建议让窄格规则覆盖全部无法容纳三位计数的窗口宽度，并在规则边界两侧做限定几何断言；仍只需处理月格，不改年格、纸张或原图。

421px 探测的 `storageInfo` 指向其自有合成目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-brand-review-421-MgfZLl`；进程通过正常关闭退出。该目录复核为 `ENOENT`，所属 PID 65058、65064、65065、65066、65067 复核均为 `ESRCH`；真实 PID 30628 仍存活。没有读取真实念头资料。

## Fixround2 限定再审：Spec ✅；Quality Approved

审查仅覆盖 `calendar-brand-clip-fix2.diff` 的日期计数行 CSS 与四宽度夹具断言。`src/renderer/styles/auxiliary.css:12` 现让 Calendar 的 `.day-count` 在所有宽度遵循本格可用宽度并按需换行；`max-width:420px` 仍只负责缩小月格标识和间距，年格与纸张未受影响。新夹具先在旧样式下于 421px 准确 RED：`fix2-red-1791553592896-65180/receipt.json` 报 `421px 123 count escapes date cell horizontally`；随后 `fix2-green-1791553614208-65243/receipt.json` 的 350、421、500、740px 两种计数均通过数字及夹子矩形位于格内、夹子比例保持的断言。两份回执均为正常关闭和自有数据目录清理，原应用 PID 30628 仍存活。

独立查看最终 350、421、500px 的 `month-*-one-three-digit.png`：3 与 123、日期数字均清晰；421px 时 123 完整换行到夹子下，500px 回到同一行。421px 的 123 数字右边 258.26px < 格右边 281.28px、下边 323.5px < 格下边 330.5px；350px、500px、740px 的回执矩形也全部位于格内。实际 PNG 路径在 `acceptance/evidence/round1/calendar-brand-clip/fix2-green-1791553614208-65243/`。原 JPEG SHA256 独立复核仍为 `313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778`；范围内 `git diff --check` exit 0。最终夹具五个去重所属 PID 65245–65249 复核均为 `ESRCH`，其 `fixtureDataDir` 复核为 `ENOENT`。

本次限定差异未发现新 Critical、Important 或 Minor；Task8 的原单个 Important 及 421px 相邻断点 Important 均已关闭。结论限于 Mac 源码 Electron 的隔离合成数据、截图和构建证据；Windows 实机、打包应用、用户真实资料验收及 CI 接入仍由上级汇总，不作为本次 Task8 失败项。
