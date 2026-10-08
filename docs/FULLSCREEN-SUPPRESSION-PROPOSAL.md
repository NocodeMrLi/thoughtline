# 全屏悬停抑制：静态实现建议

2026-10-09，北京时间。仅调查和设计，未修改冻结生产代码，未调用桌面探测接口，未启动原生测试。

## 原计划和当前缺口

原始 03 项目方案要求进入全屏演示、游戏或锁屏时抑制普通悬停；04 的 G7（第 280–291 行）明确要求双端系统适配与实际矩阵，并排除直接复制私有 CGS。10 的剩余计划限定公开接口可用范围。托盘手动暂停是补充入口，不能标成自动全屏检测通过。

冻结 f99cdea 的 EdgeController.poll 只有顶边/指针/显示器检测，没有前台窗口或全屏状态。Mac createShelf 已设置 visibleOnFullScreen:false；该设置是原生全屏 Space 的窗口策略，不是跨平台全屏识别。showInactive 与 focusable:false 降低抢焦点风险，不能保证覆盖层不遮挡内容。

## 公开接口核实

Electron BrowserWindow.isFullScreen、enter-full-screen 都针对自身 BrowserWindow；不能把它们接到全屏暂停后宣称已检测其他应用。官方 [BrowserWindow 文档](https://www.electronjs.org/docs/latest/api/browser-window)。不把 desktopCapturer 当检测器：它用于桌面媒体源，屏幕内容采集在 Mac 需要同意，且没有保证返回其他应用全屏状态；本轮不引入屏幕采集或新权限。官方 [desktopCapturer 文档](https://www.electronjs.org/docs/latest/api/desktop-capturer)。

Windows 的 [SHQueryUserNotificationState](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shqueryusernotificationstate) 是受支持公共 API。官方状态包括 QUNS_BUSY、QUNS_RUNNING_D3D_FULL_SCREEN、QUNS_PRESENTATION_MODE，以及用户不在场；它不提供逐屏归属，且全屏开始/结束不发送此接口的状态通知，仍需有限轮询。[状态定义](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/ne-shellapi-query_user_notification_state)。这些信号可用来保守抑制全局普通悬停，不能保证覆盖所有无边框游戏或每个显示器。

Windows 可辅以 GetForegroundWindow、前台窗口可见性、MonitorFromWindow/GetMonitorInfo，以及 DwmGetWindowAttribute(DWMWA_EXTENDED_FRAME_BOUNDS) 的可见边界，判断前台窗口是否覆盖目标显示器。GetWindowRect 会受 DPI 虚拟化影响，DWM 可见边界又不自动调整 DPI，必须在原生适配层统一坐标；禁止直接比较物理像素和 Electron DIP。[GetWindowRect](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowrect)、[DWM 属性](https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute)。覆盖屏幕只是保守几何判定，最大化/自动隐藏任务栏可能导致误抑制，不能称为准确的语义全屏识别。

Mac 可研究 NSWorkspace.frontmostApplication + CGWindowListCopyWindowInfo 的前台 PID 与窗口几何，避免读取窗口标题或像素；它们不直接提供“当前目标屏幕是全屏 Space”的保证。跨屏、窗口缺失、权限限制或系统转场都需记录 unknown。此路线尚未做无权限运行证实，不能在当前候选里宣称可用。公开入口：[NSWorkspace](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication)、[CGWindowListCopyWindowInfo](https://developer.apple.com/documentation/coregraphics/cgwindowlistcopywindowinfo(_:_:))。不使用 CGS/SkyLight，也不申请 AX/屏幕录制权限作为本轮捷径。

## 建议的实现边界

先做 Windows 公共 API 适配器，加 Mac 已有全屏 Space 隔离，明确其余场景有限支持。无需新常驻工具条。把检测器输出分成 clear / blocked / unknown，包含目标屏幕、时间戳和原因；应用不保存其他应用的标题、正文或截图。

使用小型可打包的原生辅助程序或 N-API 模块，随支持架构一起构建；不能在 16ms 指针循环里不断启动 PowerShell/AppleScript。低频缓存，例如后台 500–1000ms 查询，鼠标接近顶边时异步刷新，并在即将自动呼出前要求本轮新鲜结果。单实例串行探测，有短超时；助手崩溃、解析失败、过期或目标屏改变均返回 unknown。该策略缩小竞态，但不能消除查询后立即切换全屏的窗口。

新加独立的环境抑制理由，不能复用或覆盖 manual/sleep/lock。blocked 立即取消悬停计时并隐藏展示；恢复要重新停留，不能沿用全屏前的 dwell。写作/编辑草稿不因此销毁；正在正文拖出时的撤销、锁释放与草稿保全须独立覆盖。

推荐保守策略：blocked 与 unknown 不自动呼出，显式写作快捷键继续可用；提交后的自动 peek 也应经同一策略，否则保存会绕过防遮挡。若需要主动查看挂绳，可用临时托盘入口明确显示，不抢下层焦点。unknown 默认保守会在探测器缺失时禁用普通悬停，应在交付说明中明确，并保持显式取用入口可达；这是待父会话决策的行为变化，本轮不静默替换现有默认值。仅有手动暂停或 Mac Space 隔离的版本仍保持 G7 未验收。

## 最小验证要求

共享逻辑验证 clear/blocked/unknown、过期、目标屏切换、独立暂停理由、恢复重新 dwell、自动 peek、草稿不丢及锁释放。助手用结构化假结果覆盖错误分支，适配器的 Windows 构建必须在准确 SHA 的 Windows CI 成功。

Windows 真机检查普通最大化、自动隐藏任务栏、F11 浏览器、PowerPoint 演示、独占与无边框游戏、多屏/混合缩放；Mac 检查原生全屏 Space、桌面演示/无边框窗口、多屏/分屏、睡眠锁屏恢复。逐项记录支持/误抑制/未测，不合并成“跨平台全屏通过”。冻结新包后重新独立测后台 CPU/RSS，避免探测助手引入常驻负担。

## 当前结论

这是可实施的有限支持方案；Windows 公共系统信号可先落地，Mac 非原生全屏的无权限几何探测仍需原型证据。当前先处理 QA 的截图脚本与证据修正，生产源码继续冻结。QA 释放原生时段并确定优先级后再统一安排生产补丁和新冻结包。
