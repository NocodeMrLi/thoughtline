# Thoughtline 0.0.13 冻结包独立增量复验

2026-10-09（Asia/Shanghai；完成时间见manifest）。**本轮受影响增量通过，完整正式验收仍未放行。** Q7托盘状态恢复、空绳提示移除、保存重启恢复与Q6测试清理均在实际0.0.13冻结Mac包完成独立检查。最终命令退出 **0**，QA原生实例全部结束，假数据删除成功，自己的只读DMG挂载已卸载。无需再次占用窗口。

## 固定候选与来源

| 项目 | 绑定 |
| --- | --- |
| 生产源码 | `dee1f2c9046b284e2dd430632d9bdb913128c868` |
| 原报告/证据提交 | `6ae06a2e8dc55c11cc37d1d99128c374eeb7e74d` |
| 版本 | `0.0.13` |
| DMG SHA256 | `63abca7db97acbde1876b26cf7f4394bb4e09a0888c38a72320cc1f7fe431f9c` |
| app.asar SHA256 | `4af1687daa8725dbbaa6793245a68aa4ed6681c5034197c7e30b39e917ae220e` |

QA从交付路径只复制指定DMG到自己的 `task-2/frozen-0.0.13/`，计算实际文件SHA、以readonly/nobrowse挂载，未安装、替换或操作 `/Applications/Thoughtline.app`。`codesign --verify --deep --strict` 退出0，见 [codesign.log](codesign.log)；该结果不扩大为Developer ID/公证声明。

另从准确源码提交独立git archive到QA目录，以QA已有依赖的独立APFS副本构建；Node25.8.1属于本机环境限制。包内main、preload、renderer HTML/CSS/JS **5个compiled输出与该构建逐字节一致**，见 [package-source-bytes.json](package-source-bytes.json)、[build.log](build.log)。本轮没有运行65单测；此前独立核实 [Windows CI37822783883](https://github.com/NocodeMrLi/thoughtline/actions/runs/37822783883) 准确dee1f2c、Node24.19.0、17文件/65单测、类型/构建与打包成功。CI不替代Windows物理流程。

生产与6ae06a2报告提交代码一致。后续 `fa4d372` 仅归档README与静态报告，已核验与dee1f2c的src/tests/scripts/package/.github diff为空。本次独立结果不继承0.0.11的原生结论，也不覆盖另树G7原型。

## 实际执行与边界

命令：`node qa-0.0.13-native/frozen-incremental.cjs`，cwd为QA的 `task-2`。脚本 [frozen-incremental.cjs](frozen-incremental.cjs)，最终 [incremental.log](incremental.log)，[逐项结果](incremental-result.json)，[绑定及SHA清单](incremental-manifest.json)。脚本复跑需要原QA布局的独立依赖/源码目录和重新只读挂载的冻结包；归档脚本原文保留这些路径依赖，不是放进生产目录直接运行的测试。

- 启动的是QA只读挂载中的实际冻结App，`app.getVersion()`为0.0.13，`app.getPath('userData')`严格等于本次独立临时假数据目录。环境删除开发renderer URL，未读取真实便签或外部账号数据。
- 冻结包启动后，只在QA进程包装 `Tray.prototype.setContextMenu` 来记录实际Menu对象；包装委托原生原方法，保留生产MenuItem回调。结果确认对象分别为实际 `Menu` / `MenuItem`，没有替换为假菜单。
- 操作托盘时调用已检查启用状态的实际MenuItem回调，然后等待主进程IPC状态、DOM及原生窗口状态完成。**这是实际原生对象回调加受控协议测试，不是物理点选macOS菜单。**设置保存和关闭、便签提交与草稿保存使用实际renderer按钮，并等待保存revision/数据或关闭锁状态；未以点击返回代替IPC完成。
- 显示空绳截图仅模拟QA进程自己的screen指针、使用renderer中性浅背景，不移动物理桌面指针，不控制第三方窗口。
- 假数据专属快捷键为 `Control+Alt+Shift+F18`，由未改动App正常注册；**没有物理按键触发，也没有从键盘调用快捷键回调**。本轮通过托盘真实回调进入写作，不做OS快捷键冲突矩阵验收。

## 通过清单与复现顺序

| 受影响项 | 独立结果 | 核验 |
| --- | --- | --- |
| 初始空绳 | 通过 | 启动只1个shelf；0个夹子、0个hit target、shelf正文空，没有常驻提示或替代按钮 |
| Q7设置打开/保存/关闭/新建 | 通过，原生Menu回调范围 | 托盘设置回调打开 → 写念头禁用 → 实际设置UI保存成功 → 关闭按钮 → await主进程解锁且manage原生不可见 → 写念头重新启用 → 实际Menu回调新建 → composer原生可见且输入框聚焦 |
| 已显示manage的模式转换 | 通过 | settings→browse时启用；同窗browse→settings时禁用，覆盖不再次发show的路径 |
| 便签保存 | 通过 | 实际UI保存中文、前后空格、换行、emoji，标题/项目/Codex归属保持；只有1条记录 |
| 筛选空态 | 通过 | 已保存Codex便签，实际Claude筛选回调 → 0夹子/0hit/正文空；原便签仍存在，托盘新建可达 |
| 草稿保存 | 通过 | 实际“保存草稿并关闭”按钮；await磁盘对应的主进程draft文字并解除锁，composer原生隐藏 |
| 退出→重新启动恢复 | 通过 | 实际App关闭后重新启动同一假数据目录；便签全文/标题/项目/Agent、草稿全文/标题/项目/Claude选择、reducedMotion与保存快捷键全部一致；全文面板再次核对便签原文 |
| Q6有界清理 | 通过 | 执行准确dee1f2c的cleanup helper，等待自身被测PID消失再rm；最终12个采集PID均不存在，目录删除，整体exit0，无ENOTEMPTY |

保存的便签文本为 `  独立0.0.13冻结包中文正文\n第二行😀\n末行  `；草稿为 `  独立0.0.13未提交草稿\n换行与空格😀  `，逐字核对，未trim。第一轮关闭前读取的假数据磁盘snapshot同样匹配。恢复后的composer实际表单和manage全文面板也匹配，未只用操作前已成立的断言。

测试清理使用候选自身 `tests/electron/idle-fixture-cleanup.cjs`。它只等候记录的QA PID，不结束其他应用；此轮验证实际退出/删除成功，没有注入新的ENOTEMPTY，也没有重跑120秒性能。自身12个PID为74141、74142、74143、74144、74151、74155、74169、74170、74171、74172、74180、74183，结束后另用ps确认全部不存在。

## 两张独立截图

已查看原图，空场景和筛选空场景都只显示同一条固定绳，没有提示、卡片或替代控件。原图均2880×680，中性背景仅用于QA观察，未编辑图片。

| 场景 | 文件 | SHA256 |
| --- | --- | --- |
| 初始空绳 | [empty-rope.png](empty-rope.png) | `0fdfbffb1c9f06e853d92b1600724d1894f3824ad79d50fc4115554d69c8a743` |
| 筛选空绳 | [filtered-empty-rope.png](filtered-empty-rope.png) | `a1d2c017747f8a5eaec882e6bf5916fc8ae5da7bb986ca19b54aafdad7c03a62` |

两者DOM核验夹子0、hit0、正文空；rope path均 `M 140 22 Q 720 82 1300 22`。本轮只新增受影响空场景，不重拍旧12图或重测未修改夹子几何。

## 失败记录与未测清单

首轮脚本的Electron `evaluate` 回调参数顺序写错，菜单label误取到Electron模块对象，命令exit1；仅完成初始空态。该轮所有原生进程和假数据仍清理成功。保留 [诊断日志](attempt-1-qa-argument-error.log)、[诊断结果](attempt-1-qa-argument-error.json)；修正QA脚本后上述完整序列exit0。它不属于产品缺陷，也没有被当作通过证据。

本轮未发现受影响范围内未修复的产品问题。正式验收仍未放行，以下不扩大通过：物理系统菜单点选、真实全局按键/冲突矩阵、物理IME候选窗、跨应用焦点/点击穿透、Windows实机、多屏/睡眠、真实Agent接收、用户审美、0.0.13独立120秒性能。构建者0.0.13性能样本仅在此前静态阶段算术核验，没有作为本次独立测量。

G7为另一个隔离原型，未集成0.0.13；构建者报告预存屏幕采集授权为true，不能证明未授权Mac支持。本QA增量没有复验该原型，也未因此放行G7。0.0.11与0.0.12历史记录保持原范围。没有修改生产源码、推送或发布，没有操作用户安装版。
