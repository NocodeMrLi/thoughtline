# 晾念头 / Thoughtline

面向 macOS 与 Windows 的桌面顶边念头挂绳。快捷记录完整正文，用彩色夹子区分 Agent；固定自然弧线，无常驻主窗口或工具条。

当前候选 **0.0.16-preview.6**：批准的红夹 TL 图标、480×260 紧凑输入窗、名称编辑提示、内联项目/Agent、草稿组合输入及延迟提交续作保护。全文、管理、搜索归档、分组合夹拆分撤销和纯文本拖出保留。物理跨应用拖入仍需逐个 Agent 验收，G7 全屏探测保持独立实验。

按用户授权收敛到 **main**，保留阶段提交作为回滚点。双端私有预发布已发布，最终远端状态见 [发布报告](acceptance/RELEASE-0.0.16-preview.6.md)，准确来源及 SHA256 随安装包清单提供。历史 `.15` 包和 QA 记录保留；后续开发默认使用 main，不为日常增量另建分支。

## 开发与验证

Node24.19.0：`npm ci`、`npm run verify`、`npm run dev`。Control+Alt+N 写念头；Mac⌘Enter、WindowsCtrlEnter提交，Enter换行，Esc存草稿。

Mac102unit、Windows106unit、类型/构建通过。当前Mac20项合成组合输入、4项受控延迟续作及DMG内App隔离保存/重启通过；Windows CI实际当前用户安装、同版本重装、普通卸载合成数据保持、单实例和PE嵌入图标通过。合成DOM/IPC、单测和CI不能替代物理IME、焦点、空白穿透、热键、多屏、真实Agent/G7、旧版升级回滚；**formalAcceptance=false**。当前 Windows CtrlEnter 没有 Composer 端到端操作。

## 安装与数据

macOS Apple Silicon **arm64 DMG**；Windows **x64 NSIS**。没有 Intel Mac、原生 Windows ARM64/x86 包或自动更新。Mac为完整资源ad-hoc签名，未Developer ID/公证；Windows未签名。被Gatekeeper/SmartScreen/SAC或企业策略阻挡时记录原文，不关闭安全机制、不修改执行策略。

先退出旧App，备份整个默认数据目录（Mac `~/Library/Application Support/Thoughtline`；Windows `%APPDATA%\Thoughtline`），保留旧包。相同appId可替换旧安装；隔离笔记不等于并排安装身份。Windows先取消安装完成页自动运行，再按 [实机清单和隔离入口](docs/WINDOWS-ACCEPTANCE-V11-20261009.md)只用合成数据。

普通Windows卸载保留默认数据；显式 `--delete-app-data` 会删除默认profile，本轮不传。自定义数据放在安装目录内不作保持保证。回滚先保留新旧两份完整数据，对副本验证，不能覆盖唯一新数据。未ACK尾部、未提交编辑、注销/关机、强退/断电不承诺零丢失。

历史门禁与性能记录明确保留原来源，见 [验收记录](acceptance/gates.json)；[`.15`冻结报告](acceptance/CANDIDATE-0.0.15-REPORT.md)可用于历史追溯。产品方案和UI契约在用户项目笔记目录，第三方许可见 [声明](THIRD_PARTY_NOTICES.md)。仓库保持私有。
