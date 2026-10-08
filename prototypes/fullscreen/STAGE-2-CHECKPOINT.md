# G7 第二阶段检查点（暂停）

用户对夹子实际视觉验收提出不通过意见，优先修复。G7 扩展暂停，稳定 0.0.13/隔离入口不变，实验未集成。

新增串行探测适配器，5项真实子进程检查通过：TTL、目标切换、并发合并、超时/坏响应/退出恢复。提议策略5项检查使用当前真实 shelf reducer：独立理由、完整新dwell、抑制auto-peek、文本拖拽结束再隐藏、暂停时锁释放。策略仅实验，unknown保留普通悬停仍需用户决定。

实际Mac自有窗矩阵6项通过：普通clear、最大化clear、同一前台应用两个窗口unknown、无边框请求被OS约束至菜单栏下clear、simpleFullscreen blocked、退出clear；无效屏unknown和切屏缓存失效。当前只有1物理屏、已有采集权限true，不证明未授权或物理多屏/Windows。6个自有PID全部退出、假目录删除。未操作用户安装版或原项目进程。

首轮无边框期待blocked错误保留attempt-1：窗口被OS约束，没有复现实际误抑制。几何全覆盖不等于语义全屏，风险仍成立但不夸大成真机已复现。

在旧reducer发现暂停时lock事件被直接忽略的潜在锁残留，准备的原生回归脚本因未构建out而未成功启动；尚未证明为实际产品问题，不先修代码。缺失前置日志保留。一次误用verify --help执行了verify，65旧单测通过但两个node:test原型被Vitest收集报No test suite；新文件改名.checks.cjs隔离runner，不把整体失败说成通过。

Agent安装元数据已核对，未打开任何会话。尚无确认的安全第三方目标，未发送/生成；自有跨进程文本接收实验未开始。

复验新增检查：node --test prototypes/fullscreen/{probe-session,shelf-policy}.checks.cjs。矩阵node prototypes/fullscreen/mac-matrix.cjs，须先协调时段。证据位于evidence/，机器状态stage-2-checkpoint.json。
