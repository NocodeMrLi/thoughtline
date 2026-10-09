# 0.0.15 冻结包独立增量 QA

本次准确冻结包的受影响增量通过，修正后的完整原生命令 **exit0**，4 个场景完成；未发现本轮范围内的新产品失败。首轮脚本选择器错误 exit1 单独保留。42 个可观测自有 PID 全部不存在，临时假数据已删除，只读 DMG 已卸载，原生时段已释放。

这是有限增量结论，**整体正式验收仍未通过**。不继承 0.0.13、旧 0.0.14 的通过，也不将 CI、截图或受控协议推成物理设备验收。新的轻量 Composer 预览属于另一个工作树和阶段，本报告只对应原冻结 0.0.15。

## 固定版本与产物

| 项目 | 独立核验 |
|---|---|
| 生产源码/测试/包配置 | `61a6837dbde290041a13226596baad5b21249fc1`，已从私有远端获取准确对象；自己的副本 105 个输入文件收尾 SHA 全相同 |
| 版本 | 实际 App、Info.plist、运行时均为 `0.0.15` |
| Mac DMG SHA256 | `84deaaf72355af6b8c7f159a1e5fa752980d09182a07022bdd22f013b3766f90` |
| 包内 asar SHA256 | `3beefbd46cec2732d0ae1449faee43eee89b035499e8ee1967d07c3c4104ee59` |
| 签名 | 实际 `codesign --verify --deep --strict` exit0；ad-hoc，无 Developer ID 或公证声明 |
| 源码到包 | 独立隔离副本构建 exit0，main/preload/renderer HTML/CSS/JS 五输出与实际 asar 逐字节一致 |

独立构建宿主是 Node `25.8.1`，高于项目声明的 `>=24.19 <25`。本次确认输出等价；没有宣称自己使用 Node24 重跑全部单测。Windows 的 Node24.19 单测证据另列。详见 [包与源码字节绑定](package-source-bytes.json)、[源输入及清理复核](readonly-final-check.json)、[签名结果](codesign-verification.json) 和 [构建日志](build.log)。原隔离源码/预检见 [固定源码绑定](../qa-0.0.15-preflight/source-binding.json)。

## 实际执行项

运行自己的只读挂载 App，使用每场景独立临时假数据。代码核实运行时 userData 正确，未访问用户安装版或真实便签。原 App 启动注册的是假数据中罕用的 F18 组合键，未按真实全局热键；系统剪贴板读写均被自有进程内存适配替代。

| 场景 | 通过事实与边界 |
|---|---|
| 空绳、设置、暂停、数据 | 初始只有 shelf；空态和 Claude 空筛选均为零便签/零命中元素，已有 General 便签保全。调用实际 Tray MenuItem 的设置回调，实际 UI 保存“减少动态效果”→关闭→托盘回调新建。暂停中关闭 Composer/Manage、提交、夹子锁取消、文本拖出取消均释放锁，原生 shelf 隐藏。新建草稿、空格/换行/emoji 全文、编辑取消和设置退出重启恢复均精确相等。 |
| 满容量与溢出 | 本机 1440 DIP、DPR2，8 条假便签；最后可见夹移动到右界后原可见身份保留。合并时无关中心保持，正文和所有记录保持；全文复制进内存适配器逐字相等；拆分→撤销恢复 clips。管理“挂着”列表找到全部 8 条。实际磁盘 snapshot 与退出前记录相等；重启 clips/ideas 全字段及 DOM 中心一致。 |
| 混合 ratio/null | `[.8,null,.2,1]` 的 4 条种子记录，在新版投影下实际可见 1 夹。隐藏源合到可见目标后可见身份/中心不变，所有正文保全，重启记录/中心保持。此项不包装成 3 或 4 夹同时可见。 |
| 旧比例记录 | 8 条合法 `0..1` 比例记录加载时比例和正文不改；退出重开后 records 全字段及可见中心保持，实际可见 4 夹。 |

真实 IPC Promise 被 await；移动/合并等待主进程 revision 增长、renderer 收到新 revision、自然解锁 `data-locked=false`、展示进度 1，再等待两次 rAF 后测 DOM。没有使用冻结布局下立即读取中心的旧假阳性路径。实际主进程负责 width/filter 语义，未从测试直接调用旧四参数 move 替代实际主进程。

这是实际 move、merge、split、undo、隐藏源 merge 与重启的有限链。此前严格多次移动链、三宽/随机压力的独立纯源复验仍是另份证据，不宣称本次原生重新跑完这些矩阵。两个投影/满容量 P2 在本机包上述增量中未复现；纯源完整红绿范围见 [独立修复报告](../qa-capture-stability-fix/READONLY-REVIEW.md)。

原件：[测试脚本](frozen-incremental.cjs)、[完整日志](incremental.log)、[机器结果](incremental-result.json)。机器结果 full-overflow 的 `visibleBefore:3` 实际记录的是合并后、重启前的分组可见数，不能读成最初满容量数；脚本直接比较移动前后实际 ID 集合，满夹几何另记录 4 纸。原 JSON 未改，[字段审计](result-field-audit.json) 明确这个命名缺口。

## 纸、夹子、页脚与 IPC 边界

实际 renderer 的满夹记录 4 纸/4 个页脚按钮/8 个已发布 IPC 矩形；合夹记录 3 纸/6 个页脚按钮/6 个 IPC 矩形。合计 7 次纸/夹子观察、10 个按钮观察。

每纸 160×226 DIP，每夹命中框 24×44，每按钮完整框 32×32。每个按钮四角均位于实际 SVG 2001 点采样轮廓内；按钮完整框、纸框和夹框均被实际 `thoughtline:hit-layout` 发布的矩形覆盖。观测轮廓加 stroke 的最大底缘为约 225.4371，低于 226。绳长/宽为 70%。

实际看过 [满夹图](shelf-full.png) 和 [合夹图](shelf-grouped.png)：可见居中淡端绳、正向蓝夹、蓝 Agent 字和中性正文；没有新增视觉通过声明。两图来自实际 renderer，在自有 fixture 中加入中性底色以便观察，非桌面合成截图。几何检查使用受控锁保持，不等于物理鼠标穿透或操作手感。证据：[满夹几何](geometry-full.json)、[合夹几何](geometry-grouped.json)。

按父追加要求及时保存的旧 Composer [浅色图](composer-current-light.png)/[深色图](composer-current-dark.png) 是原包的真实正常尺寸空态截图，未改样式。原生 bounds **530×440 DIP**，PNG 为 1060×880（DPR2）。两图来自首轮选择器错误发生前，原图保持未覆盖；包/SHA/bounds 绑定见 [Composer 元数据](composer-preview-binding.json)。不是新轻量 Composer 效果或 Windows 伪截图。

## 失败记录及清理

首轮误用了不存在的按钮名“取消修改”，等待 30 秒后 exit1。实际 UI 名称为“取消编辑并关闭”；只纠正自己的选择器后完整流程 exit0。首轮脚本/日志/结果均保存在 [attempt-1-selector-error](attempt-1-selector-error/incremental-result.json)，不当作产品缺陷，也未抹掉失败。首轮 5 PID 与最终 37 PID 合计 42 个，逐个 ps 验证不存在。两轮假数据有界清理通过；只卸载自己的 `/dev/disk5`，观察到 `disk5 ejected` 后复核挂载目录为空、App 路径不存在。未停止其他进程。证据：[进程复核](post-native-process-check.json)、[收尾检查](readonly-final-check.json)。

本次未单独重跑 120 秒性能。构建者报告该冻结包 120.149 秒、CPU 0.1997519746%、RSS max 305.015625 MiB、整体 exit0；这是构建者单独测量，不能写成独立 QA 性能测量。

## Windows 与入口只读复核

独立读取 [Windows CI 37873271157](https://github.com/NocodeMrLi/thoughtline/actions/runs/37873271157) 的元数据/日志：准确 head SHA 为本报告固定提交，success；Node24.19，20 文件/88 单测，类型、构建、NSIS 打包和上传通过。独立流式读取下载的 111267797 字节安装器，SHA256 为 `7d72b841c8136de21354e6ad6dd32eb6486adff9a1e77ec973d1ab14f8d6f918`，同时匹配 CI SHA 清单和构建者 receipt。**未执行安装器，属于未签名私有候选，不算物理 Windows 交互通过。** 证据：[独立 Windows 绑定](windows-independent-binding.json)、[原 CI 元数据](windows-ci.json)、[原日志](windows-ci.log)。

新入口 [静态脚本副本](launcher-0.0.15.command.txt) 固定核对上述 DMG/asar/.15 版本和严格签名，拒绝所列隔离目录/存储文件符号链接，使用独立 data，通过 `open -n -W --env` 明确传入 userData、清空 renderer URL/Node 模式/Node options；不改安装版、不删保留数据、不强制卸载或替杀进程。本人未执行此入口或其 `--check-only`，也不把原生直接启动验证写成自己完成 LaunchServices 验证。

发现的交付文档缺口及修正见 [入口审阅](launcher-review.json)：首版通用 README 全指 0.0.13，报告后已改成当前 .15 并把 .13 单列回退；修正首版报告相对链接曾指错目录，随后也已纠正为实际仓库报告路径；该最终报告正在由构建者写入，QA 收尾时目标文件尚未落盘，回退说明链接已存在。入口 `zsh -n` 静态语法检查 exit0。旧/新文本均保留，文档缺口不作为原生产品失败。

## 通过、失败和未测

- **通过：** 精确源码/包绑定、实际签名完整性、五输出等价、上述四场景、实际纸/夹/按钮/IPC 几何、假数据/自有进程/挂载清理；Windows 当前提交构建和产物 SHA。
- **失败记录：** 首轮 QA 选择器 exit1（已纠正并完整重跑通过）；原始机器结果字段命名欠精确（原文保留、审计说明）；交付 README 版本/链接缺口按修正文档复核。
- **未测/不放行：** 物理 macOS Hide、系统菜单鼠标交互、系统 IME/焦点/穿透、物理混合缩放/多屏、实际 Windows 设备、真实 Agent 跨应用接收、G7 自动全屏、磁盘不可写/隐藏超时等历史专项在 .15 的完整复跑、新轻量 Composer。没有整体正式验收结论。

本报告及所有原件的相对路径 SHA 清单见 [evidence-sha256.json](evidence-sha256.json)。
