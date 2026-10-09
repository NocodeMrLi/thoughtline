# 0.0.17-preview.3 隔离体验准备

此版本新增中文 / English 与日间 / 夜间偏好，三个首层辅助窗口右上角直接切换；设置提供“跟随系统”。常驻桌面仍只有绳、夹子与纸。语言只改变应用界面，保留念头、标题、项目及自定义 Agent 原文。

偏好独立保存在 profile 的 preferences.json，修改偏好不改写念头快照。全新 profile 按系统语言选择中文或 English；已有念头数据或位置配置的 profile 保持中文。无法读取或保存偏好时保留文件并显示错误。

本文件是新版本交付准备，不代表已生成、签署、上传或发布新安装包。版本 .2 的说明和专用 Windows 启动器保留供回滚。当前通用 Windows 启动器只认 .3 文件版本，使用独立的 .3 数据目录。安装器仍可能替换同应用身份的既有安装，应在独立测试环境安装。Mac 启动器固定命名 `Start-Thoughtline-Isolated-Mac.command`，须在最终 DMG / asar 确定后生成，固定实际哈希并核对严格签名；不修改用户的已安装 App。

自动测试覆盖范围及未测项以 acceptance/evidence/appearance/ 和独立 QA 说明为准。源代码 Electron、合成输入、截图、CI 均不证明物理输入法候选、双端自然滑动手感、DPI、多屏或真实微信 / 豆包 / WorkBuddy 接收通过。新包须分别运行 tests/electron/packaged-appearance.cjs 留存实际可执行文件和 asar 哈希；不得以源码结果替代。
