# 轻量输入窗：先看实际效果

本轮按用户同意的轻量方向实现独立预览，0.0.15 冻结包保持不变。默认正文优先，Agent 用紧凑选择器，名称和项目一起折叠；展开后仍可完整填写。没有改当前绳、纸、夹子或 Agent 标签视觉。

| 默认浅色 | 展开可选信息 |
|---|---|
| ![Mac 实际默认输入窗](evidence/composer-preview/default-light.png) | ![Mac 实际展开输入窗](evidence/composer-preview/options-light.png) |

两图是实际 Mac Electron 源码窗口的截图：530×520 DIP、DPR2，PNG1060×1040。不是 Windows 运行图，也不是已打包的新安装版。深色图：[默认](evidence/composer-preview/default-dark.png)、[展开](evidence/composer-preview/options-dark.png)。旧 .15 对照：[浅色530×440](evidence/composer-preview/before-0.0.15/composer-current-light.png)、[深色](evidence/composer-preview/before-0.0.15/composer-current-dark.png)。

固定源码：`6638ce14a4aefc9f3a13e2fbb36b7710f722c55f`，分支 `codex/thoughtline-composer-20261009`，版本 `0.0.16-preview.1`。基于 `61a6837`，源码/编译输出/截图 SHA 与实际窗口尺寸见 [绑定](evidence/composer-preview/source-preview-binding.json)。

基础验证：20文件88单测、类型检查、构建通过；实际新 Composer 专项整体 exit0。关闭重开精确恢复正文/名称/项目/自定义 Agent；合成组合事件挡住提交和 Esc；只读假数据目录导致保存失败时文字保留、输入框重新得到焦点，恢复可写后重试成功；同一事件批次三次点击只生成一条，空格/换行/emoji 全文保全。5 个自有 PID 已退出，临时假数据删除。日志及机器结果：[原生结果](evidence/composer-preview/result.json)、[清理](evidence/composer-preview/cleanup.json)、[单测](evidence/composer-preview/unit-final.log)、[类型](evidence/composer-preview/typecheck-final.log)、[构建](evidence/composer-preview/build.log)。

首轮发现真实的预览错误焦点时序：禁用期间安排 focus 没有生效，专项 exit1。改为 error/busy 渲染提交后再 focus，完整复验 exit0。保留 [红日志](evidence/composer-preview/error-refocus-red.log)，没有把首轮命令标绿。

当前仅可声称显式关闭和正常退出保存草稿；**未持久化的正在输入内容仍没有自动保存或异常退出恢复承诺**。下一阶段先用假数据复现异常终止，再独立实现安全节流/原子保存及恢复；不阻挡本次先看效果。真实系统 IME、跨应用焦点/热键、完整编辑迁移、长文本/低工作区、屏幕阅读器、Windows 原生与新冻结包矩阵仍待后续验证；合成组合事件不等于物理中文输入验收。

## 02:43 用户视觉反馈覆盖初次预览状态

用户明确拒绝当前布局：正文框过大、底部元素繁杂、折叠不缩小窗口且隐藏信息、边框缺少Agent颜色联动。原图和功能证据保持，**当前视觉不通过**。父提出紧凑/直接显示可选字段/动态正文高度/Agent色描边备选，待确认，未实施新布局。

[独立只读审阅](evidence/composer-independent-readonly/READONLY-REVIEW.md) 与 [用户反馈补充](evidence/composer-independent-readonly/USER-VISUAL-FEEDBACK-ADDENDUM.md)。原专项是同进程关闭/隐藏重开，不是重启或dirty quit；synthetic composition原负断言立即读取，未完整等待在途IPC/原生可见/锁；新查找与分组迁移尚未实际点击复验。深色默认图焦点在summary折叠后，不能说四图均正文聚焦。以上是证据边界，不把源码guard或原有功能结论误报失败。草稿恢复在另一个工作树推进。
