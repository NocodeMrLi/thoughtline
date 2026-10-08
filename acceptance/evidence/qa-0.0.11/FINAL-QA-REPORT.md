# Thoughtline 0.0.11 独立复验

截至 2026-10-09 01:56（Asia/Shanghai）。**受限的 Mac 桌面初次体验可以继续；完整验收不能放行。** 已测的新建草稿生命周期、固定绳、夹子、临时入口、冻结包和空闲性能通过。未发现仍未修复的 P1 数据丢失问题。自动全屏抑制仍是已知 P2 缺口；物理 IME、焦点/穿透、Windows、真实 Agent 接收等没有通过声明。

本次运行固定于生产提交 `f99cdea07d28e03f112b405e36968c791fa10550`，版本 `0.0.11`；QA checkout 为证据提交 `7f5fa0a6743548d9273d9866705100440c62d879`，生产路径与 f99cdea 无差异。随后仅静态核验修正提交 `264e168ea2ce886f23ca5f00e51c0dbdf4206335`：GitHub 远端分支准确指向它，生产 `src/package.json/package-lock.json/scripts/.github` 仍与 f99cdea 一致。

## 边界与独立性

- 独立目录：`/Users/lihongwei/Documents/Codex/2026-10-09/task-2/qa-thoughtline`。没有修改生产代码或 tracked 测试，没有操作构建者工作树、用户安装版或真实便签数据，没有推送或发布。
- 已读父级 AGENTS、项目 00/03/04/05/08/09/12/13 相关设计及 ai-regression-testing 技能。用户最新固定绳要求覆盖旧数量下沉设计。
- 原生复验在父会话分配时段内，构建者暂停全部原生实例。默认 fixture 模拟快捷键注册；smoke/settings-lifecycle 也通过 QA wrapper 强制 `realShortcuts:false`。没有物理全局按键、真实聊天输入或第三方窗口输入。
- 源码测试与冻结包测试使用独立临时假数据。性能单独运行，采样期间没有 QA 交互实例。全屏靶窗为 QA 自建本地 data URL；指针仅由 QA 适配器模拟，没有移动桌面物理指针。
- 所有 QA 原生实例现已退出；只读 DMG 已卸载。性能临时目录清理残留也已清除。`source-unmodified.diff` 为空。
- 本机 Node `25.8.1` 超出项目声明的 Node24 范围；本地验证结果保留此限制。准确生产 SHA 的 Windows CI 使用 Node `24.19.0`，另行通过。

## 问题及结案状态

| 编号 | 严重程度 | 结论 |
| --- | --- | --- |
| Q1 | 原 P1 条件性草稿丢失 | 已修复并定向原生复验通过；物理 macOS Hide 菜单仍未测 |
| Q2 | 原 P2 异步取消假阳性 | 已修复并通过；等待主进程锁释放和原生隐藏后检查正文及 revision |
| Q3 | 原 P2 测试快捷键污染 | 通用 fixture 已修复；本轮模拟 OS registry，不能宣称物理键位通过 |
| Q4 | 原 P3 候选证据未绑定 | 已修复；版本、生产 SHA、包哈希与 58 单测/11 源码流程可追溯 |
| Q5 | P2 截图测试证据错误 | 已独立纠正，264e168 的测试和 12 图与 QA 结果吻合；不是产品失败 |
| Q6 | P3 性能脚本清理竞态 | 性能断言通过，原命令退出 1；临时目录已独立清理，脚本可靠性建议待同步 |
| 空态提示 | P3 用户约束细节 | 0.0.11 空绳仍显示“还没有念头 · 按 Control+Alt+N 写一条”；父会话已要求后续补丁，本轮未验收该补丁 |
| G7 | P2 已知产品缺口 | 自动全屏悬停抑制未实施；不能放行完整全屏标准 |

### Q1：未确认隐藏、退出、磁盘失败及重开

最终主进程只允许已确认保存/取消后的 composer 进入 30 秒释放。未确认原生 hide 保留 live renderer；重开恢复同一会话；退出捕获隐藏的新建草稿；保存失败阻止退出并重新显示原文。

独立复现步骤：打开假数据 composer → 填入含前后空格、换行、中文、emoji 的文本 → 实际 `BrowserWindow.hide()` → 等待 31.5 秒 → 重开检查逐字一致 → 再 hide → 临时目录 chmod555 → 请求退出 → 检查错误及原文、窗口仍可编辑 → 恢复权限退出 → 读取假数据磁盘草稿逐字核对。结果通过，见 [hidden-draft-native.json](qa-final-evidence/native-reports/hidden-draft-native.json) 和 [日志](qa-final-evidence/hidden-draft-native.log)。

已确认保存的快速重开、30 秒后销毁重建和正常退出由 lazy-window/settings 流程覆盖。编辑取消/退出按现有产品语义不提交编辑，不把编辑正文当作新建草稿覆盖；冻结包也验证已有新建草稿不被编辑覆盖。突发断电/强杀未测，不能把 live renderer 保留扩大为任意崩溃恢复承诺。

### Q5：旧“24 条”截图实际仍为 3 个夹子

原 `tests/electron/clothespin-workflow.cjs:28` 在点击夹子打开详情后，从 shelf 调用 `closeManage()`。主进程只信任 manage sender，拒绝该调用；测试没有断言返回值，manage 锁继续保持，布局冻结在 3 个。之后写入 24 条，仍把 3 个可见夹子的画面标为“24”。独立重跑四张 many 图均复现；原脚本退出 0 不能放行这项视觉声明。

修正脚本：[qa-clothespin-workflow.cjs](qa-thoughtline/qa-evidence/qa-clothespin-workflow.cjs)。只在 QA 未跟踪路径修改测试：从实际 manage page 关闭并断言 `closed.ok`，await 主进程 `!interactionLocked`；24 条写入完成后，先等待 DOM 数量等于正常容量，再锁定并截图。容量为 `min(activeNoteCount, 1 + floor((ropeLength - 184) / 220))`；本轮宽 1440 CSS px、绳长 1160 CSS px，容量 5。空/少/多数据为 0/3/24，可见夹子必须为 **0/3/5**。24 条仍可通过查找取得全文，无数据被挤出而丢失。

修正运行退出 0，[visual-corrected.log](qa-final-evidence/visual-corrected.log) 和 [完整几何 JSON](qa-final-evidence/native-reports/qa-clothespin-native.json)。264e168 仓库测试除 fixture import 与 `qa-` 文件名前缀外，与实际执行的 QA 脚本严格等价；12 个 Git blob 的 SHA256 全部与 QA 截图吻合，见 [独立同步核验](qa-final-evidence/correction-independent-validation.json)。不需要重跑未变化的生产候选。

### Q6：性能清理失败不等于性能失败

命令运行 `THOUGHTLINE_EXECUTABLE=<QA只读挂载App> node tests/electron/package-idle.cjs`。已完成 120.187 秒的五个样本，4 个 PID 始终稳定；单核 CPU **0.183048% ≤ 2%**，最后三次样本最高 RSS **266.734375 MiB ≤ 350 MiB**。冻结 asar 哈希正确。全部交互实例已先退出，没有性能期间并行 UI 测试。

随后脚本在最后 `fs.rm` 出现 `ENOTEMPTY`，整体退出码为 **1**；残留只有 `Network Persistent State`。独立确认 4 个被测 PID 均不存在，清除该假数据目录并卸载 DMG。保留 [原始日志](qa-final-evidence/package-idle.log)、[完整样本](qa-final-evidence/package-idle.json)、[清理说明](qa-final-evidence/package-idle-cleanup.json)。不重复已有效完成的性能采样，也不将整条脚本命令标为成功。建议等待自身子进程树退出，再用有界重试清理；只属于测试可靠性整改。

### G7：全屏自动抑制仍未通过

源码只有 shelf `setVisibleOnAllWorkspaces(true,{visibleOnFullScreen:false})`，控制器没有自动全屏检测/抑制。独立创建自身原生全屏靶窗并等待 `enter-full-screen` 后，模拟自身指针到顶部边缘，控制器 `shelfVisible` 与原生 `isVisible()` 仍为 true；手动托盘“暂停悬停”后两者隐藏。见 [input-fullscreen.json](qa-final-evidence/input-fullscreen.json) 及 [QA 探针](qa-thoughtline/qa-evidence/input-fullscreen-protocol.cjs)。

**没有建立 compositor 实际遮挡证据**；`isVisible()` 不证明绳架已覆盖另一 Space 的全屏画面。结论限定为自动抑制标准未满足。对普通桌面初次体验，可在进入全屏前手动暂停；它不阻止受限桌面体验，但阻止完整 G7 放行。264e168 的公开接口建议仅为文档，没有实现，不改变此状态。

## 通过 / 失败 / 未测

| 项目 | 结果 | 独立证据与范围 |
| --- | --- | --- |
| 固定 SHA、远端及生产一致性 | 通过 | GitHub API/ls-remote；264e168 与 f99cdea 生产 diff 为空 |
| Windows CI | 通过 | [37816503313](https://github.com/NocodeMrLi/thoughtline/actions/runs/37816503313)：准确 f99cdea，Node24.19.0，16 文件/58 测试、类型/构建、NSIS 上传；[元数据](qa-final-evidence/windows-ci-metadata.json)/[日志](qa-final-evidence/windows-ci.log) |
| 本地 58 单测、类型/构建 | 通过，有 Node25 限制 | [verify.log](qa-final-evidence/verify.log)，退出 0 |
| 源码 11 组 Electron 流程 | 已独立执行，分项判定 | workflow/group/motion/text-drag/fixed-rope/clothespin/clean-shelf/lazy-window/hidden-draft/settings-lifecycle/smoke；Q5 原多条图不接受，修正运行替代；后两组 registry 为模拟 |
| 隐藏及新建草稿生命周期 | 已测路径通过 | 实际 native hide/31.5秒、重开、磁盘不可写、退出恢复；物理 Hide 不在范围 |
| 临时分类、查找、历史入口 | DOM/IPC/native Menu callback 通过 | clean-shelf：常驻 nav 和替代图标行均不存在，临时查找/历史/过滤可用；未物理点击系统菜单 |
| 固定绳、容量及全文可达 | 通过 | path `M 140 22 Q 720 82 1300 22`，0/3/24 数据绳长1160/sag30不变；超过容量仍可查找全文 |
| 夹子几何及减少动态效果 | 通过 | 18×38视觉、24×44命中、双臂/银色弹簧、纸160×112、夹纸重叠4px、runtime reduced motion停止夹臂 |
| 输入防重 | 协议通过 | renderer isComposing/keyCode229未保存；连续3次合成提交→1条、revision+1；不是物理 IME |
| 文本拖出 | 隔离本地 receiver 通过 | 中文全文、取消稳定、不生成文件；不声明真实 Agent 接收 |
| 冻结 Mac 包 | 通过 | 自己只读挂载的实际 App；0.0.11、启动1个隐藏窗、取消正文/revision、编辑重启持久、新草稿不覆盖、设置按需 |
| 签名/来源字节 | 通过，范围限定 | codesign deep strict通过；ad-hoc；asar内main/preload/renderer HTML/CSS/JS与本地固定源码构建逐字一致；没有 Developer ID/公证声明 |
| 冻结包空闲性能 | 门槛通过；命令清理失败 | 120.187秒 CPU0.183048%/RSS266.734375MiB；原命令exit1，Q6 |
| 自动全屏抑制 | 未通过 | 已知实现缺口；物理画面遮挡未测，见 G7 |
| Windows 实机安装/交互 | 未测 | exe只复制/哈希，未执行；CI不替代Windows运行 |
| 物理热键/冲突矩阵、系统IME候选窗、焦点/点击穿透 | 未测 | 模拟键事件和native对象不能代替 |
| 物理 macOS Hide、真实多屏/DPI切换、休眠唤醒 | 未测 | 本轮DPR为强制renderer scale；不宣称完整系统矩阵 |
| 真实 Agent、用户审美确认、壁纸融合 | 未测/待用户体验 | 只用本地受控receiver和中性背景；不得以截图替代用户最终偏好 |
| Library 上传 | 当前不可用 | 父会话明确要求不重试/绕过；保留本地12图与SHA，无虚构Library ID |

本轮 settings-lifecycle 的上游 JSON `scope` 仍写 actual registry，但 QA wrapper 实际强制模拟；已在 [scope-corrections.json](qa-final-evidence/scope-corrections.json) 单独纠正，不能据原字段误报物理系统注册通过。额外全屏探针首轮有 QA pre-ready 使用 screen 的错误，修正适配器启动时序后通过，未计为产品缺陷。

## 12 图与整体观察

已逐一查看全部图。可见绳居中、弧度固定，5卡间距均匀且没有边缘截断；18px夹子与160px纸比例克制，双臂银簧可辨，纸顶被夹子重叠，纸面阴影与轻绳纹没有压过文字。深色边线比浅色显眼，但未发现失联、悬空间隙或明显比例失败。属于基于受控背景的 QA 观察，用户最终审美与真实桌面融合仍需本人体验。

| DPR/场景 | 浅背景 | 深背景 | 数据 / 实际可见 |
| --- | --- | --- | --- |
| 1×空 | [PNG](qa-final-evidence/screenshots/qa-clothespin-1x-light-0.png) | [PNG](qa-final-evidence/screenshots/qa-clothespin-1x-dark-0.png) | 0 / 0 |
| 1×少 | [PNG](qa-final-evidence/screenshots/qa-clothespin-1x-light-3.png) | [PNG](qa-final-evidence/screenshots/qa-clothespin-1x-dark-3.png) | 3 / 3 |
| 1×多 | [PNG](qa-final-evidence/screenshots/qa-clothespin-1x-light-24.png) | [PNG](qa-final-evidence/screenshots/qa-clothespin-1x-dark-24.png) | 24 / 5 |
| 2×空 | [PNG](qa-final-evidence/screenshots/qa-clothespin-2x-light-0.png) | [PNG](qa-final-evidence/screenshots/qa-clothespin-2x-dark-0.png) | 0 / 0 |
| 2×少 | [PNG](qa-final-evidence/screenshots/qa-clothespin-2x-light-3.png) | [PNG](qa-final-evidence/screenshots/qa-clothespin-2x-dark-3.png) | 3 / 3 |
| 2×多 | [PNG](qa-final-evidence/screenshots/qa-clothespin-2x-light-24.png) | [PNG](qa-final-evidence/screenshots/qa-clothespin-2x-dark-24.png) | 24 / 5 |

1×原图1440×340，2×原图2880×680。所有绝对路径、逐图SHA256、实际DPR/数量/容量和几何保存在 [screenshots-manifest.json](qa-final-evidence/screenshots-manifest.json)。未对图做编辑。

空场景仍有说明文字，不能将0.0.11截图描述为严格“空态只有一条绳”。父会话已要求空绳常驻提示补丁；构建者已告知将修正并产生后续候选。QA原生时段已释放，本报告不把后续源码/包继承标为已验收。

## 冻结包哈希

| 产物 | SHA256 |
| --- | --- |
| Mac DMG | `d32339a2338139de37d58067ef16bdc014d5e67ad17f3d7019009a0e164a72d7` |
| Mac app.asar | `f28fb0e46cc6c9d7e1eec0986acecc6144e86daddaebdc1f62fe7741eafcb700` |
| Windows exe | `12dcd2f66c2f40d00db20e0035dd7870ee6c72143535b6c0e2a4dea3e50cdcc0` |

DMG/exe为独立复制后实际计算，和交付声明一致；Mac运行由asar源码字节对照再绑定。Windows仅校验收到的文件，未借此声称安装或物理流程通过。详见 [package-source-bytes.json](qa-final-evidence/package-source-bytes.json)。

待办包括完整原生系统矩阵、自动全屏实现、空态提示补丁及Q6测试清理整改；没有使用旧假阳性证据放行，也没有把测试证据错误误报为产品失败。任何后续生产候选需按准确提交/新包重新绑定受影响验证。
