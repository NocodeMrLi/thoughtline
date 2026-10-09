# 0.0.15 当前候选证据

此目录覆盖用户暂定认可的70%居中淡端绳、连续弯纸、正向夹持与蓝/暖赭 Agent 标签基线。样式不再主动重设计。

两个确认的位置P2分别修复：capture 投影后显示身份/中心不固定；满容量 move 到最后可见位置被 overflow 抢位（后者也存在于更早基线，不称新引入）。旧红记录见 `../centered-rope-independent-readonly/` 原98文件及后续独立修复审阅。单元红绿见 `projection-fix/`，真实源 main IPC 回归见 `source-regression/projection-native.json`。

首轮新增协议fixture缺少必须的通用Agent导致启动恢复对话框；另一次过度把所有持久比例视为无碰撞的直接DOM位置且未等info消息。修正fixture后重跑。`workflow-exact-float-assertion.log` 是 226.000015DIP vs226 的过严浮点断言；采用0.01DIP容差保留真实尺寸检查。这三条失败日志原样保留，不声称产品故障或整体绿。

SOURCE和PACKAGE均采用自有假数据；不读取正式便签，不触发物理全局按键，协议测试使用模拟快捷键和剪贴板。实际Electron窗口/DOM/IPC和Menu回调不替代物理IME/穿透/跨App焦点或Windows真机。宽度/缩放矩阵是屏幕适配器+Chromium仿真，不是物理多屏。

冻结SHA、完整退出码/哈希、Mac签名、Windows构建/安装包及性能、独立增量与入口见最终 `../../CANDIDATE-0.0.15-REPORT.md`。正式总体验收仍未放行，G7自动全屏和设备矩阵独立保留。
