# 晾念头 / Thoughtline

面向macOS与Windows的桌面顶边念头挂绳。快捷记录想法和提示词，用彩色夹子区分Agent；挂多下沉、取下回升，随时取用。

当前源码 **0.0.4：紧凑分组＋Mac打包签名修复**。桌面挂绳加快捷输入，没有常驻主窗口。已接入编辑、临时全文浏览、收起/恢复、搜索、Agent增改迁移、筛选/溢出和封顶下沉动画；已加入160×112DIP紧凑卡、展开全文、拖动夹子/同Agent合夹/拆分、悬停箭头与页码跳转；跨Agent正文拖入及双端物理体验仍在推进。详见[当前阶段](docs/STAGE-0.md)。

## 本地开发

当前落地阶段直接在 `main` 开发；经过验证的阶段提交并推送，作为修复与回滚节点。大版本迭代再建立独立分支。

Node24.19.0。执行 `npm ci`、`npm run verify`、`npm run dev`。主入口Control+Alt+N；Mac⌘Enter、WindowsCtrlEnter挂上，Esc保存草稿。鼠标在屏幕顶部停留后显示挂绳。

使用显式node_modules工具路径，兼容本机项目目录名称包含冒号的情况。`npm run smoke`验证真实Electron窗口配置与热键注册；`npm run workflow`验证编辑取消、全文保存、收起搜索恢复、复制和重启保全。`npm run groups`验证拖动停留合并、提前松手不合并、翻页不误复制、拆分撤销和重启；这些不能替代物理鼠标及跨App验证。

## 安装测试

Mac arm64：`npm run package:mac`。Windows x64：Windows GitHub Actions运行验证及NSIS打包，安装包同时保存于对应Actions私有构建附件和[双端测试预发布](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.3-alpha.1)。安装包SHA256随包提供；卸载不删除个人念头数据。

Mac和Windows分别记录构建、安装与用户反馈，见[验收节点](acceptance/gates.json)。当前尚无Windows实机通过结论。

## 项目依据

产品方案、开工计划及两轮UI审计主文存于用户指定笔记目录；代码阶段状态在本仓库记录。本仓库暂未开源，参考复用代码仍保留其原许可，见[第三方声明](THIRD_PARTY_NOTICES.md)。

## Mac测试包签名校验

0.0.3及更早Mac包漏了资源签名校验；0.0.4显式执行ad-hoc签名，`package:mac`必须验证构建App和DMG内App的`codesign --verify --deep --strict`，任一失败则打包命令失败。报告输出到dist/mac-signature-verification.json。这是完整资源签名，并非Apple Developer ID或公证；可信私有测试包首次下载仍可能需要“系统设置→隐私与安全性→仍要打开”，不能据本机未隔离启动宣称所有下载电脑免拦截。[Apple官方说明](https://support.apple.com/zh-cn/102445)

自动测试使用独立临时数据并在结束时清理；实际包循环可设置THOUGHTLINE_EXECUTABLE复用原测试脚本，避免复制测试脚本与长期保留测试用户目录。
