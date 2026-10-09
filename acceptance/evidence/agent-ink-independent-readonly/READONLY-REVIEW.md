# Agent 字色修正：独立只读复验

本轮在准确固定源/图上确认：正常 1440×340 浅、深主题图中，Codex 可辨蓝色、Claude 可辨暖赭色，通用中性，正文和标题未染色。旧 85% 深灰混色的近黑问题在这一观察范围已纠正。用户最终视觉认可仍待反馈，不能转为整体验收或把 0.0.13 历史功能通过继承给此 0.0.14 候选。

固定生产源码 `796bbeaac9ba3d2f2895dd26b7fab695b620d735`；原图/证据 `764bec916db7e9e3fb823c56499c046ebf597ba7`；ICC 分析与文档校正 `327e64c7c00bfdfd97dcb5252704a2e8fffbe781`。独立从 Git 固定对象读取，没有改构建者树、生产代码、用户安装版或数据；本轮没有启动 Electron、触发系统热键、运行安装器、操作系统剪贴板或占用原生时段。

## 通过范围与证据

- 独立实际查看 8 张修前/修后原图（2 主题 × 正常整体/1.5×标签近景 × 前后）。[浅色正常修前](before/light-three-overall.png)、[修后](after/light-three-overall.png)；[深色正常修前](before/dark-three-overall.png)、[修后](after/dark-three-overall.png)。近景为 renderer transform 放大，不能代表物理高 DPR 或缩放矩阵。颜色结论以正常图为主。
- [原始绑定核验](binding-check.json)：6 源码/测试 SHA 与 22 原证据 SHA 全部一致；796bbea→764bec9 的 src/tests/scripts/package/.github 无差异。原 manifest 的 CI “尚未调度”是历史状态，当前结果由下面独立取得的固定 run 证据补充。
- [独立纯源码/字段检查](review-check.json)：6 张卡的固定 ID、正文摘录、Agent、variant、纸形路径、绳路径、纸框及标签矩形前后一致；通用字色、所有标题/正文字色未变。实际执行固定颜色函数，默认 Agent 四组在标签区域纸面最多 1.5% 暗化的模型对比为 4.6030–4.6179。这是标签背景模型，不是全部曲面/抗锯齿像素最低值。
- 源码变更仅 Agent 字色算法与对应 CSS 变量，保持色相/饱和度并降低所需明度，已可读原色直接保留。浅 Codex/Claude `#266BB6/#955D22`，深 `#17416E/#5A3814`；通用、标题、正文保持原色。纸形/命中/状态机未因本次颜色修正改变。
- 审阅源 Electron 脚本的 IPC 等待：`composer.evaluate(async … return window.thoughtline.submit(...))` 的返回 promise 被外层 await；三卡出现、主进程解锁、展开进度、主题状态均有实际等待。不是旧“只发出异步调用便成功”的假阳性。脚本默认 fixture 模拟完整 globalShortcut 注册，不注册真实全局热键。构建者 before 正确颜色判据 exit1、after exit0，清理记录保留；QA 没有独立重跑此原生流程。

## 发现及处理

**P2（证据可靠性，已校正）：原 PNG raw 编码被当作 sRGB。** 原 `agent-ink-pixels.py` 仅 `Image.open(...).convert('RGB')`，未应用图片所带 Google/Skia ICC；直接输入 sRGB 亮度公式，导致四个有色字代表对比偏高。复现步骤：对原 `after/*-three-overall.png` 相同文字 ROI 和邻近纸面取样，分别用旧脚本与 [独立 ICC 感知脚本](icc-aware-pixel-check.py)；后者用 ImageCms 在内存归一化到 sRGB。原图不重写。ICC SHA 为 `c5a1211c45815386aebcd9659acde84f4c04698f207d370fa1451c123ab5c5f3`。

| 主题/标签 | 旧原始编码错误对比（约） | ICC→sRGB 代表对比 |
| --- | ---: | ---: |
| 浅 Codex | 5.886 | 4.611394009 |
| 浅 Claude | 5.830 | 4.609096654 |
| 深 Codex | 4.885 | 4.636182541 |
| 深 Claude | 4.870 | 4.654414246 |

[独立复算](icc-aware-pixel-check.json) 与 327e64c 的正确输出六行（含通用）逐字段及浮点误差 <1e-10 一致。修正脚本 SHA `c01a378212db8442345e2d44cc20242cee85177bdd3d3f00d18e2d425041f55a`；[最终绑定检查](final-binding-check.json) 确认 6 校正归档和 7 Windows 归档 SHA 全部一致，src/unit/package/scripts/.github 与原八图/22索引均未改变。旧错误分析仍留在 [原 after 分析](after/pixel-observation.json)，已撤回数值，正确结果在 [校正输出](agent-ink-icc-correction/after-pixel-observation.json)。此次缺口在脚本/数值/文档范围结案，不改变实际观图结论，不算新生产功能失败。

正确数字仍只表示选定文字内部样本与旁边合成上部纸面；通用浅/深代表对比分别 5.812593/4.521921。不能宣传“AA 每像素最低”、显示器实测或全部自定义色/所有环境均通过。

## Windows 固定构建证据

独立只读查询 [run 37868192110](https://github.com/NocodeMrLi/thoughtline/actions/runs/37868192110)：准确 HEAD 为 764bec916db7e9e3fb823c56499c046ebf597ba7，completed/success；日志有 18 文件 78 单测通过、类型/构建、NSIS 打包/hash/上传成功。见独立 [run 元数据](windows-ci.json)、[日志](windows-ci.log)。未重新调度 CI。

独立只读流式 SHA256 核验构建者已下载的 `Thoughtline-0.0.14-win-x64.exe`：111267280 字节，`5427ecafd7d1e5e18b254413d402476301d3cff7f1190728176ba293ff814e33`，与固定 CI 下载 receipt 一致。它是私有测试候选；未执行安装器、未验证物理 Windows/IME/Agent 交互。327e64c 后续 ICC 分析修正不在这个 CI 执行范围，不能扩大声明。

## 未测与交付边界

本轮独立通过的是源函数/不可变字段、实际图观察、ICC 复算、Git/CI/安装器 SHA 绑定。构建者原生 after 流程及清理是审阅证据，没有替代为 QA 原生通过。本候选尚未进行独立冻结包、完整宽度/数量/交互矩阵、物理 Windows、真实 IME/Agent、全部显示缩放或全屏抑制验收；G7 仍隔离且不放行。主观纸感/夹持/颜色认可等待用户。旧 0.0.13、暂停锁独立复验报告保持各自固定范围，不继承。

无剩余文件/读取/计算阻塞；本轮无原生实例或原生计划冲突。所有独立交付位于本目录，原图与历史证据未覆写；索引见 `review-sha256.json`。
