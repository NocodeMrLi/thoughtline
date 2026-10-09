# Windows 旧图标功能预检与实机入口

本轮已绕开对新图标素材的依赖，完成 Windows x64 功能预检准备；**0.0.16-preview.5 沿用旧图标，不是最终 v11 图标交付包**。生产源码/素材与 `4400f73d430256b5731840610b9f0ccfcd0b8147` 相同；打包冻结 `7a76da608a77332d0260a45f53ff20915c0305d0`，私有分支 `codex/thoughtline-windows-preflight-20261009`。

[Windows CI 37888897337](https://github.com/NocodeMrLi/thoughtline/actions/runs/37888897337) 成功：106 项 Windows 单测、类型/构建、NSIS、安装版版本/x64/default profile/隐藏挂绳、同 profile 单实例、保存并正常退出、ASAR 主进程/preload/HTML/旧图标一致，以及当前用户安装/同版本重装/普通卸载的合成数据保留。隔离脚本语法与 CheckOnly 通过，实际用户隔离启动仍待实机。首轮 ASAR 路径脚本失败已修复，原日志保留，没有将部分通过冒充整体通过。

普通升级/卸载保持 `%APPDATA%\Thoughtline`；但 assisted 向导允许当前用户或所有用户选项，本轮只测当前用户。卸载器显式 `--delete-app-data` 可删除默认 profile，本轮不传该参数。相同 appId 可能替换原安装；隔离笔记目录不等于并排安装两个版本。`.15` 与本轮 schema/校验/存储代码完全相同，实际旧版升级/降级仍需用户用备份副本验证。

App 和安装器均 `NotSigned`，SmartScreen/SAC/企业策略仍可能拦截。需先备份全部已退出数据、保留旧包，再按清单安装且取消完成页自动运行，用隔离脚本启动。正常退出等待保存，但 Windows 注销/关机、强退/断电、未 ACK 尾部和未提交编辑不能承诺零丢失。没有系统安全设置更改、main 合并、release 发布或自动更新。

从 CI 的 Artifacts 下载 `Thoughtline-Windows-x64-7a76da608a77332d0260a45f53ff20915c0305d0`（私有登录、30 天保留），解压 exe/清单/manifest/两份 runner JSON/隔离脚本，核 hash 后再安装。准确安装器 hash 与本机独立下载记录见下列完整报告。

- [实机操作清单、备份及回滚](证据/Windows功能预检-20261009/docs/WINDOWS-ACCEPTANCE-20261009.md)
- [完整阶段报告及准确 hash](证据/Windows功能预检-20261009/acceptance/WINDOWS-PREFLIGHT-20261009.md)
- [后续交接](证据/Windows功能预检-20261009/docs/WINDOWS-PREFLIGHT-HANDOFF-20261009.md)
- [准确 CI 记录](证据/Windows功能预检-20261009/acceptance/evidence/windows-preflight/final-run.json)

物理 Windows IME/Ctrl+Enter/焦点/穿透、Windows10/11/ARM64/缩放多屏、真实 Agent/G7、旧版升级/回滚和完整体感仍未验，`formalAcceptance=false`。最终 v11 素材 Library→Mac 403 继续由另线程处理；下一最终图标包取得批准原件后需新 preview 版本及新冻结 CI/hash。本轮私有阶段提交推送后即可让用户下载旧图标预检包实机测试。
