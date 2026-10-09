# 界面词条边界

生产入口是 renderer/main.tsx 的 Shelf、Composer、Detail、Calendar 和 Settings。旧 Manage.tsx 已无运行路由，本增量不将其视作当前日历，也不为未使用页面扩展功能。

集中词条位于 src/shared/messages.ts；zh 与 en 使用同一静态键集，具名占位符由 TypeScript 约束。i18n.ts 负责日期、数量与错误边界。日期按持久化的 createdDay 的 UTC 中午格式化，语言不会改写该归属日、时区或 ID。

覆盖：

- Composer 名称编辑提示、正文提示、项目与 Agent 选择、草稿错误、组合输入提示、保存与关闭。
- Detail/IdeaReader 标题列表、翻页、编辑、复制、收起、拆夹、删除恢复与永久删除确认、成功/失败状态。
- InlineIdeaEditor 自动保存状态、正文/标题/项目/Agent 标签、输入法/失败保护和重试。
- Calendar 月/年/日、计数、星期、检索、状态、最近删除、更多菜单、空态、Agent 管理。
- Settings 热键、减少动态效果、存储位置、导出与迁移、独立语言/外观和跟随系统。
- Shelf/ClipCard 拖动、复制、分页、展开、冲突与空间提示；绳上不增加偏好入口。
- 主进程的启动数据错误、恢复/重试/退出选择、文件夹选择对话框、托盘、右键菜单及原生工具提示。
- 下层 repository、storageLocations、ideaCommands、clipCommands 的既有错误通过明确消息边界映射；已知应用错误按当前语言呈现，文件路径与原始 OS 诊断保留。未知诊断原样保留，不对任意字符串做批量翻译。

正文、用户标题/项目/自定义 Agent 名称不进入翻译函数。General 按 general 系统 ID 显示，空项目表示系统 Ungrouped；同名自定义 Agent 和非空用户项目“通用”“未分组”保留原文。异步错误和成功提示在渲染时按当前语言解析，偏好过期回调还受渲染器请求号与持久化版本保护。

本表是源代码覆盖说明，不等于每条文案在 Mac/Windows 物理原生菜单、工具提示、实际输入法或接收端的实机验收。

修复轮1补充：初版覆盖说明遗漏了 Shelf 的直接输出和捕获旧 t 的拖动回调，现已统一在当前渲染时解析 notice/error，保持拖动监听器稳定。错误边界取消对全部 UI 模板的反向正则，只识别精确固定词条以及明确的 repository IO、两层 storage、fileMismatch 和两个存储成功通知外壳；诊断与路径槽原字节保留。实际启动读取错误、分页写失败、外层 storage catch 的 DOM/原生对话框拦截测试见 fix-round1，不追溯声称初版已经覆盖。
