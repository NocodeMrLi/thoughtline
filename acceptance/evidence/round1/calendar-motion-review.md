# Task 7 独立 Spec＋Quality 审查

范围：以 `fa45cb8` 的旧日历动效为基线，审查冻结的 `calendar-motion-working.diff`（Calendar、日历 CSS、motion 与 geometry 两个 workflow）及实现报告。实际主机为 macOS arm64；本审查只读源码、现有受控回执和最终逐帧 PNG，没有重新运行原生 fixture、全量测试或修改源码。`calendar-motion-report.md` 所列通过项是实现者回执，不是本审查重新执行的结果。

## Spec 轴：暂不批准（2 项）

### S1 · P1：异步导航未随 `manageSession` 失效（源码推导，未作受控复现）

- 位置：`src/renderer/components/Calendar.tsx:49-52,86-88`；会话确会原地递增并重新发布，见 `src/main/index.ts:188-193,201-206` 与 `src/renderer/main.tsx:19`。
- 步骤：在 Calendar 的阅读器内有待保存编辑时点击“返回”，使 `back()` 停在 `await prepareLeave()`；保存未完成期间，从托盘/挂绳再次打开日历，`manageSession` 递增但 React 仍复用 Calendar；旧保存 Promise 成功后继续执行旧 `back()`。
- 预期：新会话的层级、选中项、历史及滚动不受上一个会话的回调影响。实际源码路径：会话重置 effect 仅 `setNav/setHistory/setSelected`，没有递增 `navigationIntent`；旧回调的 `intent===navigationIntent.current` 仍可能成立，随后执行 `setSelected(null)`、旧 `history` 的 `setNav(last)` 或 `setHistory`。`go()`、`openIdea()` 同样只有 intent 比较，没有会话号比较。结果取决于异步完成与 React effect 的先后，但缺少拒绝旧会话回调的条件是确定的。
- 本轮新增的 intent 防止同一会话内较早的 `prepareLeave()` 覆盖较新操作，却未覆盖 brief 明确要求的会话边界。建议在会话变化和卸载时失效 pending intent，并在 await 后核对发起时的会话；保持 `prepareLeave` 先完成的保存语义。测试用可控延迟保存覆盖旧回调不得改新会话。

### S2 · P2：空日期返回时可见内容未缩回日期格（源码推导，未作受控复现）

- 位置：`src/renderer/components/Calendar.tsx:20-30,87,100-102`。
- 步骤：打开没有念头的日期，看到“这里还没有念头。”，再点“返回”。
- 预期：日层级的可见内容从当前纸卡区域缩回对应日期格；空状态也应连续，或明确采用无空间过渡的终态。实际源码路径：`day-to-month` 的 `motionVisual()` 只选 `.calendar-day-papers h2,.calendar-paper,.calendar-load-more`；空日期仅渲染 `.empty-list`，故副本为空，`calendar-motion-surface` 虽按几何缩小却没有真实日内容。最终内容由目标日期格淡入。现有 motion fixture 建立 30 张同日纸卡，未覆盖空日期。
- 这是用户要求的“真实有界内容参与视觉缩放”在空状态下的缺口。建议将当前可见空状态纳入有界副本，或为空日定义不会显现空框的轻过渡，并补受控空日期往返。

## Quality 轴：暂不批准（1 项）

### Q1 · P2：滚动中目标几何可能与活动副本脱锚（源码推导，未作受控复现）

- 位置：`src/renderer/components/Calendar.tsx:51,55-71,97-103`；`src/renderer/styles/auxiliary.css` 的 `.calendar-content{overflow:auto}`。
- 步骤：在较窄/较短窗口点击日格进入纸卡，230ms 内滚动纸卡区；或在已滚动日卡返回月历的 210ms 内滚动目标月历区（当字号/窗口使其可滚动）。
- 预期：新交互打断动效，或副本继续跟随当前源/目标。实际源码路径：`captureMotion` 和 `useLayoutEffect` 各取一次固定矩形，WAAPI 的终点由旧矩形组成；搜索、筛选、翻月、加载更多会 `cancelMotion()`，但滚动没有监听或重新测量。滚动会移动 `.calendar-content` 内的真内容，而附着在 `main` 上的绝对定位副本继续向旧坐标运动。由于只有 210/230ms，本项严重性低于会话覆盖，但违背可打断和清晰锚点方向的质量要求。建议在活动过渡期间的 scroll 事件取消当前动画，并补一次受控滚动打断检查。

## 已确认的通过部分与证据边界

- 对最终 PNG `month-to-year-frame-1/2.png`、`month-to-day-frame-1/2.png`、`day-to-month-frame-1.png` 的目视检查显示实际月历数字、纸卡与日期标题参与空间变换；首版空框问题在有内容路径上已修正。`sampled-frames.json` 给出月历副本宽 465.5→236.1→218.5 DIP、纸卡进入宽 344.9→656.4→678.9 DIP、返回可见副本宽 407.3→92.9 DIP。它们是暂停 WAAPI 后的受控帧，不是自然帧率或手感证据。
- 源码中年↔月和月↔日锚点与方向、210/230ms、目标真实内容 scale、`aria-hidden`/`inert`/禁指针的有界副本、动画结束及新导航清理、运行时系统/设置减少动态取消，均与主路径要求一致。已有 motion/geometry/workflow 回执声称通过，并保留 bounds、Detail、数据、窄窗两列、9→27、返回 scroll 与合成 composition 的断言；未因单测存在而替代以上边界审查。
- 未测试：物理 iPhone 对照、Windows 实机、物理 IME、真实保存失败注入、自然运行帧率与主观手感。上述三项发现都是源码推导，尚不是设备复现结论。P6 交付文件和其他 WIP 不在本审查范围。修复后建议只重跑对应限定 fixture 与受影响的原有 calendar workflows，再进行最终独立视查。

## Fix 1 限定再审（2026-10-09）：原结论已由本节更新

复核输入为冻结的 `calendar-motion-fix1.diff`、实现报告的 Fix 1 段、`fix1-red-20261009-1` 与 `fix1-green-20261009-4` 回执及空日 25/100ms PNG。实际主机仍为 macOS arm64。本次未执行测试或改源码；以下“通过”指独立核对了源码和现有受控证据，不等于物理设备验收。

### Spec 轴：批准本次修复范围（S1、S2 已处理）

- **S1 已处理。** `Calendar.tsx:49-55,93-96` 在每次 `go/back/openIdea` 等待 `prepareLeave()` 前记录 session/intent，返回后校验组件挂载、当前 session 与最新 intent；会话重置及卸载使旧 intent 失效，旧 `run()` 回调也不会改新会话提示。旧保存仍先完成。受控 fixture 将真实保存后的 IPC 成功回执暂缓，再**合成发布**新 `manageSession`：修前旧 `go('trash')` 覆盖新月历（RED 0≠1），修后旧回执释放仍保持月历且正文已保存（GREEN）。这是可控的渲染组件边界验证；真实托盘/挂绳连续操作和卸载竞态未单独复现。
- **S2 已处理。** `Calendar.tsx:22` 把 `.empty-list` 纳入当前可见的日层级副本，仍经原有可见矩形筛选、选择器/ARIA 清理及禁交互层。`fix1-green-20261009-4` 记录空日副本 `emptyCount=1` 和文案；目视检查 `empty-day-return-controlled-early.png`、`...-mid.png`：25ms 文案位于向对应日期格移动的副本内，100ms 接近目标并淡出。帧图为暂停 WAAPI 后的源码 Electron 像素，不能证明自然帧率。

### Quality 轴：批准本次修复范围（Q1 已处理；邻接 resize/恢复滚动无新发现）

- **Q1 已处理。** `Calendar.tsx:73-78` 在创建活动层时记录当前 `scrollTop`；只有实际偏离该锚点超过 0.5 DIP 的 scroll 事件才取消层与目标动画。修前实际滚到 180 DIP 后层仍为 1，修后为 0。`useLayoutEffect` 先恢复历史 scroll，再建立锚点，因此程序化返回滚动事件不会误取消；独立用例确认返回动画仍存在。窗口 resize 同样取消旧几何层，修前/修后回执分别为 1/0。清理函数移除两个监听器、取消双 WAAPI 并删除层；未看到新残留路径。
- 原有 motion、geometry、calendar 工作流的修后回执均记录退出码 0；typecheck、build、脚本语法检查及 diff 检查记录为 0。父任务 `controller-cleanup-fix1-audit.json` 对 22 个回执目录及 131 个独立 PID 的只读审计为目录全不存在、PID 全退出。遗漏 evidence 环境变量的那次 calendar 回执已移入本任务目录；五张原 P3 PNG 的字节哈希与 HEAD 相同。上述均是已记录回执，本再审未重跑。

**本次差分没有新的阻断发现。** 原报告的“暂不批准”是修前历史结论，现就 Fix 1 后的 Task 7 源码与受控证据批准 Spec 和 Quality 两轴。仍待 Windows 实机、物理 IME、真实保存失败、自然帧率及用户手感验收；合成 session 事件不能表述成真实用户路线复现。
