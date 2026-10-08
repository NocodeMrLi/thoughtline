# Thoughtline 0.0.13 候选验收报告

2026-10-09，北京时间。源码冻结 `dee1f2c9046b284e2dd430632d9bdb913128c868`，分支 `codex/thoughtline-acceptance-20261009`。这是可供独立复验的候选，**正式验收未放行**。未合并 main、未发布新版本；下载预发布仍为 v0.0.6-alpha.1。

## 本轮变化

空态和筛选空态仅保留挂绳，移除常驻提示和常驻按钮。托盘“写念头”成为实际新建入口，显示用户保存的快捷键符号。修复设置打开、保存、关闭及同一窗口切换模式时托盘状态未刷新的 Q7：设置打开即禁用，关闭后恢复，可再次打开写作窗。测试清理等待自己创建的进程树退出并有界重试删除，保留异常退出记录。

草稿安全、卡片分组、原子持久化、纯文本拖出和按需窗口属于此前实施范围。本轮没有扩大产品范围。

## 当前版本实际证据

- Node 24.19：65 单元测试、17 文件，类型检查与构建通过。日志 `evidence/candidate-0.0.13-verify.log`。
- 串行 7 组隔离 Mac Electron 流程通过：空挂绳/托盘、干净挂绳、弹簧夹、固定挂绳、编辑归档搜索恢复、隐藏草稿、窗口释放重建。具体脚本/退出码见 `evidence/candidate-0.0.13-native.json`。真实 Electron 对象与受控协议，不等同物理 IME、真实热键或 Windows。
- 当前 12 图为 .13 源码重拍，DPR 1/2、明暗背景、0/3/24 条数据对应 **0/3/5 个可见夹子**。1440 DIP 测试屏容量 5；24 不代表同时显示 24。绝对路径与 SHA 在 `evidence/clothespin-correction.json`。
- Mac 冻结包严格签名检查和保存→立即退出→重启全文恢复通过。5 个编译输出与 asar 逐字节一致。
- 无调试器单次 120.188 秒空闲采样，稳定 4 进程，单核 CPU **0.191367%**，稳定区間 RSS 最大 **303.171875 MiB**，CPU≤2 / RSS≤350 均通过。命令退出 **0**、清理成功。范围仅假数据、隐藏空态 Mac 包，不能推广为 Windows 或全部场景性能。
- Windows CI [37822783883](https://github.com/NocodeMrLi/thoughtline/actions/runs/37822783883) 准确源码构建成功；安装器已下载且 SHA 与 CI 清单相符，未在 Windows 执行。

## 独立 0.0.13 冻结包增量复验

独立 QA 使用自己的只读挂载和假数据，核对 DMG/asar 哈希，并独立构建得到相同的 5 个编译文件。新包的空/筛选空态为零正文、零 hit、零夹子；真实 Tray/MenuItem 回调完成设置打开→保存→关闭→重新新建及同窗 browse/settings 模式转换。已保存便签和未提交草稿（中文、空格、换行、emoji）以及标签/项目/Agent/reducedMotion 设置重启保持一致。

修正 QA evaluate 参数错误后完整运行 **exit0**，自己的 12 个 PID 全部退出、有界清理成功、DMG 已卸载。首轮脚本错误 **exit1** 原样归档，不是产品缺陷，未改写为通过。假数据专属 F18 由 App 注册，未物理触发；MenuItem 回调不等于物理托盘点选。完整独立报告 [INCREMENTAL-QA-REPORT.md](evidence/qa-0.0.13/INCREMENTAL-QA-REPORT.md)，原始证据与哈希在同目录，不继承 .11 独立原生通过。

## 冻结产物

| 产物 | SHA256 |
|---|---|
| `dist/Thoughtline-0.0.13-mac-arm64.dmg` | `63abca7db97acbde1876b26cf7f4394bb4e09a0888c38a72320cc1f7fe431f9c` |
| `dist/windows-dee1f2c/Thoughtline-0.0.13-win-x64.exe` | `e622f892c3703477fb79b785cfc0a085c708b94c7046e7e7d4031329a7e460ea` |
| Mac `app.asar` | `4af1687daa8725dbbaa6793245a68aa4ed6681c5034197c7e30b39e917ae220e` |

Mac 为 ad-hoc 签名，非 Developer ID/公证；Windows 未签名。产物均本地/私有 CI，不是公开发布。

## 历史证据和回退

保留 .11 `f99cdea` 的 DMG/Windows 安装器作回退。独立 QA 报告及原 .11 的包、截图、采样记录归档 `evidence/qa-0.0.11/`。独立 QA .11 的性能 CPU 0.183048%、RSS 266.734375 MiB 合格，但原命令最终 ENOTEMPTY **exit 1**，独立清理完成；不把整条命令标绿。独立 QA 结论不继承到 .13。

.12 `85e5e40` 只作诊断记录：存在 Q7，不能当稳定交付。早期多便签截图实际只有 3 夹的问题已撤回重拍；旧错误图片不计入验收。分组、动效、拖出等未在 .13 重新运行的旧专项，机器门禁标注历史来源，不混成当前 7 组。

## 剩余门禁和用户复验

G7 自动全屏抑制尚未实现，当前可使用托盘手动暂停；Mac `visibleOnFullScreen:false` 不等于跨应用检测。公开 API 原型已在单独工作树完成有限范围验证，不改变本冻结包；原型代码754a58f、报告cacf067。自有 Mac 靶窗 clear→blocked→clear 和 Windows runner 构建/19检查通过，但本机已有屏幕采集授权，未证明未授权Mac可用，也未完成物理Windows/多应用/多屏和产品集成。详见 docs/FULLSCREEN-SUPPRESSION-PROPOSAL.md。

物理 Windows 的焦点、穿透、中文 IME、混合缩放；Mac 系统 IME/跨应用焦点；真实 Agent 接收纯文本；睡眠锁屏/多屏矩阵和主观视觉验收仍待完成。未声称全部验收通过。

用户复验：使用单独假数据启动候选，确认空挂绳无常驻文字；托盘写念头能录入中文；打开设置、保存、关闭后再次从托盘写念头；检查保存和草稿取消、退出重启；对 3 条假数据分组/合并/拆分/撤销；向真实 Agent 拖正文确认只传文本并检查取消不丢数据；全屏时先手动暂停。物理操作需逐项记录结果。

Library 批量保存失败：`Library prepare_uploads is not available`。没有确认保存的附件或 Library ID；本报告和截图以本地路径交付，不虚构云附件。
