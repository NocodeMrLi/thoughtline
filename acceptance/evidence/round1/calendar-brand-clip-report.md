# Task8 Calendar TL 原图夹子标识实施报告

状态：实现冻结，待上级做范围审查和最终集成。本报告仅覆盖 Calendar 的装饰性标识和隔离 Electron 源码预览。

## 改动

- `src/renderer/components/Calendar.tsx`：`MiniClip` 复用已批准 `assets/source/approved-TL-brand-logo.jpg`，通过内联 SVG `viewBox` 显示原图中的珊瑚红斜向夹子。现有月日期计数、年月份计数、纸张标识三个调用点均共用此组件。外层 `aria-hidden`，SVG 不进入焦点序列。未改动 Clothespin、主 Shelf、编辑、导航或动效实现。
- `src/renderer/styles/auxiliary.css`：22×17 的固定标识框使用自包含 CSS 多边形裁切原图轮廓，避开 TL 深青字母和方形奶油底；纸张上的标识居中贴近纸边。裁切不依赖 DOM ID，动效克隆保留显示。
- `tests/electron/calendar-brand-clip-workflow.cjs`：独立合成资料夹中的实际 Electron 月／年／纸张与动效截图夹具。未加入最终 CI 列表；如需要，P6 集成由上级决定。

原图 SHA256：`313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778`；文件未修改。构建输出只含一份约 98.37 kB 的原图资源。没有编辑／重绘图片文件、使用 Python 裁图、安装依赖或制作包。

## 验证

在 `/Users/lihongwei/Desktop/晾念头 : Thoughtline/app`，使用 Node 24 PATH：

- `npm run typecheck`：exit 0。
- `npm run build`：exit 0。
- `node tests/electron/calendar-brand-clip-workflow.cjs`：exit 0；合成数据目录与 `storageInfo().directory` 一致，月日期显示 3 条及 1 枚夹子、空日期没有夹子，年格 2 个有念头的月份显示夹子、纸张 3 张均显示夹子；原图在月／年／纸张／动效克隆中都实际加载为 1254×1254；动效克隆的 CSS 裁切在清除 ID 和 ARIA 属性后仍存在。月→年→月→日→月的导航按现有入口完成。`git diff --check`：exit 0。
- 初次夹具调用从 Shelf 读取仅 Manage 窗口可用的 `storageInfo`，返回“无效操作”；已修正夹具调用窗口。失败回执保留在 `acceptance/evidence/round1/calendar-brand-clip/attempt-1791552815104-62961/receipt.json`。

最终运行回执：`acceptance/evidence/round1/calendar-brand-clip/attempt-1791552901250-63361/receipt.json`。实际截图：

- `acceptance/evidence/round1/calendar-brand-clip/attempt-1791552901250-63361/month.png`
- `acceptance/evidence/round1/calendar-brand-clip/attempt-1791552901250-63361/marker-closeup.png`
- `acceptance/evidence/round1/calendar-brand-clip/attempt-1791552901250-63361/year.png`
- `acceptance/evidence/round1/calendar-brand-clip/attempt-1791552901250-63361/day-paper.png`
- `acceptance/evidence/round1/calendar-brand-clip/attempt-1791552901250-63361/day-to-month-motion.png`

截图显示小尺寸夹子保有原图的斜向、红色双臂和金属弹簧，计数与纸张文字未遮挡；放大截图检查过裁切边缘，没有深青字母或方形底色。放大显示仍可看到原图边缘少量亮色抗锯齿，这是源 JPEG 的像素；正常 22×17 尺寸下没有可见方块。

最终夹具通过正常 `closeManage`、`app.close()` 关闭，记录自身 PID 自然退出后才移除自身临时合成目录，回执 `fixtureRemoved=true`。原真实应用 PID 30628 在运行前后均存活。没有读取真实念头数据。

限制：这些是 macOS 上隔离 Electron 源码运行和 DOM／截图证据，不等同于用户真实资料验收、Windows 实机或打包应用验收。并行未提交改动由上级拥有，本任务没有提交、推送或发布。

## Fixround1：350px 月格计数

审查发现最窄 350 CSS px 管理窗口中，22px 标识与 5px 间隔使计数越出日期格。已在既有隔离夹具加入同月 3 条和 123 条的真实 DOM 几何断言与截图，先保留未修样式运行 RED：`THOUGHTLINE_ATTEMPT=fix1-red node tests/electron/calendar-brand-clip-workflow.cjs`，exit 1，回执 `acceptance/evidence/round1/calendar-brand-clip/fix1-red-1791553297778-64447/receipt.json`、截图 `month-350-one-three-digit.png`。当时 3 的右边 276.53px > 日期格右边 274.28px；123 的右边 244.69px > 日期格右边 230.57px。RED 正好来自新增越界断言。另一次更早的夹具数据预期错误也保留在 `fix1-red-1791553289375-64431/receipt.json`；已修正测试预期，不当作产品 RED。

生产修复只在 `src/renderer/styles/auxiliary.css` 增加 max-width 420px 的月日期格规则：内边距 4px、夹子与数字间距 2px，日期格夹子按原 22:17 比例缩成 17.6×13.6px；长计数完整换行到夹子下方，不截断。年格、纸张标识和原图裁切路径未动。夹具同时支持 `THOUGHTLINE_EVIDENCE_DIR` 与 `THOUGHTLINE_ATTEMPT`，每次仍追加时间戳和 PID 保证独立尝试目录；是否加入最终 Windows CI 清单由上级 P6 集成处理。

最终验证：`npm run build` exit 0；`THOUGHTLINE_EVIDENCE_DIR='acceptance/evidence/round1/calendar-brand-clip' THOUGHTLINE_ATTEMPT=fix1-final node tests/electron/calendar-brand-clip-workflow.cjs` exit 0；`git diff --check` exit 0。最终回执 `acceptance/evidence/round1/calendar-brand-clip/fix1-final-1791553372936-64801/receipt.json`，350px 截图 `acceptance/evidence/round1/calendar-brand-clip/fix1-final-1791553372936-64801/month-350-one-three-digit.png`。3 的右边 267.13px < 日期格 274.28px；123 换行后右边 215.69px < 日期格 230.57px、下边 315.09px < 日期格 321.09px。截图确认两种完整数字、日期和夹子均可辨认。原图 SHA256 仍为 `313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778`。夹具按正常关闭并移除自己的合成目录，`normalClose=true`、`fixtureRemoved=true`；原应用 PID 30628 仍存活。没有编辑其他生产模块、提交、推送或发布。

## Fixround2：按实际日期格宽度换行

限定复审发现 fixround1 的 420px 断点外、421px 窗口仍溢出。保留当前生产样式先扩充夹具：在 350、421、500、740 CSS px 对同月 3 条和 123 条分别测量数字与夹子的边界，并留实际截图。RED 命令 `THOUGHTLINE_ATTEMPT=fix2-red node tests/electron/calendar-brand-clip-workflow.cjs` exit 1，准确失败为 `421px 123 count escapes date cell horizontally`，回执和截图位于 `acceptance/evidence/round1/calendar-brand-clip/fix2-red-1791553592896-65180/`；正常关闭及自身临时目录清理均为 true。

生产修复只在 `src/renderer/styles/auxiliary.css` 让 Calendar 日期计数行始终 `max-width:100%`、`min-width:0` 且允许 flex 换行。这样任何窗口宽度都按日期格真实内容宽度决定同行或换行；原 420px 内缩小夹子的比例规则保留，仅去除重复的换行声明。年格、纸张、原图裁切、导航和动效未改。

最终 `npm run build` exit 0；`THOUGHTLINE_EVIDENCE_DIR='acceptance/evidence/round1/calendar-brand-clip' THOUGHTLINE_ATTEMPT=fix2-green node tests/electron/calendar-brand-clip-workflow.cjs` exit 0；`git diff --check` exit 0。回执：`acceptance/evidence/round1/calendar-brand-clip/fix2-green-1791553614208-65243/receipt.json`。同目录实际截图：`month-350-one-three-digit.png`、`month-421-one-three-digit.png`、`month-500-one-three-digit.png`、`month-740-one-three-digit.png`。四宽度的 3／123 数字及夹子都在各自格内；421px 的 123 在夹子下完整换行（右边 258.26px < 格右边 281.28px），500／740px 空间充足时保持单行。夹子在 350px 为原图等比例 17.6×13.6px，其余宽度为 22×17px；夹具断言比例未偏移。原图 SHA256 仍为 `313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778`。自身应用进程正常退出、自身合成目录删除，`normalClose=true`、`fixtureRemoved=true`；原应用 PID 30628 保持运行。未提交、推送、接入 CI 或改动其他任务。
