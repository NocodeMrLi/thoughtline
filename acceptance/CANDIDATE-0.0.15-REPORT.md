# 0.0.15 可复验候选交付

本轮形成固定 **0.0.15 /61a6837dbde290041a13226596baad5b21249fc1** 候选，修复两个影响夹子位置/显示身份的 P2，并完成当前源码、冻结包与独立受影响增量复验。用户已暂定认可居中淡端绳/连续纸/正向夹持/可辨 Agent 字色基线。**整体正式验收仍未放行**；物理设备和 G7 等缺口见下文。

## 固定产物与启动

| 项目 | 固定值 |
|---|---|
| 私有开发分支 | `codex/thoughtline-clamp-20261009`，未合入 main、未创建发布 |
| 生产源提交 | `61a6837dbde290041a13226596baad5b21249fc1`，后续归档提交不改变其生产源码 |
| Mac 文件 | 本机 `dist/Thoughtline-0.0.15-mac-arm64.dmg` |
| Mac DMG SHA256 | `84deaaf72355af6b8c7f159a1e5fa752980d09182a07022bdd22f013b3766f90` |
| 包内 asar SHA256 | `3beefbd46cec2732d0ae1449faee43eee89b035499e8ee1967d07c3c4104ee59` |
| Windows 文件 | 本机 `dist/windows-61a6837/Thoughtline-0.0.15-win-x64.exe`，111267797 字节 |
| Windows SHA256 | `7d72b841c8136de21354e6ad6dd32eb6486adff9a1e77ec973d1ab14f8d6f918` |

Mac 严格签名检查实际 exit0，属于 ad-hoc，没有 Developer ID/公证声明。Windows 为未签名私有测试安装器。[Mac 五输出与 asar 字节绑定](evidence/candidate-0.0.15/package-source-bytes.json)、[Windows receipt](evidence/candidate-0.0.15/windows-ci/receipt.json)；独立 QA 自己构建的五输出也与实际包逐字节一致。QA 构建宿主 Node25.8.1 超出项目声明，不把它说成 Node24 全量单测；构建者和 Windows CI 的88单测均用 Node24.19。

请使用本机双击入口 `/Users/lihongwei/Documents/Codex/2026-10-09/task/delivery/启动0.0.15隔离体验.command`。它校验固定 DMG/asar/版本/签名，只读挂载，以正常系统 `open -n -W --env` 明确隔离 userData；测试数据保留，便于下次重开。不会安装替换、读取正式便签、强制卸载或终止其他进程。[完整操作说明](../docs/delivery/README-0.0.15-隔离体验.md)。入口 `--check-only` 与独立假目录 LaunchServices 证明通过；默认用户体验入口尚未实际启动，不将带临时 inspector 的假目录验证扩大成物理默认体验已验收。0.0.13 入口保留为回退；已发布下载仍是 v0.0.6-alpha.1，不能据其旧安装版检查本轮功能。

## 改动与验证

绳保持约70%屏宽居中、固定弧度、自然上扬渐淡端；夹子布局使用同一有效坐标域，中心处于绳中央约2/3。160×226纸、正向夹持和蓝/暖赭 Agent 标签沿用用户暂定基线，未继续主动改视觉。默认 null 比例在1040/1440/1920宽分别显示3/4/5夹；显式旧比例/紧密位置可能不同，不把这些默认数当硬容量。

两个 P2 的原红证据保持原样：capture 保存显示比例后重新投影可能换可见身份、推动无关夹172DIP；满容量夹移到最后可见位置却被隐藏夹抢位（后者更早基线也存在）。当前 capture 为固定点，显式移动保持旧可见集合优先于溢出，筛选时其他 Agent 字段/相对顺序和所有正文保全。修复源 `d290189` 与本候选src一致。[独立纯源红绿报告](evidence/capture-stability-independent-readonly/READONLY-REVIEW.md)：3000混合capture零失败；122边界/过滤/真实6参链断言；150×40约束链3146move、6000capture，移动夹隐藏零；另2000混合过滤压力通过。压力分布不是产品发生率。

- 当前规范单测：**20文件88项通过**，类型检查/构建通过。旧日志误发现历史归档测试形成90项，原日志保留，当前只计规范88项。[源码冻结绑定](evidence/candidate-0.0.15/source-freeze.json)。
- 当前源码 **11项 Electron 流程整体 exit0**：投影/满容量/混合、编辑取消/管理检索/全文复制/重启、组移动合并拆分撤销分页及自然解锁后无关中心、纯文本拖出取消、空态/设置/实际托盘回调、暂停释放锁、有限动画/低动态、真实窗口hide及隐藏草稿、18幅绳场景、8幅宽度缩放适配、纸/夹/完整32按钮轮廓与实际IPC命中。[全部退出码与日志](evidence/candidate-0.0.15/source-regression-status.json)。宽度/缩放是受控屏幕适配和Chromium仿真，不是物理多屏矩阵。
- 冻结 Mac 包专项 **exit0**：延迟窗口、编辑取消/保存恢复、草稿不覆盖、设置恢复。[包结果](evidence/candidate-0.0.15/package-regression/overnight-package-acceptance.json)。
- 冻结 Mac 无调试器空闲 **120.149秒，稳定4进程，单核CPU0.1997519746%、RSS max305.015625MiB**；CPU≤2%/RSS≤350MiB均通过，命令exit0，有界清理完成。[原采样](evidence/candidate-0.0.15/package-regression/overnight-package-idle.json)。独立QA未重复性能测量，不能称独立性能通过。
- [Windows CI37873271157](https://github.com/NocodeMrLi/thoughtline/actions/runs/37873271157)：准确61a6837、Node24.19、20文件88单测、类型、构建、NSIS/hash/upload成功。下载安装器与CI哈希一致，独立QA再次流式核哈希一致，**没有执行 Windows 安装器**。
- **独立冻结包受影响增量四场景整体exit0**：设置/暂停/正文草稿、满8移动右界显示身份/合并无关中心/拆分撤销/全文/全8浏览/重启、混合隐藏源合并/重启、旧8比例加载/重启。7次纸夹观察、10完整32px按钮，在实际SVG采样轮廓及已发布IPC矩形内。42自有PID全部退出、假数据清理、只读DMG卸载。[完整独立报告](evidence/candidate-0.0.15/independent-qa/INCREMENTAL-QA-REPORT.md)、[原37项自索引](evidence/candidate-0.0.15/independent-qa/evidence-sha256.json)。有限原生链不扩大为全部旧压力重跑；两个原JSON字段命名边界保持原文，报告/field-audit明确解释。

测试快捷键/剪贴板/指针采样使用自有适配；实际窗口、可信DOM/IPC和 MenuItem 回调有证据，不等于物理按键、鼠标穿透、跨App焦点或真实Agent接收。原失败记录保留：无通用Agent的非法fixture、过早/过度直接比例假设、过严浮点比较，以及独立QA首轮错误取消选择器exit1。各自纠正后完整重跑；未将失败命令整体标绿。[证据说明](evidence/candidate-0.0.15/README.md)。

## 用户验收方法及剩余边界

1. 双击新.15隔离入口，确认空绳没有常驻工具条/虚构便签；用托盘“写念头”或设定快捷键打开输入。先写独立测试内容，勿复制正式隐私便签。
2. 输入中文、换行、前后空格和emoji；选Agent/可选名称项目，挂上后复制全文核对。关闭未提交输入再打开，检查草稿；新建/编辑取消行为应分清。
3. 增加超过可见容量的假便签，移动末可见夹至右界、合并、分页、拆分及撤销；用临时管理窗口检索全部记录。关闭退出后用同一入口重开，核对全文、分组、位置、设置与草稿。
4. 打开设置保存后关闭，托盘写念头应重新可用；暂停时关闭输入/管理或取消拖动，应隐藏绳并释放操作锁。
5. 记录实际系统/工作区/缩放、操作步骤、截图和期待；出现物理IME/穿透/焦点/全屏问题不能以协议绿替代。

待完成：物理Windows和macOS系统IME/全局热键/系统Hide/跨应用焦点/穿透、真实Agent纯文本接收、混合缩放/多屏/休眠完整矩阵；**G7自动全屏抑制仍有实现/权限约束**，独立原型未集成本包。不把手动暂停可隐藏或isVisible值推成compositor全屏通过。签名/正式发布不在本授权内。

当前草稿只保证显式关闭和正常退出的保存；未持久化输入的异常终止恢复尚未实现。新轻量输入窗已经在独立 `thoughtline-composer` 工作树做成0.0.16-preview.1（固定6638ce1/证据566cce0），实际Mac预览和基础专项已交用户等方向反馈；**其改动不在本.15包，也不继承本轮包验收**。异常恢复将在另一小功能阶段复现和实现。

机器状态：[gates.json](gates.json)。本轮产物可独立复验，`formalAcceptance=false`；未推main、合并或发布。
