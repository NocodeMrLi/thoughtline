# 晾念头 / Thoughtline

面向macOS与Windows的桌面顶边念头挂绳。快捷记录想法和提示词，用彩色夹子区分Agent；挂多下沉、取下回升，随时取用。

当前版本 **0.0.1原生窗口小样**。界面没有常驻主窗口，空数据时显示三张不入库的测试卡。已开始共享逻辑和可靠保存；完整特效、整理流程、跨Agent拖入及双端验收仍在推进。详见[当前阶段](docs/STAGE-0.md)。

## 本地开发

Node24.19.0。执行 `npm ci`、`npm run verify`、`npm run dev`。主入口Control+Alt+N；Mac⌘Enter、WindowsCtrlEnter挂上，Esc保存草稿。鼠标在屏幕顶部停留后显示挂绳。

使用显式node_modules工具路径，兼容本机项目目录名称包含冒号的情况。`npm run smoke`验证真实Electron窗口配置与热键注册，不能替代物理鼠标及跨App验证。

## 安装测试

Mac arm64：`npm run package:mac`。Windows x64：Windows GitHub Actions运行验证及NSIS打包，安装包保存在对应Actions私有构建附件中。安装包SHA256随包提供；卸载不删除个人念头数据。

Mac和Windows分别记录构建、安装与用户反馈，见[验收节点](acceptance/gates.json)。当前尚无Windows实机通过结论。

## 项目依据

产品方案、开工计划及两轮UI审计主文存于用户指定笔记目录；代码阶段状态在本仓库记录。本仓库暂未开源，参考复用代码仍保留其原许可，见[第三方声明](THIRD_PARTY_NOTICES.md)。
