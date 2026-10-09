# Agent小字可见色彩：修前/修后真实 UI

固定源码 `796bbeaac9ba3d2f2895dd26b7fab695b620d735`。用户00:56指出“字的颜色还全是黑色的”；此反馈更新旧2f1d24f色彩判断，原85%深灰/15%夹色虽实际应用，但不足以呈现已批准的可见蓝/暖橙。不是CSS覆盖失效。before computed蓝RGB35/47/63、橙56/48/43；实际PNG文字内部样本蓝27/35/48、橙42/36/32，近黑。数字不同不能替代正常尺度可见色彩。

修复只作用顶部Agent小字，保留夹色的色相/饱和度，按明暗主题纸面降低必要明度；通用保持中性，标题和正文保持原深色。新浅主题Codex为#266BB6、Claude为#955D22；深主题#17416E/#5A3814。这是用于可读文字的蓝/暖赭色，夹子本身原色没有修改。

| 实际UI（DPR1） | 修前 | 修后 |
| --- | --- | --- |
| 浅色三纸正常尺度1440×340 | [before](evidence/agent-ink-review/before/light-three-overall.png) | [after](evidence/agent-ink-review/after/light-three-overall.png) |
| 浅色Agent标签1.5×近景 | [before](evidence/agent-ink-review/before/light-agent-labels-1.5x.png) | [after](evidence/agent-ink-review/after/light-agent-labels-1.5x.png) |
| 深色正常尺度 | [before](evidence/agent-ink-review/before/dark-three-overall.png) | [after](evidence/agent-ink-review/after/dark-three-overall.png) |
| 深色Agent标签1.5×近景 | [before](evidence/agent-ink-review/before/dark-agent-labels-1.5x.png) | [after](evidence/agent-ink-review/after/dark-agent-labels-1.5x.png) |

两组是真实隔离Electron renderer，使用完全相同clip ID/文字/Agent、纸形和框架坐标；不是AI图或图片换色。已实际查看新浅色整体、标签近景及深色整体，蓝和暖橙可直接辨认，仍由父会话实际审图后交用户。形体与已有夹持/按钮边界未改；不能因此宣布最终视觉验收。

可读性不再只取未叠加纸基色：算法对标签区域上部across-gradient最深1.5%暗化的纸面保持前景sRGB对比≥4.6。标签位于压痕下、下三分之一曲面上，不把此区域界限推广至整张曲面所有像素。实际PNG附近合成纸面与代表性暗文字内部像素的对比，浅Codex/Claude约5.886/5.830，深约4.885/4.870，见 [像素观察](evidence/agent-ink-review/after/pixel-observation.json)。此为代表性内部样本，**不是所有抗锯齿边缘像素的最低对比或显示器实测**；可见蓝/暖橙必须与实际图一起判断。

before真实UI色彩判据红，after绿；78 unit、类型、构建与after源码原生exit0。首次纯颜色校准的过严80通道差阈值和深色自定义颜色floor一阶偏差记录保留，后者已修为可读原色直接保留，色彩支持判据与before/after原生统一为通道差≥60且饱和度≥.45；数值仍只辅助视觉。自己的全部实例/PID退出并有界删除假数据，没有真实globalShortcut/剪贴板/安装版/便签操作。源码、编译文件、图与日志hash见 [manifest](evidence/agent-ink-review/manifest.json) 及同目录索引。

暂停解除旧锁仍是单独已修阶段：3e56454 / 36824b7，7红→75绿及受控Mac窗口10点、编辑/组/拖出回归通过。新增 [独立只读报告](evidence/paused-unlock-independent-readonly/READONLY-REVIEW.md) 以准确旧/新纯TS回放再确认7场景红绿、活跃锁保留、暂停字段不动和未暂停trace不变；QA没有独立再跑原生。自动全屏G7/物理Windows/IME与整体验收未结案。

先冻结本预览，再用既有test-packages.yml workflow_dispatch运行本分支固定SHA；无须改变权限/secrets/触发配置，不发布release或合并main。Windows状态随后单独报告，旧.13 CI不用于当前代码通过。
