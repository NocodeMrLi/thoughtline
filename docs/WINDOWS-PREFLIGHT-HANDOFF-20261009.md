# Windows 预检准确交接

独立工作树 `/Users/lihongwei/Documents/Codex/2026-10-09/task-7/thoughtline-windows-preflight`，私有分支 `codex/thoughtline-windows-preflight-20261009`。基线交接 `ac26ab3e6ca05696f8d10c097c3ac501a3cf3c26`，生产 source `4400f73d430256b5731840610b9f0ccfcd0b8147`；本轮所有 src/assets 与该 source 相同。最终打包冻结 `7a76da608a77332d0260a45f53ff20915c0305d0`、版本 `0.0.16-preview.5`、旧图标功能预检，v11 403 原材仍由另线程处理，未重画/绕过。

完整结果、失败过程与 installer hash 见 [阶段报告](../acceptance/WINDOWS-PREFLIGHT-20261009.md)；[用户 Windows 验收/备份/回滚清单](WINDOWS-ACCEPTANCE-20261009.md) 和 [隔离启动脚本](delivery/Start-Thoughtline-Isolated.ps1) 已保存。数据契约/存储与 `.15` 逐字节一致，不是实际升级/降级证明。普通卸载保留，但显式 `--delete-app-data` 可删默认 profile；本轮不传该参数。

首轮 run37888408557/3747140 整体失败：已有包运行/单实例/保存成功，新增 ASAR `/` 路径检查错误；修复成平台原生路径后 run37888897337，对准确7a76da6检查。首轮 JSON 和失败日志保留，不扩大部分通过。后续若只改报告/证据，CI 准确 head 仍7a76da6，不把后续文档 HEAD 称已打包。

最终 run37888897337 **成功**：Windows Server2025 runner 106unit/25文件、类型/构建、NSIS、实际当前用户安装/同版本重装/普通卸载保留、单实例、保存/正常退出、包字节比对、隔离脚本语法/CheckOnly均通过。Mac 独立下载 installer SHA256 `07da3119a9931c469b1a3aa42129c08dc79cc4d1b92bcab53bfdfbcc3234e982` 与 CI 清单一致；manifest/两份实际预检 JSON 的 headSha 均为7a76da6。下载包保留在 `/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.5`，artifact11597516717 在2026-11-08过期；不重复复制安装器到笔记目录。

Mac 无新 native 启动，不终止安装版或原开发区 Electron；原工作树 HEAD ac26ab3、status 干净。新测试只在一次性 Windows runner 合成目录安装/卸载；不能在用户机运行 `scripts/windows-*preflight`，用户只用交付隔离启动脚本/清单。依赖链接借用原 node_modules，不清正常依赖/原包/真笔记/他人文件。

已授权本轮私有分支 commit/push；未 main 合并/release/自动更新/本机安装/更改系统权限。实机 Windows10/11/ARM64/多屏缩放、物理 IME/焦点/穿透、真实 Agent/G7、旧版升级/回滚仍待用户实机，`formalAcceptance=false`。后续最终图标包取得批准原材后集成并选择新 preview 版本、冻结新打包 SHA 和 hash，重新核 CI；本旧图标包不能升级成最终 v11 交付声明。
