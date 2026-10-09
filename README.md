<h1 align="center">
  <img src="assets/app-icon.png" alt="Thoughtline app icon" width="96" height="96" valign="middle" /> 晾念头 · Thoughtline
</h1>

<p align="center">
  <a href="https://github.com/NocodeMrLi/thoughtline/stargazers"><img src="docs/readme/badges/stars.svg" alt="GitHub stars: 0" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases"><img src="docs/readme/badges/downloads.svg" alt="Release asset downloads: 3" /></a>
  <a href="#license"><img src="docs/readme/badges/license.svg" alt="License: UNLICENSED" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.3"><img src="docs/readme/badges/preview.svg" alt="Preview: 0.0.17-preview.3" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/issues"><img src="docs/readme/badges/feedback.svg" alt="Feedback on GitHub" /></a>
  <a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.3"><img src="docs/readme/badges/platforms.svg" alt="Platforms: macOS and Windows" /></a>
</p>

<p align="center">
  <sub><a href="README.md">中文</a> · <a href="docs/readme/README.en.md">English</a> · <a href="docs/readme/README.ja.md">日本語</a> · <a href="docs/readme/README.ko.md">한국어</a> · <a href="docs/readme/README.es.md">Español</a> · <a href="docs/readme/README.fr.md">Français</a> · <a href="docs/readme/README.pt.md">Português</a></sub>
</p>

<p align="center">
  <strong>把念头晾起来，让灵感随手可见。</strong><br />
  用一根绳、几只夹子和几张纸，轻轻留住工作与生活里的念头。
</p>

<h2 align="center"><a href="https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.3"><ins>下载 Thoughtline</ins></a></h2>

<p align="center"><sub>macOS Apple Silicon · Windows x64 · 0.0.17-preview.3</sub></p>

Thoughtline 是一款面向 macOS 和 Windows 的轻量桌面念头工具。需要时，在屏幕顶边呼出晾衣绳；写下、整理、取用，再回到手头的事情。

## 功能

- **随手记下**：快捷键打开新建窗，记录标题、正文和归属；未提交内容可以保存为草稿。
- **晾在桌面**：常驻界面只有绳、夹子和纸张。夹子正面夹住薄纸，新念头默认归属“通用”。
- **顺手整理**：拖木夹移动整组，拖纸张上缘抽出一张；兼容夹子可以合并，整理支持撤销。
- **原地修改**：在展开窗或日历里直接编辑，短暂停顿后自动保存；组内翻页即时显示。
- **按日期回看**：念头日历支持日、月、年浏览、搜索与状态筛选；已收起的念头仍可找到。
- **留下退路**：删除念头进入最近删除，可以恢复；删除项目只解除归属，保留念头内容。
- **取用正文**：显式复制或从正文拖出纯文本，原纸张保留，不自动发送。
- **自己管理数据**：念头保存在本机，可查看实际目录、更改保存位置、导出独立备份。
- **中英与昼夜**：首层窗口即可切换中文／English和白昼／夜间外观，也可跟随系统；纸张保持柔和、清晰的纸感。

<p align="center">
  <img src="docs/readme/images/thought-calendar.png" alt="Thoughtline念头日历：有记录的日期显示Logo红夹子与条数" width="740" />
  <br /><sub>念头日历示例，使用合成演示数据。</sub>
</p>

## 下载与安装

当前为预览版，测试包向有仓库访问权限的成员开放。到 [Releases](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.17-preview.3) 下载安装包、隔离启动入口和 `SHA256SUMS`；每版提供对应构建来源与校验清单。

| 平台 | 当前安装包 |
|---|---|
| macOS · Apple Silicon | arm64 · DMG |
| Windows | x64 · EXE（NSIS） |

安装或升级前，正常退出应用并备份现有数据。Mac 当前为 ad-hoc 签名，尚未 Developer ID 签名或公证；Windows 当前未签名。安装受系统安全提示阻挡时保留原提示，不关闭安全保护。当前不提供自动更新。

## 开始使用

1. 按 `Control + Alt + N` 写一个念头；Mac 对应 `⌃ + ⌥ + N`，可在设置中修改。
2. `Enter` 换行；Mac 用 `⌘ + Enter` 提交，Windows 用 `Ctrl + Enter` 提交；`Esc` 保存草稿并收起输入窗。
3. 将鼠标移到屏幕顶边，呼出绳上的念头。展开纸张可阅读、复制、编辑或收起。
4. 从日历回看、搜索已收起的念头，或在最近删除中恢复内容。

Codex、Claude、Cursor 等标签表示念头归属。向其他软件取用内容时，由用户复制或拖动正文；目标输入框的实际接收效果仍需分别验证。

## 数据与备份

日历设置显示实际保存位置。迁移先复制并校验，再切换目录；旧副本保留。导出备份是独立副本，不改变当前位置。恢复流程见 [数据安全说明](docs/ROUND1-DATA-SAFETY.md)。

当前数据格式为 schema3。旧版 `0.0.16-preview.6` 不能直接读取新格式；降级前保留新数据，并使用升级前备份在独立目录验证。升级前备份不包含之后的修改。

## 开发

使用 **Node.js 24.19.0 或更高的 24.x 版本**。

```bash
npm ci
npm run dev
```

```bash
npm run verify
npm run package:mac
npm run package:win
```

`verify` 执行类型检查、单元测试与构建；平台包在对应系统构建。技术栈为 Electron、React、TypeScript 和 Vite。

当前预览版已完成适用自动检查与包验证。真实 Mac／Windows 输入法、DPI、多屏、焦点与微信、豆包、WorkBuddy 等外部输入框仍待独立测试。应用界面支持中文与 English；新建、展开和日历窗口右上角可直接切换语言及日间／夜间外观，设置内可恢复跟随系统。上方七种语言链接提供 **README 文档翻译**，不表示应用支持七种界面语言。

## 反馈

通过 [Issues](https://github.com/NocodeMrLi/thoughtline/issues) 报告问题或建议。请附系统与应用版本、复现步骤、预期／实际结果及经过脱敏的截图或日志；不要上传真实念头或个人数据。

Star 与下载徽章更新于 2026-10-09；下载数统计发布资产下载次数，代表 API 快照。

<a id="license"></a>
## 许可与致谢

当前项目为 `UNLICENSED`，尚未授予开源使用许可。未来公开发布时将另行明确许可证与贡献方式。第三方代码及许可证见 [第三方声明](THIRD_PARTY_NOTICES.md)。
