# Thoughtline 0.0.13 独立静态增补

生产固定提交 `dee1f2c9046b284e2dd430632d9bdb913128c868`，证据提交 `6ae06a2e8dc55c11cc37d1d99128c374eeb7e74d`。已直接从 GitHub fetch并核验远端分支；两提交的 `src/tests/scripts/package.json/package-lock.json/.github` 无差异。QA仍保留自己的0.0.11 checkout，不改生产源码，没有启动Electron、原生窗口或性能测量，没有占用构建者G7时段。

**Q7静态结案；未发现此小补丁新的生产问题。0.0.13完整原生/冻结包验收没有独立放行。**

## Q7修复与测试可靠性

- manage实际show/hide事件都调用 `refreshTray()`，关闭设置时能重建启用的“写念头”菜单。
- 四处browse/detail/settings模式切换在show/focus后显式刷新；覆盖同一个已显示窗口不再次发show事件的情况。
- 新测试等待 `openSettings`、`saveSettings`、`closeManage` 的IPC返回，关闭后再await主进程解锁；检查菜单启用后调用实际native Menu回调，并等待composer可见/输入焦点。它不是旧“操作前不变性已经成立”的假阳性模式，也没有将物理菜单点击称为通过。
- 独立受控实验执行本提交实际 `refreshTray`、`hideManage`、manage show/hide回调：设置打开禁用，保存维持禁用，隐藏重新启用，菜单回调调用openComposer；可见窗口browse/settings转换的刷新也通过。见 [脚本](qa-0.0.13-static/tray-state-extraction.cjs)、[结果](qa-0.0.13-static/tray-state-extraction.json)。仅用Menu/window适配器，未启动Electron；计时释放回调未执行，不把它称为原生生命周期验收。

## 绑定与证据

| 项目 | 独立结论 | 范围 |
| --- | --- | --- |
| GitHub准确提交与版本 | 通过 | dee1f2c生产、6ae06a2报告、package/lock均0.0.13 |
| 生产与报告提交代码一致 | 通过 | src/tests/scripts/package/.github diff为空 |
| Windows CI | 通过 | [37822783883](https://github.com/NocodeMrLi/thoughtline/actions/runs/37822783883)准确dee1f2c，success；Node24.19.0，17文件/65单测、类型/构建和打包；不是Windows真机运行 |
| 构建者7组源协议、新包workflow/字节/签名 | 已审阅声明绑定，未独立复跑 | 不扩大为QA原生或物理系统验收 |
| 新包空闲指标 | 样本算术核验通过，未独立测量 | 120.188秒，稳定PID集合，CPU0.1913668586%，RSS303.171875MiB；与报告一致；exit0/清理由构建者日志与报告声明 |
| 旧独立0.0.11报告归档 | 原文逐字节一致、范围正确 | 不继承到0.0.13；原文相对链接有下述P3可移植性说明 |
| G7、物理IME/焦点/Windows/Agent等 | 未测/未放行 | 新G7原型为另一个阶段 |

相关证据在 `qa-0.0.13-static/`：[CI元数据](qa-0.0.13-static/windows-ci-metadata.json)、[CI日志](qa-0.0.13-static/windows-ci.log)、[远端SHA](qa-0.0.13-static/github-remote-ref.txt)、[差异](qa-0.0.13-static/reviewed.diff)、[构建者总表原件](qa-0.0.13-static/builder-final-verification.json)、[性能样本算术核验](qa-0.0.13-static/builder-idle-arithmetic.json)。没有复制/挂载/运行0.0.13包，因此包哈希、codesign、安装程序checksum与五个compiled输出一致性仍属于构建者本轮证据，不能沿用QA对0.0.11包的独立验证。

## P3交付说明：历史报告相对链接

6ae06a2将独立0.0.11报告原文归档，哈希与本地原文完全一致，保留原范围是正确的。但其中27处 `qa-final-evidence/...` 相对链接来自原QA目录，复制到仓库的 `acceptance/evidence/qa-0.0.11/` 后不能直接在仓库页面解析到对应文件。截图文件名还去掉了 `qa-` 前缀。它不影响原始证据真实性或产品行为，属于归档阅读便利性问题。

建议保留原文不改，在归档旁加README/索引，将旧路径映射到已归档文件，并明确未归档日志/脚本仍在原QA本地目录；不要为了可点链接重写历史验收结论。见 [归档绑定记录](qa-0.0.13-static/archive-binding.json)。
