# 0.0.17-preview.2 私有测试包隔离入口

Windows 安装器只在一次性 CI runner 完成自动安装、同版本重装和普通卸载的数据保全预检。`Start-Thoughtline-Isolated.ps1` 严格检查已安装 `Thoughtline.exe` 的文件版本为 `0.0.17-preview.2`，使用 `%LOCALAPPDATA%/Thoughtline-Preflight/0.0.17-preview.2/user-data`。`-CheckOnly` 不建数据目录、不启动进程。该入口不能阻止安装器使用同一应用身份替换已有安装；请在独立 Windows 测试环境安装。

Mac 的 `启动0.0.17-preview.2隔离体验.command` 在最终 DMG 和包内 `app.asar` 确定后由 `scripts/generate-mac-isolated-launcher.cjs` 生成到最终交付目录。生成器从固定交付目录读取 `Thoughtline-0.0.17-preview.2-mac-arm64.dmg`，挂载只读 DMG，核对版本和严格签名，写入 DMG/asar 的实际 SHA-256。生成的入口只认这一个 DMG 和 asar，以 `THOUGHTLINE_DATA_DIR` 使用交付目录内独立数据。可先以 `--check-only` 核对；默认通过 macOS 正常打开流程启动，不移除隔离标记，也不安装或替换已有 App。

两个入口都只用于私有测试包。源 Electron/CI 结果不能代替 Mac、Windows 的物理输入、显示、焦点或真实接收目标验收。旧 preview.1 Windows 入口保留在 `archive/Start-Thoughtline-Isolated-preview1.ps1`，旧 .15 Mac 入口也保留。
