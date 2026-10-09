# P5 独立任务审查

## Spec Compliance

**❌ Issues found：R1 配置目录在验证与实际读取之间失联时仍会创建空库。** 其余本次可核验要求未发现阻断；不签署整体 Spec 通过。

**⚠️ 环境门禁：** 本次审查为 Mac 源码与已有受控证据审查；没有运行 Windows runner、物理权限/断盘/断电、真实 IME、最终安装包或真人迁移。Windows 相关结果仅静态核验，不能替代后续 CI/实机。全局 compaction hook 的目录 missing 已由父记录，未重建。

审查范围：base `57a93230ab1015d36ad7e8ecf2c5d7de357d7da3` 的冻结工作树包 `p5-storage-working.diff`，包含未跟踪 src/tests；空 commit range 的等价审查，不伪称已提交。已读取 review brief、implementation brief、implementation report、上级 AGENTS、ROUND1-REPAIR 和 task-reviewer 模板。未改生产/测试实现、未运行 Git 变更、未提交、未另派 reviewer。

## Strengths / 通过的具体检查

- `storageLocations.ts:35–40` 对已经失联/损坏/未知版本 config、空 configured 目录拒绝读取；默认无 config 才走 profile。`index.ts:36–48` 把 profile 与实际 dataDir 分开，恢复对话框提供 folder/retry/exit。
- `storageLocations.ts:21–23,43–58` 拒绝非绝对路径、目录/文件链接、同 realpath 和非空目标，COPYFILE_EXCL、逐项 size/SHA256、完整 snapshot deep equality、实际 FileRepository.load 与 fsync 均在 commitLocation 前；清理逐项复核内容，不盲删异变文件。
- `index.ts:245–265` 先设置 storageBusy，再在 mutation queue 外 prepareViews；在 queue 内 flush 并读取当时最新 snapshot；成功才替换预备好的 repository/dataDir，备份不切换位置。检查被 diff 截断的 prepareViews、composerWrite、保存调用点确认不存在本次引入的队列互等；`index.ts:268–278` 设置保存合并现有 settings，保留 calendarBounds。
- `storageLocations.ts:63–78` 独立 backup 子目录与 manifest；恢复拒绝 traversal/重复/未知文件，校验 SHA256/size/revision/schema 后复制至空目录并真实加载。没有新增恢复 UI；文档明确新位置手工恢复，未把导出成功冒称恢复成功。
- `Settings.tsx:10–16,35–41` 有真实路径/open/change/export，路径更新依赖 info 整体，忙态按钮、取消处理、结果路径及保留旧副本说明；主进程 trusted mainframe 限制和原生 dialog 仅在操作 IPC 后调用。
- `tests/unit/storageLocations.test.ts:11–21` 的中途 EACCES/ENOSPC/ENOENT、sync、disconnect、hash mismatch 不只是断言 ok=false，还检查目标文件、旧 source 内容或位置保持；真实 FileRepository restart 深比较覆盖恢复。`tests/electron/storage-workflow.cjs:13–44` 包含 IME 拒绝、dirty flush、迁移/恢复重启、显示路径和实际导出按钮结果。
- `scripts/windows-installed-preflight.cjs:10–13,35–52` 仍用完整 schema2 seed，完整 schema3 expected 只加指定日期/时区；初读/单实例深比较、首次写前 seedBytes、首写 exact schema2 backup 和重启不覆盖断言保留。`windows-installer-preflight.ps1:12–18` 仅新增 location config SHA，未减少原保全检查。版本保持 .17-preview.1。
- 已读 `verify-final.log`：175 passed / 4 skipped、typecheck/build；`unit-portability-final.log`：12 passed；`typecheck-portability-final.log`；`electron-ui-final.log`：完整受控流程成功。未重复全量验证、Electron 流程、长 idle。日志中 Vitest workers 提示是性能建议，没有发现需归因本任务的失败/警告。

## Issues

### Critical

无。

### Important

**R1 / P1 — configured 启动必须把“禁止创建”约束传到真正的 repository 读取，不能只预检路径。**

位置：`src/main/index.ts:39–42`；关联 `src/main/store/storageLocations.ts:39` 和现有 `src/main/store/repository.ts:10,22–29`。

触发：已有 `data-location.json` 指向含非空数据的目录；`loadStorageDirectory` 检查合法后、`candidate.load()` 读主文件前，目录被移走/磁盘失联，且旧路径的父目录可写。当前 `FileRepository.load()` 把主文件和 bak 的 ENOENT 当成首次使用，`mkdir(recursive:true)` + atomicWrite 创建 revision 0、draft null 的新空库，返回 ok=true；新入口第 42 行因此按加载成功继续，绕过恢复提示。预期是 configured 模式无论检查时序均拒绝创建，保留配置和原副本并进入 recovery。

证据等级：**Node24、真实独立 tmp 磁盘、真实生产模块受控复现，非物理断盘/完整 Electron 复现。** 使用 esbuild 内存 bundle 载入真实 loadStorageDirectory / commitStorageDirectory / FileRepository，操作序列如下：

```js
// 全部路径在自建 mkdtemp('thoughtline-p5-review-') 内。
await mkdir(profile); await mkdir(data);
const old = new FileRepository(data);
const initial = await old.load();
await old.commit({...initial.value, draft: {
  text:'existing nonempty draft', title:'review', project:'', agentId:'general'
}}, initial.value.revision);
await commitStorageDirectory(profile, data);
const location = await loadStorageDirectory(profile); // ok=true
await rename(data, offlinePreserved);                 // 原字节仍保留
const actual = await new FileRepository(location.value).load();
// 实际 ok=true, revision=0, draft=null，并在 data 创建 snapshot.json。
// offlinePreserved 原 draft 仍为 existing nonempty draft；config 字节不变。
```

复现命令 exit0（断言上述缺陷行为成立），PID 50774；目录 `/var/folders/y5/395p0szd7xlcrw4j6slhwxcw0000gn/T/thoughtline-p5-review-ihSvJA`。这证明现在的检查不能保证 brief 的“configured 绝不空库”，且已有 offline 测试只覆盖开始读取之前就失联，未覆盖此时序。

建议：为 repository 读取增加明确 existing-only / allowCreate=false 语义，并让 configured 启动使用它；保留无 config 的首次启动建库。复制校验后的 prepared repository 同样可用 existing-only 防御。不要以再加一次 exists 检查代替底层禁止创建，因为仍会留下相同窗口。增加限定 regression：验证成功后搬走目录或移走主/bak，真正加载必须失败且不创建路径/空快照，config/原数据字节不变；另验证默认首次启动仍能建库。

### Minor

无新增需单独修复项。

## 环境、受控验证与清理

- 所有命令显式 workdir `/Users/lihongwei/Desktop/晾念头 : Thoughtline/app`、`/bin/sh`、login=false；Node 调用 PATH 固定前置 `/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin`。
- 只自建上述一个 Node tmp，无 Electron fixture、新 App、真人 data/install 或旧 PID30628 操作。
- 首次复现 harness 误用内部 `Module._compile` 且 filename 为 undefined，Node 原生断言 `args[1]->IsString()`，**exit134 / PID50764，审查辅助脚本失败**；发生在 mkdtemp 前，无测试目录创建。随后改用 JS Function 执行内存 CommonJS bundle，第二次才获得上面的有效复现。没有把第一次异常算通过，也不是生产 App 异常。完整错误保留在本次工具结果。
- 第二次 finally rm 自有 tmp 后 stat=ENOENT；后续独立 `kill(pid,0)` 对 50764/50774 均 ESRCH，目录再次 stat=ENOENT。工作目录 core/core.50764 均不存在。没有人工 kill 或 app.exit。
- 已读父此前五份 fixture 的 `cleanup-audit.json`（72 distinct PIDs、alivePids=[]、allDirectoriesAbsent=true），没有重复清理或触碰这些 PID。这是已有审计证据，区别于本次 2 个 Node PID 的独立检查。
- 额外读取未改文件的理由：repository.ts/atomicFile.ts 用于核对 prepared-load 是否能写文件、配置 commit 是否在失败后仍安全；index.ts 截断函数用于核对 queue/guard/退出集成。storageLocations.ts 在读模板前已按 brief 直接读过，之后以冻结 diff 为准核对；未因此扩展审查范围。

## Assessment

**Task quality: Needs fixes.** R1 是明确违反 failclosed 数据边界的受控复现，需修复并限定复核。已有迁移、备份、恢复及 Windows 预检修改结构和断言总体符合要求；本报告不升级未测的 Windows/物理/安装包门禁。

## R1 第1轮限定复核（2026-10-09）

**Spec Compliance：✅ 本次 P5 已发现项 R1 已关闭，无开放阻断。Task quality：Approved（源码与受控验证范围）。** 此节更新初审 Needs fixes 结论，不改写原始发现与失败证据；Windows runner、物理磁盘/权限/IME、最终安装包和真人验收仍未通过，范围不升级。

| 原发现 / 相关修复点 | 结论 | 核验依据 |
|---|---|---|
| R1 configured 预检后目录/主备份失联仍会创建空库 | **ADDRESSED** | `repository.ts:9,26–29` 增加可选 allowCreate，false 分支在 mkdir/atomicWrite 之前直接 IO 返回；没有增加另一次可竞态 exists 检查。 |
| 禁止创建策略必须到达真实启动读取 | **ADDRESSED** | `storageLocations.ts:35–40` 在同一次 config 解析结果携带策略：无 config true、有 config false；不依赖 path 是否等于 profile。`index.ts:39–42` 真实 candidate 明确传入该策略，随后错误进入恢复对话框。 |
| prepared repository 同样禁止意外空库 | **ADDRESSED** | `storageLocations.ts:57` 为迁移/导出/恢复共同路径传 allowCreate:false；全快照检查、fsync 和 config commit 先后顺序保留。 |
| 默认首次启动仍正常创建 | **ADDRESSED** | repository 默认 options={}，只在显式 false 时拒绝；loadStorageLocation 无 config 返回 true。`repository.test.ts:76–82` 对同一缺失目录先严格加载失败、再默认加载成功并核对落盘完整值。 |
| 精确回归与新变更是否削弱保护 | **ADDRESSED / 无新增阻断** | `storageLocations.test.ts:23–32` 两个时序分别移走整目录、主+bak，验证不创建目录/空文件、原配置及两份原字节保持；`storage-startup-race.cjs:11–16` 在预检后的第二次 snapshot 读取前 rename，真实生产启动进入 recovery，确认 reads=2、未建目录、主/bak/config 原文保持并自然退出。 |

复核证据：读取 `r1-unit-red.log` 的 3 个真实失败（旧实现得到 ok=true），`r1-unit-green.log` 的 25 passed，`r1-typecheck.log`、`r1-build.log`，以及 `r1-startup-green.log` 的真实 exitCode=0/normalExit=true。没有重新运行全量、旧 Electron 工作流或另起复现，因为新增精确证据已回答原疑点。

清理证据：新 Electron 测试在正常 exit 后调用 cleanupIdleFixture，再 stat ENOENT；异常路径保留 fixture、不强杀，见 `storage-startup-race.cjs:13,17–19`。已读取 `r1-startup-cleanup.json` 和 `r1-cleanup-audit.json`，记录 fixture `thoughtline-p5-r1-startup-1NCdJG`、PID51302/51304 均退出、目录不存在。本次限定复核未启动进程、未造 tmp、未再次操作这些 PID；这里是已读审计证据，不冒称新一次 OS 检查。

本次只读取 R1 的 repository、storageLocations、main 接入、新增 unit/启动 race 脚本及证据，并追加此报告；未改实现、测试、Git/安装状态，未提交，未另派 reviewer。
