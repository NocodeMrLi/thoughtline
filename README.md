# 晾念头 / Thoughtline

面向 macOS 与 Windows 的桌面顶边念头挂绳。快捷记录完整正文，用彩色夹子区分 Agent；固定自然弧线，无常驻主窗口或工具条。

已发布基线 **0.0.16-preview.6**：批准的红夹 TL 图标、480×260 紧凑输入窗、名称编辑提示、内联项目/Agent、草稿组合输入及延迟提交续作保护。全文、管理、搜索归档、分组合夹拆分撤销和纯文本拖出保留。物理跨应用拖入仍需逐个 Agent 验收，G7 全屏探测保持独立实验。

按用户授权收敛到 **main**，保留阶段提交作为回滚点。双端私有预发布已发布，最终远端状态见 [发布报告](acceptance/RELEASE-0.0.16-preview.6.md)，准确来源及 SHA256 随安装包清单提供。历史 `.15` 包和 QA 记录保留；后续开发默认使用 main，不为日常增量另建分支。

当前开发候选 **0.0.17-preview.2**（尚未最终冻结打包）：P1 项目长按即时删除，P2 整夹／单纸／正文拖动、全绳空位与即时翻页已提交 main `97875dda8d85201ff088218a347f7de2c301dc7e`。原地自动保存、最近删除和念头日历已接入并通过限定独立审查；目录迁移、独立备份和实际恢复已完成源码受控验证，最终包与物理验收仍待完成。准确实现／证据／未测边界见 [本轮记录](docs/ROUND1-REPAIR.md)、[数据升级与回滚](docs/ROUND1-DATA-SAFETY.md) 和 [接收端矩阵](acceptance/ROUND1-DRAG-MATRIX.md)。

## 开发与验证

Node24.19.0：`npm ci`、`npm run verify`、`npm run dev`。Control+Alt+N 写念头；Mac⌘Enter、WindowsCtrlEnter提交，Enter换行，Esc存草稿。

P5 最近一次 Mac 全工程验证为175项单测通过、4项Windows专属跳过、类型/构建通过（在R1之前）；随后检查后目录失联R1修复有25项相关单测、类型/构建与受控Electron启动验证，并通过限定复核；目录迁移和备份恢复另有隔离 source Electron 检查。最近成功的Windows CI是P5源码 `fa45cb88105db81806e419bba5d8029af9540389`（182项单测、构建及schema3严格安装保全），版本preview.1；这是阶段证据，不是最终preview.2。已发布preview6的102/106项单测、DMG内保存/重启及Windows安装保全是历史证据，不能算本轮刷新。合成DOM/IPC、单测和CI不能替代物理IME、焦点、空白穿透、热键、多屏、真实Agent/G7；**formalAcceptance=false**。Windows CtrlEnter 的本轮Composer端到端测试待最终CI接入。

设置中的“念头数据位置”显示实际路径；更改位置保留旧副本，导出备份不切换当前目录。恢复到新目录与旧版本回滚步骤见 [数据安全说明](docs/ROUND1-DATA-SAFETY.md)。

## 安装与数据

macOS Apple Silicon **arm64 DMG**；Windows **x64 NSIS**。没有 Intel Mac、原生 Windows ARM64/x86 包或自动更新。Mac为完整资源ad-hoc签名，未Developer ID/公证；Windows未签名。被Gatekeeper/SmartScreen/SAC或企业策略阻挡时记录原文，不关闭安全机制、不修改执行策略。

先退出旧App，备份整个默认数据目录（Mac `~/Library/Application Support/Thoughtline`；Windows `%APPDATA%\Thoughtline`），保留旧包。相同appId可替换旧安装；隔离笔记不等于并排安装身份。Windows先取消安装完成页自动运行，再按 [实机清单和隔离入口](docs/WINDOWS-ACCEPTANCE-V11-20261009.md)只用合成数据。

普通Windows卸载保留默认数据；显式 `--delete-app-data` 会删除默认profile，本轮不传。自定义数据放在安装目录内不作保持保证。回滚先保留新旧两份完整数据，对副本验证，不能覆盖唯一新数据。未ACK尾部、未提交编辑、注销/关机、强退/断电不承诺零丢失。

历史门禁与性能记录明确保留原来源，见 [验收记录](acceptance/gates.json)；[`.15`冻结报告](acceptance/CANDIDATE-0.0.15-REPORT.md)可用于历史追溯。产品方案和UI契约在用户项目笔记目录，第三方许可见 [声明](THIRD_PARTY_NOTICES.md)。仓库保持私有。
