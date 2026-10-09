# Thoughtline 0.0.16-preview.6 私有测试预发布

双端更新批准的红夹 TL 图标、480×260 紧凑输入窗、名称编辑提示、内联项目/Agent，以及草稿组合输入和延迟提交续作保护。挂绳/分组/全文/管理功能保留，无常驻主窗口；G7 全屏探测仍是独立实验，未集成。

架构：macOS Apple Silicon arm64 DMG；Windows x64 NSIS。没有 Intel Mac、原生 Windows ARM64 或 x86 包，也没有自动更新。

tag 对应本轮 main 发布提交。release-manifest.json 记录准确提交、双端文件 SHA256 和来源；Windows复用已独立QA的 run37893774452/source aa23b210ce26de956f88c48851dc1681ab233f6b 产物，发布前严格要求最终main的全部生产打包输入与该源码一致。macOS构建来源723356385af5518cddae65d2ae023707a0c804b6，最终main生产打包输入与该来源精确一致；已核对盘内App的资源签名、全部编译输出与图标，以及隔离启动、编辑取消/保存/重启、草稿保持。

Mac102unit/4Windows-only跳过、类型/构建及本地20项合成组合输入/4项延迟续作检查已通过；Windows106unit、类型/构建、实际App启动/单实例/保存正常退出、安装/同版本重装/普通卸载合成数据保持、App/installer/uninstaller批准图标7帧嵌入和ASAR检查通过。独立QA复算Windows installer hash、版本/PE/manifest/合成快照绑定通过。CtrlEnter目前仅逻辑单测；Mac合成DOM/IPC不等于物理IME。

Mac是ad-hoc完整资源签名，未提供Developer ID或Apple公证；Windows App/installer为NotSigned。Gatekeeper、SmartScreen/SAC或企业策略可能阻止运行；记录原文并停止受阻项，不关闭安全机制、不修改执行策略或移除隔离属性。

升级/覆盖前退出旧App，备份整个默认数据目录：Mac ~/Library/Application Support/Thoughtline，Windows %APPDATA%\Thoughtline；保留旧包。相同appId可能替换旧安装，数据隔离不等于并排安装身份。用户安装由用户操作，本轮不会替换本机安装版。

Windows先选择仅为我安装、取消完成页运行，再使用附带Start-Thoughtline-Isolated.ps1指定准确.6 executable；隔离数据为%LOCALAPPDATA%\Thoughtline-Preflight\0.0.16-preview.6\user-data。不要在用户机器跑disposable runner的预检脚本。Mac先退出所有Thoughtline后，可对新App执行文件临时指定THOUGHTLINE_DATA_DIR到独立测试目录，只用合成内容。

普通Windows卸载保持默认数据；显式--delete-app-data会删默认profile，本轮不传。自定义数据放在安装目录内不作保留保证。回滚先退出、保存新旧两份完整数据，再普通卸载并装旧包，先对副本隔离验证；不要覆盖唯一新数据。与.15存储格式/代码一致，不代表跨版本升级回滚实机通过。未ACK草稿尾部、未提交编辑、注销/关机、强退/断电不承诺零丢失。

物理IME、CtrlEnter、焦点/热键/空白穿透、真实Agent/G7、图标缓存、Win10/11/多屏缩放、旧版升级回滚仍待用户。formalAcceptance=false。完整Windows清单见仓库docs/WINDOWS-ACCEPTANCE-V11-20261009.md；历史阶段和失败修复证据保留。
