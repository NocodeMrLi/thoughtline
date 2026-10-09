# 晾念头 / Thoughtline

面向 macOS 与 Windows 的桌面顶边念头挂绳。快捷记录完整正文，用彩色夹子区分 Agent；固定自然弧线，无常驻主窗口或工具条。

历史已发布基线 **0.0.16-preview.6**：批准的红夹 TL 图标、480×260 紧凑输入窗、名称编辑提示、内联项目/Agent、草稿组合输入及延迟提交续作保护。全文、管理、搜索归档、分组合夹拆分撤销和纯文本拖出保留。物理跨应用拖入仍需逐个 Agent 验收，G7 全屏探测保持独立实验。

按用户授权收敛到 **main**，保留阶段提交作为回滚点。双端私有预发布已发布，最终远端状态见 [发布报告](acceptance/RELEASE-0.0.16-preview.6.md)，准确来源及 SHA256 随安装包清单提供。历史 `.15` 包和 QA 记录保留；后续开发默认使用 main，不为日常增量另建分支。

最新私有测试预发布 **0.0.17-preview.2**：分组即时删除、拖拆／外拖源协议、即时翻页与全绳空位、原地自动保存、最近删除、念头日历／苹果日历式等比连续缩放／批准Logo红夹子、目录迁移与实际备份恢复已实现并通过适用检查。实际双端包来自同一源码 `ca2137b1c7af1458643ac2988c6cc4ed9ce15e35`。包／哈希／严格隔离入口见 [本轮发布报告](acceptance/RELEASE-0.0.17-preview.2.md) 与 [私有预发布](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.2)；逐项实现／证据／未测边界见 [本轮记录](docs/ROUND1-REPAIR.md)、[数据安全](docs/ROUND1-DATA-SAFETY.md) 和 [接收端矩阵](acceptance/ROUND1-DRAG-MATRIX.md)。

## 开发与验证

Node24.19.0：`npm ci`、`npm run verify`、`npm run dev`。Control+Alt+N 写念头；Mac⌘Enter、WindowsCtrlEnter提交，Enter换行，Esc存草稿。

本轮Mac源全量184通过／4Windows专属跳过，类型与构建通过；9个最终源Electron流程、实际只读DMG App六项检查（含独立备份SHA与恢复两次重启）通过。Windows最终CI37943540735在同一ca2137b上188／188单测、类型／构建、10源交互及严格NSIS安装／重装／卸载保全通过，含合成ControlEnter端到端。物理Mac／Windows中文输入法、DPI、多屏、窗口焦点／穿透与微信／QQ豆包／WorkBuddy真实输入框均未测；CI、合成事件和源DOM不能代替这些验收。**formalAcceptance=false**。历史preview6及P5阶段结果保留为历史，不算本轮刷新。

设置中的“念头数据位置”显示实际路径；更改位置保留旧副本，导出备份不切换当前目录。恢复到新目录与旧版本回滚步骤见 [数据安全说明](docs/ROUND1-DATA-SAFETY.md)。

## 安装与数据

macOS Apple Silicon **arm64 DMG**；Windows **x64 NSIS**。没有 Intel Mac、原生 Windows ARM64/x86 包或自动更新。Mac为完整资源ad-hoc签名，未Developer ID/公证；Windows未签名。被Gatekeeper/SmartScreen/SAC或企业策略阻挡时记录原文，不关闭安全机制、不修改执行策略。

先退出旧App，备份整个默认数据目录（Mac `~/Library/Application Support/Thoughtline`；Windows `%APPDATA%\Thoughtline`），保留旧包。相同appId可替换旧安装；隔离笔记不等于并排安装身份。Windows先取消安装完成页自动运行，再按 [实机清单和隔离入口](docs/WINDOWS-ACCEPTANCE-V11-20261009.md)只用合成数据。

普通Windows卸载保留默认数据；显式 `--delete-app-data` 会删除默认profile，本轮不传。自定义数据放在安装目录内不作保持保证。回滚先保留新旧两份完整数据，对副本验证，不能覆盖唯一新数据。未ACK尾部、未提交编辑、注销/关机、强退/断电不承诺零丢失。

历史门禁与性能记录明确保留原来源，见 [验收记录](acceptance/gates.json)；[`.15`冻结报告](acceptance/CANDIDATE-0.0.15-REPORT.md)可用于历史追溯。产品方案和UI契约在用户项目笔记目录，第三方许可见 [声明](THIRD_PARTY_NOTICES.md)。仓库保持私有。

本轮Mac隔离入口为 `Start-Thoughtline-Isolated-Mac.command`，固定最终交付目录及包哈希；GitHub中文名清洗后使用ASCII别名，脚本字节未变。旧模板中中文名是生成名，实际交付按本轮报告。Windows使用独立测试环境及严格 `.2` 入口；未自动替换用户安装。
