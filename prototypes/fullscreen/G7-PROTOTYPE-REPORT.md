# G7 公开接口原型交回报告

2026-10-09，北京时间。隔离工作树 `/Users/lihongwei/Documents/Codex/2026-10-09/task/thoughtline-g7`，分支 `codex/thoughtline-g7-public-probe-20261009`。原型代码固定 `754a58f9b79d8a9c4eed47a60978052402f22450`；Mac 测试固定 `044450c`，两提交的原型原生源码与测试完全一致，仅 Windows workflow 有修正。

稳定 0.0.13 源码 `dee1f2c`、Mac/Windows 安装器未改变。原型未导入 `src`、未打包进应用、未改变未知状态的普通悬停策略。**G7 产品集成和正式验收仍未通过。**

已交付 Mac Objective-C++ 公开窗口几何探测、Windows SHQueryUserNotificationState + DWM/指针显示器探测、持久 stdin/JSON helper、CMake、19 项共享决策检查、实际自有 Mac 全屏靶窗测试和分支专用 Windows CI。没有新账号/付费/权限、没有 CGS/SkyLight/AX/画面抓取，没有读取窗口标题或用户便签。

Mac 自有靶窗实际原生 fullscreen event/isFullScreen：普通 clear→全屏 blocked→退出 clear；无效显示器 unknown；命令 exit0，自己的靶窗/helper/假数据清理完成。单个 helper 4Hz/20.003秒，CPU 0.449933%，RSS最大5.109375 MiB，稳定查询中位延迟3.28179ms/最大4.66067ms；首次冷查询83.1967ms。不是整个应用120秒性能门禁。

**关键限制：本机 CGPreflightScreenCaptureAccess=true。** 没申请权限，但无法证明未授权环境可用；不得称无权限Mac通过。只有自己的靶窗/单屏通过，不代表其他应用、Space遮挡、多屏或几何误抑制已解决。几何覆盖也不等同语义全屏。

Windows [CI37826257911](https://github.com/NocodeMrLi/thoughtline/actions/runs/37826257911) 准确754a58f编译及19项决策检查成功。runner查询返回 clear、QUIET_TIME(6)、perMonitorV2=true，仅证明公开接口可调用。实际Windows游戏/演示、多屏/混合缩放未测。已下载原型exe且匹配CI SHA `fd98948eaf34d1828b69f843172e6e7ea4b649075ac62d874ea505173ee70ae7`，未在Mac执行。

保留首轮失败：Mac SDK sysroot未指定、Rect命名冲突、无效显示器测试，以及 Windows CI37825948581的证据目录缺失（编译/19检查本已通过，整条CI失败）。修复后有明确复验，不将失败命令改成成功。

复验：Mac `node prototypes/fullscreen/build-mac.cjs` 后运行 `mac-workflow.cjs`，必须先协调原生时段；Windows按README的CMake/ctest命令。具体状态、源码/二进制哈希和证据见 `prototypes/fullscreen/evidence/prototype-status.json`、`mac-native.json`、`windows-ci.json`。

下一步依赖现有未授权Mac与物理Windows环境，不擅自修改用户安全设置。生产接入前还需要超时/过期/目标屏缓存、独立暂停原因、恢复dwell、自动peek、拖出取消与草稿保护，及含helper新包的独立受影响复验。当前交回有限支持原型和限制，稳定候选继续用手动暂停处理全屏。
