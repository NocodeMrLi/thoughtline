# Windows 新图标私有候选与验收入口

**0.0.16-preview.6 / Windows x64** 集成批准的红夹 TL v11 图标、组合输入与延迟提交续作保护，区别于旧图标 `.5` 功能预检。整合基线17823b0，批准资产9bc6ef4/清单70c0649已按提交范围cherry-pick；没有合入图标分支旧生产代码。资源质量原始结果见 [34正式图标资源](34-红夹TL正式图标资源与离线验收.md)。

准确打包 source **`aa23b210ce26de956f88c48851dc1681ab233f6b`**；私有分支 `codex/thoughtline-windows-preflight-20261009`，准确 [Windows run37893774452](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452)。后续文档HEAD不作为打包源，准确下载artifact与installer hash见完整报告。当前没有main合并、公开release、自动更新或本机安装替换。

首轮真实发现 Windows checkout 将资产mask JSON转CRLF，严格原字节校验拒绝；用仓库 `.gitattributes assets/** -text` 固定字节，不改全球Git/系统设置。第二轮新PE检查器误把资源组256px的尺寸字节0当成0px，受控PE证明7帧payload全一致仍误拒绝；只规范化标准0→256尺寸，继续逐帧严格hash比对。旧图 `.5` 安装器仍作为反向对照被拒绝。两轮整体失败和红绿证据保留，没有关校验或重画批准图标。

实际包检查覆盖App/installer/uninstaller的PE图标资源，以及ASAR全部编译输出/App与Tray图标、精确App版本/x64、单实例、正常保存退出、安装/重装/普通卸载合成笔记/草稿/备份保留。最终通过结论和下载核验均以报告与原始JSON为准。Mac102unit/4Windows-only跳过、类型/构建已通过，Mac本轮没有native启动；安装版、开发区进程和真笔记未动。

App/installer未签名，SmartScreen/SAC/企业策略可能受阻；无需关闭安全机制。先退出并完整备份 `%APPDATA%\Thoughtline`、保留旧 `.15` 包，安装完成页取消自动运行，再用artifact内隔离脚本指定精确 `.6` 文件，笔记写到 `%LOCALAPPDATA%\Thoughtline-Preflight\0.0.16-preview.6\user-data`。隔离数据不等于并排安装身份，相同appId可能替换旧版。普通卸载保留；显式 `--delete-app-data` 可删除默认profile，本轮不传。

- [完整交付、失败过程、准确artifact/hash](证据/Windows新图标候选-20261009/acceptance/WINDOWS-V11-DELIVERY-20261009.md)
- [Windows实机清单、隔离入口、备份和回滚](证据/Windows新图标候选-20261009/docs/WINDOWS-ACCEPTANCE-V11-20261009.md)
- [独立QA固定入口](证据/Windows新图标候选-20261009/acceptance/WINDOWS-V11-QA-HANDOFF-20261009.md)

物理中文IME/CtrlEnter/焦点/穿透、Win10/11/ARM64/多屏缩放、真实Agent/G7、旧版升级降级、OS图标缓存/真实托盘视觉与完整体感仍待用户实机，formalAcceptance=false。独立最终整合只读QA已完成，无交付阻挡，可进入Windows隔离实测；物理设备验收未完成。正常退出等待保存，但注销/关机、未ACK尾部/未提交编辑、断电或强退不能承诺零丢失；回滚先保留新旧两份数据，旧 `.15` 缺新增量保护。

最终run **37893774452 success**；[artifact11598913007](https://github.com/NocodeMrLi/thoughtline/actions/runs/37893774452/artifacts/11598913007)，名称 `Thoughtline-Windows-x64-aa23b210ce26de956f88c48851dc1681ab233f6b`，至2026-11-08 06:31:52 UTC有效。installer `Thoughtline-0.0.16-preview.6-win-x64.exe`，SHA256 `545bac65d545578653ca031861b98080d4e6ea46c94db51cd493565734289266`，下载核验与三份passed原始报告已同步。CtrlEnter本run只单测逻辑，没有安装版Composer键盘端到端；物理Windows仍待验。

[独立最终QA报告](证据/Windows新图标候选-20261009/acceptance/evidence/windows-v11/independent-qa/INDEPENDENT-WINDOWS-DELIVERY-QA.md)与原始receipt已同步。独立复算installer hash、PE7帧/版本、manifest/源码/编译hash/隔离入口，以及重建合成snapshot/bak/marker的hash均匹配，无交付阻挡。打包包与源码保持不变，没有重构建或native/安装/系统改变。
