# 紧凑 Composer：独立只读 QA

已审固定源码、原件与六张实际Mac裁切图/两张Windows样式模拟图。当前尺寸中，固定正文、常显名称/项目、Agent描边和底部同一行符合本阶段方向；**未发现阻挡先看效果的新 P1/P2 产品问题**。这是只读观察。父会话最新转用户反馈：整体简化认可，但底部名称/项目/Agent间距过大，加提交显零散；三个框并排又显堆砌，要求研究其他产品后提方案。当前视觉记为待改进、未验收；真实vibrancy/Acrylic、新包及整体正式验收均未通过。

固定源 `ebd585ae5e3d4c5d505fe52b03c203517cc8f88f`，证据 `8a27ead234020589242ff6794f2348e539113632`，版本 `0.0.16-preview.3`。准确远端对象已取；12项源码SHA、41项原证据索引全部匹配，构建者5项当前编译文件只读SHA也匹配，src/tests/scripts/package/.github从源到证据diff空。没有独立重建/运行，无生产或系统设置修改。见 [绑定核对](readonly-binding-check.json)、[原报告](COMPACT-COMPOSER-PREVIEW-original.md)、[源码差异](source.diff)。

## 实际图与布局

| 图 | 独立观察 |
|---|---|
| [通用默认](evidence/default-light-native-desktop.png) | 480×316 DIP，正文132，名称/项目常显，Agent中性描边，提交禁用；当前没有可见裁切 |
| [Codex短文](evidence/codex-short-light-native-desktop.png) | 蓝描边清晰，正文保持中性色；Agent、⌘Enter和提交同排 |
| [浅色长文](evidence/codex-long-scroll-light-native-desktop.png)/[深色长文](evidence/codex-long-scroll-dark-native-desktop.png) | 长文已滚至末尾；顶部残行属于滚动视口内容，窗和正文不增高，两字段与提交保持可见 |
| [Claude浅色](evidence/claude-short-light-native-desktop.png)/[深色](evidence/claude-short-dark-native-desktop.png) | 暖赭描边与蓝边有可辨区别，标题/正文没有Agent染色 |
| [Windows浅色](evidence/windows-style-simulation-light.png)/[深色](evidence/windows-style-simulation-dark.png) | **仅Mac renderer切Windows CSS的opaque样式模拟**；图中仍显示Mac的⌘Enter（只改CSS，不改React info.platform）；真实Windows的CtrlEnter文案/键盘/材质没有实测，不能当Windows执行证据 |

六张native-desktop PNG960×632是系统compositor裁切自有480×316窗口；下面仅自有测试背景，非另造玻璃图、未拍用户无关窗口。八个场景的实际renderer viewport均480×316，textarea均132；长文scrollHeight812、clientHeight129、scrollTop683。每个记录的两字段和完整72×32提交按钮均在视口内，按钮位于footer的y268..300，快捷键和按钮同排。没有折叠details，也没有输入窗查找按钮。

fixture原生getBounds在场景前读取一次，后续逐场景记录renderer viewport；`shortLongNativeBoundsUnchanged`不是逐场景重新调用getBounds的结果。固定创建/显示常量、逐场景viewport与六张完整窗口边界支持当前不增高观察；后续完整设备矩阵宜逐场景记录nativeBounds，不把该flag扩大成多屏/缩放证明。低工作区媒体规则会改用固定110DIP正文；当前八图没有覆盖该分支。

旧 [before-footer-fix结果](evidence/before-footer-fix/preview-result.json) 保留真实布局问题：footer268..300，按钮276..308，底部越出footer **8DIP**。它不是窗口整体被裁掉或数据错误，而是原快捷键/按钮纵排遗留。当前新增`.composer .composer-submit`明确row，八个记录均按钮y268/bottom300；本人也逐矩形核全框在footer内。没有把旧图算当前同排通过。

## 材质边界

八个场景全部记录 `opaque`；实际nativeTheme `reducedTransparency=true`、`highContrast=true`、forcedColors=false，nativeVibrancy=false。图中的层次不等于已观察到桌面模糊玻璃效果，**透明许可环境下的vibrancy仍未验**。没有为拍图改OS偏好；capturePermission记录granted也不等于新申请过权限。

源码通过系统偏好决定材质：Mac使用popover/followWindow；Windows build≥22621且有焦点才选acrylic，其余/失焦/辅助偏好选opaque。theme/focus/blur更新原生材料与背景，关闭移除nativeTheme监听；CSS没有backdrop-filter伪造原生模糊。当前依赖Electron44.7.0的本地d.ts包含这些接口，package-lock仅版本变化。官方[Electron窗口文档](https://www.electronjs.org/docs/latest/api/base-window#winsetbackgroundmaterialmaterial-windows)确认vibrancy和Windows背景材料接口，后者仅支持Windows11 22H2起；[nativeTheme文档](https://www.electronjs.org/docs/latest/api/native-theme#nativethemeprefersreducedtransparency-readonly)说明降低透明度/高对比偏好。这支持接口设计，**不证明真实效果或失焦/动态偏好切换已实机通过**。代码未使用NSGlassEffectView，不包装成原生Liquid Glass。

Windows predicate单测覆盖旧build、失焦和三类辅助偏好；Mac图只能证明当前opaque回退。Win旧版本原生API回退、允许透明度后的vibrancy观感、真实Acrylic及焦点变化仍需独立环境证据，不改本机系统设置来填补。

## 可达性与安全证据

源码只改Composer及其材质/信息字段，绳/纸/夹子未新增常驻工具条。名称、项目使用具名input和sr-only label；Agent仍从全部snapshot agents生成option，保留自定义Agent和编辑拆夹确认。旧shelf临时上下文菜单的查找项仍在，不将“查找回托盘”解读为移除已有临时菜单。

当前受影响安全fixture拦截真实Tray.setContextMenu并调用保留的实际MenuItem：**先X保存关闭→等待主进程解锁→菜单查找→manage browse→关闭→重开恢复草稿**。输入窗仍显示时原菜单查找禁用；这不是“菜单回调自动替当前输入保存关闭”的测试，也不是物理鼠标点击菜单。入口保留且没有绳上新工具条；见 [安全脚本](source/tests/electron/draft-safety-workflow.cjs) 和 [当前安全结果](evidence/safety-native.json)。

草稿队列/session/sequence、同步inFlight、组合暂停和退出捕获来自恢复功能，此版实际重跑了受影响安全与SIGKILL检查，未只继承旧绿。绿日志仍有2.4s合成组合负向等待及revision/draft/nativevisible/locked检查，随后正向checkpoint；失败保文重试、同批三点击一条、同会话迟到拒绝、编辑取消snapshot/revision不变、dirty正常退出重启也在当前结果。当前 [SIGKILL结果](evidence/crash-recovery.json) 四字段/custom Agent完整恢复已完成检查点。

审阅构建者 [96单测/22文件](evidence/unit.log)、type/build、preview+safety+crash三专项exit0绑定及27个记录PID退出/假数据删除。本人没有运行这些命令、没有独立查27PID，也没有占用原生时段。单慢IO仍只有scheduler单元，不是原生磁盘注入；已有便签组内Agent迁移/拆夹确认的紧凑错误区滚动可达性、完整键盘/屏幕阅读器、物理IME/系统菜单/焦点/穿透/多屏缩放仍未覆盖。

**本次通过只读项：** 精确绑定/原件SHA、实际八图、八场景矩形/滚动记录、接口和恢复证据范围审阅。**保留问题：** 旧footer8DIP越界的历史图/几何，当前已修；无新增复现产品失败。**未测/不放行：** 用户视觉改进与最终认可、透明许可环境原生vibrancy、真实Windows/Acrylic及回退、新冻结包/性能、物理IME/Agent/G7、断电、最后未ack输入、未提交编辑异常恢复。formalAcceptance=false。

旧530×520仍是用户视觉拒绝，本紧凑候选整体简化获肯定，但底部间距/排列仍待改进；最新反馈不是视觉通过，不改当前源码或原图，方案研究由父会话协调。0.0.15原包与独立有限功能结论不变。全部原件/源码/报告SHA见 [evidence-sha256.json](evidence-sha256.json)。
