# 全屏悬停抑制：公开接口原型与接入边界

2026-10-09，北京时间。G7 原始目标仍是普通悬停在全屏游戏/演示时受到抑制；Mac Space 窗口策略和托盘手动暂停不能替代自动检测验收。稳定 0.0.13 dee1f2c 没有自动检测；本原型仅位于隔离分支 `codex/thoughtline-g7-public-probe-20261009` 的 `prototypes/fullscreen/`，未打入应用安装包。

## 已实现的公开信号

小型原生进程阻塞等待 stdin，请求一行 sample 返回一行 clear / blocked / unknown。没有每帧创建 PowerShell/AppleScript，不读取窗口标题/像素/用户便签，不申请 AX/屏幕录制权限，不使用 CGS/SkyLight。源码、CMake、19 项共享决策检查、隔离 Mac 全屏测试及 Windows 分支 CI 均可独立复验。

Windows [SHQueryUserNotificationState](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/nf-shellapi-shqueryusernotificationstate) 的公开 NOT_PRESENT/BUSY/D3D_FULLSCREEN/PRESENTATION 状态先阻止全局打扰；[QUIET_TIME 与 APP](https://learn.microsoft.com/en-us/windows/win32/api/shellapi/ne-shellapi-query_user_notification_state) 本身不当成全屏。查询失败/无效 enum 返回 unknown。具备本进程 per-monitor-v2 DPI 上下文后，GetForegroundWindow 与 [DWM extended frame bounds](https://learn.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute) 同指针显示器物理边界比较。Win10 公共接口，目标 HWND 不在该显示器、无前台窗口或无法取边界返回 unknown。全屏大小只是覆盖几何：自动隐藏任务栏的最大化等可能误抑制；公开通知状态又不是逐显示器信号。Windows runner 能证明构建和接口调用，不是物理游戏/演示验收。

Mac [NSWorkspace.frontmostApplication](https://developer.apple.com/documentation/appkit/nsworkspace/frontmostapplication) + [CGWindowListCopyWindowInfo](https://developer.apple.com/documentation/coregraphics/cgwindowlistcopywindowinfo(_:_:)) 匹配前台 PID、layer0 与目标显示器几何。活动显示器用公开 CGGetActiveDisplayList 验证。单一前台窗口覆盖目标返回 blocked，部分覆盖返回 clear；多窗口、无交集、元数据或显示器缺失返回 unknown。坐标都来自 CoreGraphics，不混用 Electron DIP。几何不是全屏 Space 的语义保证，也未解决桌面/Finder、多窗口、背景全屏和跨屏归属。

## 本机证据与不可推断事项

自己的隔离 Electron 靶窗实际进入原生全屏（enter-full-screen + isFullScreen=true）并退出，探测 clear→blocked→clear；无效显示器返回 unknown。未用其他用户应用或便签。20 秒 helper 单进程 4Hz 的 CPU/RSS 和延迟见 `prototypes/fullscreen/evidence/mac-native.json`，这是 helper 局部采样，不是带检测器应用包的 120 秒性能门禁。

**本机屏幕采集 preflight 已授权 true**。本轮没有调用 Request 接口或修改权限，但不能据此证明未授权 Mac 可用；需要已有的未授权环境复验，不能通过撤销用户权限、申请新授权或使用私有 API补结论。自有靶窗结果也不证明实际覆盖层 compositor、其他应用/全屏 Space 或双端矩阵。

## 生产接入前的要求

不把未知结果默认改成全局普通悬停禁用。先证明正常桌面可达、已知全屏可抑制和恢复可用，明确各环境的未知范围；显式写作/查看入口保持可达。稳定候选的默认行为未改变。

未来接入需串行低频缓存、短超时/过期保护、目标显示器切换使缓存失效、blocked 独立于 manual/sleep/lock；隐藏展示时取消 dwell，恢复重新停留。提交后自动 peek 也受策略约束。草稿不能因环境抑制销毁，拖出取消与锁释放需复验。助手错误/崩溃仍应有明确 unknown 与入口策略，不能静默给用户一个无法呼出的挂绳。

仍需真实 Windows F11/PowerPoint/独占及无边框游戏、多屏混合缩放；Mac 未授权环境、原生全屏 Space/桌面演示/分屏/多窗；睡眠锁屏恢复与带 helper 的冻结包独立 CPU/RSS。当前原型交回明确限制，**G7 未实现产品集成、未验收**。保留手动暂停和当前 Space 策略，稳定 0.0.13 可供其他流程复验。
