# P6 actual-package fix2 独立限定复核

## 范围与冻结输入

- 基线 `main` / `9a862b7e6734d8b453f45e8130ebe7677f046459`；只复核 `tests/electron/package-acceptance.cjs` 一行工作树改动。
- 已完整读取 `p6-package-fix2-brief.md`、`p6-package-fix2-report.md` 和 `p6-package-fix2-scoped.diff`。后者为 6299 bytes，SHA-256 `a8348edefe6300dd2712f995c41133e8a15a7ce17b26204046eca94c15ee82f0`。实时 `git diff` 也只有该行测试输入变化。
- 此复核未改源文件、测试、产品文档；未重跑整套验证、原生物理验收或实际包 fixture。

## 独立结论

**Spec：PASS（限定修复）。Quality：PASS（限定修复）。** 无新增 diff breakage 或需修复的问题。该结论只批准修正后的测试输入进入下一次精确源码冻结与实际包验证；不表示旧 `9a862b7` DMG、重建 DMG、Windows 实机或双端物理验收通过。

| 要求 | 结论 | 证据 |
| --- | --- | --- |
| 修复 Electron `evaluate` 上下文中的 `require` 错误 | ADDRESSED | 失败的 mounted-DMG 收据在第 29 行给出 `ReferenceError: require is not defined`；该行现用 `app.evaluate(({dialog},target)=>{dialog.showOpenDialog=...},backupParent)`。`src/main/index.ts` 的备份 IPC 正调用同一 Electron `dialog.showOpenDialog`。 |
| 新回调实际可用、导出真实备份 | ADDRESSED（隔离源码验证） | attempt1 旧回调 RED，后因源码 Electron 的版本 `44.7.0` 与打包版本断言不符而退出 1；attempt2 旧回调 RED、新回调 GREEN，`exportBackup()` 成功，JSON 收据记录 stub 恢复、正常关闭、5 个自有 PID 退出及临时根目录消失。修复报告称 probe 检查了 manifest 修订号、文件大小和 SHA；保留的简要 log/JSON 未逐项列出这些值，因此独立可见证据只支持导出成功与收尾状态。正式包脚本的 `manifest.appVersion === packageInfo.version` 仍严格保留。 |
| 无其他同类 evaluate 回调错误 | ADDRESSED | 完整测试文件中四处 `app.evaluate`：其他三处只使用注入的 `app` 或 `BrowserWindow`，没有 `require`。 |
| 保留严格包断言 | ADDRESSED | package version、schema2→3 原文/ID/创建时间/draft、编辑及关闭刷盘、重启后的正文/ID/元数据/draft、calendar 搜索/软删/恢复、manifest revision/name/size/SHA、`COPYFILE_EXCL`、两次实际恢复启动与完整 snapshot deepEqual、`completedChecks` 后正常退出/PID/目录清理共同决定 `passed`，均在未改行保持原样。 |
| 新实际包最终验收 | NOT ADDRESSED（后续 gate） | 旧 `9a862b7` mounted DMG 的 fixture 在备份前失败，`passed:false`；该旧包仍不获批准。新源码冻结、双端重建和完整 actual-package fixture 尚未在本次复核发生。 |

## 验证与质量判定

`node --check tests/electron/package-acceptance.cjs`、`git diff --check` 和 `../../package.json` 解析均退出 0；解析版本为 `0.0.17-preview.2`。原 mounted-DMG 失败收据记录前四项检查通过，并由独立 cleanup 收据确认 10 个自有 PID 退出、正常关闭及目录 `ENOENT`。审查未发现同一行变化引入范围扩大、生产行为变化或断言放松；一行使用 Playwright 注入对象的方式与同文件其他 `evaluate` 回调一致。

复核最终输入：`p6-package-fix2-scoped.diff` SHA-256 如上；源码基线与唯一改动如上。后续必须在新精确源码 SHA 的实际重建 App 上重新运行完整包验收，且物理双端验收单独记录。
