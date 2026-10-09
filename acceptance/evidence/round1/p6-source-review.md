# P6 source/build/testing/delivery 独立任务审查

审查对象：`fa45cb88105db81806e419bba5d8029af9540389` 上的未提交 P6 工作输入；`p6-source-working.diff` 为 67,840 字节，含 tracked 与新增输入。此时不是冻结提交、实际双端包或发布验收。本报告只读审查，不改实现、index、HEAD；父负责修复与最终提交。两轴按 Spec 与 Quality/Standards 分列。

## Spec

### S1 [P2] Mac 构建来源只在构建前取样，无法排除构建期间输入漂移

- 文件/行：`scripts/package-mac.cjs:18-19,33,63-70`；`scripts/source-input-vector.cjs:24-30`。
- 前置与复现：从干净提交启动 `package:mac`；在 electron-vite/build 或 builder 运行期间修改一个纳入向量的 `src`/`assets`/`package.json` 文件，随后让构建完成。源向量只在第 18 行取一次，构建、签名、`out/assets` 哈希及 manifest 写入后没有第二次核对；后续修改是否被实际构建读取取决于时序。无需触碰用户安装或数据即可由此路径产生来源不确定性。
- 预期：若构建过程中生产/构建/验证输入变化，则停止、留失败证据，不能以开始时的 `headSha/vectorSha256` 声称实际包来源。
- 实际：脚本可能成功写入 `actualMacBuildSource: inputVector.headSha` 与开始时的向量；后验 `out/assets` 哈希无法证明构建时读取的是开始时的源码。当前尚无 P6 包，因此这是可复现的竞态风险，未宣称已有错误包。
- 证据：`package-mac.cjs` 仅一次 `sourceInputVector()`；工作树目前未提交，直接调用向量器会正确拒绝，报 `Production or build inputs are not frozen: ...`。修复门槛是冻结后在构建末尾重采样并比较完整 canonical Git 向量及本机 raw SHA，或等价地确保独占不可变构建输入。

### S2 [P2] 失败证据会被同名重跑覆盖

- 文件/行：`tests/electron/windows-source-runtime.cjs:10,56,67`；`tests/electron/package-acceptance.cjs:22,27,38-39`；`.github/workflows/test-packages.yml:25-30`。
- 前置与复现：在同一 evidence 目录连续运行 `windows-source-runtime.cjs`，或一次 `package-acceptance.cjs` 失败后用同一 `THOUGHTLINE_EVIDENCE_DIR` 重跑。Windows 测试虽接收 `THOUGHTLINE_ATTEMPT=windows-ci`，新脚本没有使用该变量；包验收也对 screenshot、结果和 cleanup JSON 使用固定文件名。
- 预期：每次 attempt 的失败 JSON、截图和 cleanup 原字节保留；后续成功使用新目录或带 attempt 的文件名。
- 实际：`source-shelf.png`、`source-key-events.json`、`package-acceptance.json`、`package-acceptance-cleanup.json` 以默认覆盖写入，重跑会抹掉前次证据。CI 的 artifact 名含 `run_attempt`，但不修复同一工作目录和本地包验收的覆盖问题；目前未执行包验收。
- 证据：固定 `path.join(evidence, ...)` 和 `fs.writeFile`，未使用 `wx` 或新 attempt 子目录；已有 `acceptance/evidence/round1/p6-windows-source/source-shelf.png` 与 `source-key-events.json`，审查没有重跑覆盖它们。

## Quality / Standards

### Q1 [P2] 故障注入失败路径未先恢复，再进入正常关闭

- 文件/行：`tests/electron/inline-edit-workflow.cjs:8-10`；对照 `tests/electron/storage-workflow.cjs:47-49`。
- 前置与复现：在第 8 行设 `globalThis.round1FailSave=true` 后，让保存错误提示、close 拒绝或编辑器仍在等任一断言失败。控制流立即进入第 10 行 `finally`，此时只在第 8 行成功路径后段才会执行 `round1FailSave=false`。
- 预期：`finally` 无论断言结果都先撤销本测试注入的保存故障，再尝试应用正常 close；记录失败原因、PID、stat 和 cleanup 状态，若关闭仍不成则保留夹具。
- 实际：`app.close()` 在故障仍生效时执行；若关闭路径需要保存，正常退出可能被阻止或超时。其后 `cleanupIdleFixture`/cleanup JSON 也可能不执行。当前是控制流静态证明，未故意在真实 Electron 里造成挂起；正常成功路径的既有 Mac 运行不能覆盖这个失败路径。
- 证据：第 8 行 `round1FailSave=false` 位于所有故障态断言后；第 10 行 `finally` 没有复位。`storage-workflow.cjs:48` 已在 `finally` 先清除同类注入，说明修复可保持现有测试边界。

### Q2 [P3] 关键证据在最后一步失败时仍可标记 `passed:true`

- 文件/行：`tests/electron/windows-source-runtime.cjs:52-56,67-70`；`tests/electron/package-acceptance.cjs:30-39`。
- 前置与复现：使 source key test 的最后 screenshot 写入失败；或使 packaged acceptance 在 `result.passed=true` 后的关闭/清理失败（只用测试自有目录）。
- 预期：最终证据的 `passed` 仅在截图、正常退出和 PID/目录核实完成后为 true，失败留下明确阶段状态。
- 实际：这两处在最终证据/清理之前置 true。进程退出码仍会失败，但独立读取的 JSON 可同时显示 `passed:true` 与失败/缺失的 cleanup，容易误判。未执行注入复现。
- 证据：源码赋值和 finally 写证据顺序如上。

## 已核实的输入与验证边界

- `package.json`、lock、Windows 严格 FileVersion 检查与独立目录均写 `0.0.17-preview.2`；`preview.1` 入口保留在 `docs/delivery/archive`。旧 P5 Windows runner 成功日志仅对应 `fa45cb8...` 的 preview.1，不能复用为 P6。
- `source-input-vector.cjs:5-6` 的范围纳入 `vitest.config.ts`、`electron.vite*`、`.github`、`docs/delivery`、`assets`、`scripts`、`tests`、`licenses`、package/lock、`acceptance/evidence/icon-final/resource-verification.json` 及 Mac cache 审计 JSON；与当前 package/CI/Windows manifest 实际显式读取输入对照未发现遗漏。`vectorSha256` 由 Git mode/blob 计算，`worktreeSha256` 另记磁盘原始 SHA；Windows 行尾变化应比较前者，不能把 raw 差异直接判为源码不同。当前向量器正确拒绝未提交工作树。
- 本地 `app-builder-lib/out/electron/ElectronFramework.js:166-175,200-202` 确认 `electronDist` 的 `.zip` 文件路径由 builder 原生解压，不需要额外下载；`package-mac.cjs` 的审计字段、固定 ZIP SHA 和严格 built App/DMG 内 App 签名校验仍在。该核对只确认配置路径语义，不等于实际 Mac 包成功。
- Windows CI 四个 source Electron 用例已接入，runner OS/arch/release 由运行时采集；注册、剪贴板和键盘事件仍为受控模拟，不能当物理 Windows IME/DPI/多屏/焦点或三接收端验收。Mac launcher 生成器固定版本/交付目录，挂载后核版本、签名并写入实际 DMG/asar SHA；实际最终 `.command` 只能在最终 DMG 存在后验证。
- 本次限定命令：Node `v24.19.0` PATH 下 `node --check` 对三个新增 JS 文件退出 0；`git diff --check` 退出 0；`sourceInputVector()` 在未提交 WIP 上按设计拒绝；本地 builder 代码确认 ZIP 参数语义。没有重复已完成的全量 verify/source Electron，也没有提前打包。审查没有启动或结束任何 Electron PID、没有创建 fixture 或 mount，因而无本次 PID/stat 清理项。未运行物理 Windows、真实 IME/接收端、Mac DMG、包验收、签名或最终发布验证。

本轴结论：Spec 2 项（最高 P2）；Quality/Standards 2 项（最高 P2）。修复后需只重验受影响路径，再交父做全分支独立审查；当前不称源冻结门禁或包门禁通过。

## fix1 限定再审（2026-10-09）

范围是 `p6-fix1.diff`（32,369 字节）所示的五处文件改动与未改的 `source-input-vector.cjs` 输入定义；只复核 S1/S2/Q1 和相邻 Q2。未重跑全量、Mac 包或 Electron fixture。上文为 fix1 前的发现，以下是当前结论。

| 原发现 | fix1 结论 | 精确依据与边界 |
| --- | --- | --- |
| S1 [P2] 构建期间来源漂移 | **ADDRESSED（源码门禁）** | `scripts/package-mac.cjs:70-82` 在 build、builder、两次严格签名、DMG/out/assets/asar 哈希后重新调用完整 `sourceInputVector()`，`deepStrictEqual` 比较 head、canonical Git mode/blob、raw SHA 与文件记录；失败用 `wx` 唯一名写 `dist/mac-source-freeze-failed-<time>-<PID>.json`，含阶段、初始/观察向量、错误、`outputNotApproved:true`，随后非零退出，且成功 manifest 在检查之后才写。当前尚无 P6 DMG，未执行真实 post-build guard；这只是源码关闭判断。构建期间文件短暂改动又在终检前恢复的极端竞态不由两次取样证明，但不构成本轮可操作的新增缺陷。 |
| S2 [P2] 同名重跑覆盖 | **ADDRESSED** | `.github/workflows/test-packages.yml:27-34` 为每次 CI 建 run ID/run attempt/GUID 目录，日志和三项旧测试写入其内；`tests/electron/windows-source-runtime.cjs:10-19` 再建 `source-attempt-*`，`tests/electron/package-acceptance.cjs:5-12` 建 `package-attempt-*`。相同 attempt 标签的两次 source probe 目录分别为 `source-attempt-lFJpSs`、`source-attempt-s3d8Os`，两次不存在可执行文件的 package probe 分别为 `package-attempt-CsWpkQ`、`package-attempt-QLgh2Z`，各有独立失败 JSON/cleanup；旧 P6 截图未被本次再审覆盖。 |
| Q1 [P2] 注入未复位即关闭 | **ADDRESSED（源码和限定负向 probe）** | `tests/electron/inline-edit-workflow.cjs:10-28` 的 `finally` 先采自有 PID，复位 `round1FailSave`，结束合成 composition，再请求正常 Manage close、`app.close()`，确认 PID 退出后删自有临时目录；失败留 `failedStage`/`cleanupError`、PID 和目录状态。`inline-fault/inline-cleanup-p6-fault-1.json` 记录受控异常、`injectionCleared=true`、`manageCloseOk=true`、`normalClose=true`、6 PID `allExited=true`、临时目录已删；正常 probe 也记录 6 PID 正常退出。该负向 probe 在故障开关开启后立刻抛错，没有实测“脏正文＋合成中＋保存失败”同时存在的退出路径；源码已按顺序处理，该组合仍属后续受影响验证边界。 |
| Q2 [P3] 过早 `passed:true` | **ADDRESSED（源码及限定证据）** | `windows-source-runtime.cjs:59-81` 在截图后置 `completedChecks`，正常 close、`cleanupIdleFixture` 和目录 stat 完成后才令 `passed=true`；`package-acceptance.cjs:31-40` 同样在全部业务检查和 cleanup 成功后置 true。两份 source probe 最终 JSON 为 `passed:true` 且 cleanup 成功；两份故意不存在可执行文件的 package probe 为 `passed:false`，错误与 cleanup 同在。真实冻结 App 的成功路径未运行。 |

本次只读核验：`p6-fix1.diff` 实际有五个 `diff --git` 文件段；四个受影响 JS 用 Node `v24.19.0` `node --check` 退出 0，所触及 tracked 文件 `git diff --check` 退出 0。读取六次 probe 的 JSON 和对应日志；对其 22 个记录 PID 执行只读 `ps` 未见存活进程，六个测试临时目录逐一做存在性检查均不存在。没有运行新 fixture、没有删除或修改数据。未见 fix1 范围内新引入的阻断缺陷；Windows runner、真实 Mac 包、物理输入/接收端、最终签名/manifest 与发布仍未验证。此再审不替代父的全分支审查或后续包门禁。
