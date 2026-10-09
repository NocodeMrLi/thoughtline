# P5 存储实施记录

## 计划与边界
1. 纯存储模块真实临时磁盘 RED/GREEN：位置配置、迁移、独立备份、恢复及故障回退。
2. 主进程可信 IPC / mutation queue / startup failclosed，设置入口。
3. Windows schema2→3 strict 预检，source Electron 隔离完整工作流与正常退出清理。
4. typecheck/build/unit、文档与证据核对，交父独立审查，不 commit/push。

所有数据仅本任务自建 tmp；不触碰真实目录/安装/PID30628。使用父计划与此分工 ledger（planning-with-files）。接手后执行 memory refresh hook，指定笔记目录 missing，未推断其内容。

## 进行中验证记录
- unit-red.log: exit1，缺失实现 stub 触发预期失败。
- unit-green-attempt1.log: 测试exit1，mac临时路径规范化 /var→/private/var 导致路径字符串断言不符（shell尾随cat为0，不算测试通过）。改测 realpath 后 attempt2 exit0，10 tests。
- typecheck-attempt1 exit1：测试adapter copyFile参数过窄；改用系统签名 Parameters；attempt2 exit0。build-attempt1 exit0。
- electron-red exit1：缺失 storageInfo bridge，finally自然关闭并stat清理。
- electron-green-attempt1 exit1：实际切换同revision后Settings路径未更新；修复 effect 在info更新时刷新，而非仅 revision。
- ui-ux-pro-max读取，遵循现有材质/拖动header、键盘/文本label/可换行路径，未引入新视觉系统。

## 实施完成（待父独立 Spec / Quality 审查）

新增 `src/main/store/storageLocations.ts`：位置配置读取、排他复制迁移、独立 manifest 备份与恢复。通过可注入 StorageIO 在真实 tmp 磁盘测试文件权限/失联/容量/同步错误。只接受已存在空目录；realpath 比较（Windows 大小写折叠）；目录本身和文件链接拒绝、文件名白名单、COPYFILE_EXCL；逐文件 SHA256/大小、期望完整快照和实际 FileRepository.load 完成后提交位置配置。旧源文件保持；失败仅删除本次创建且仍可核实 hash/大小的文件，不删除用户文件或校验失败外部改写。恢复模块提供真实 FileRepository 重启能力；没有新增恢复 UI，以文档手动恢复到独立新目录覆盖。

`src/main/index.ts`：profile/userData 保持不变，dataDir/repository 可在成功时替换。配置失联/损坏/未知版本或指向缺少 snapshot/bak 的目录先恢复提示、不创建空库；打开配置目录/重试/退出路径已测。Manage mainframe 可信 IPC storage-info/open/change/export；prepareViews 在队列外，mutation queue 内 flush 和取最新 snapshot；全程 storageBusy 防重复/退出。UI 显示真实路径，按钮触发原生 dialog；受控 fixture 替换 dialog，不新增生产测试入口。不改原地编辑/date/calendar/repository 核心。

设置页补实际路径、打开、更改、导出入口；scroll/resizable 保持现有辅助窗，路径换行、按钮标签/title/focus、状态与失败文本。导出结果完整路径及“当前位置未更改”在真实按钮操作后被断言。业务设置仍使用当前 snapshot 合并保存，calendarBounds 不丢；缓存和位置配置仍留 profile，迁移旧副本保留。

Windows `windows-installed-preflight.cjs` 仍用 schema2 seed；唯一显式 schema3 预期 adds createdDay=2026-10-09 / creationTimeZone=legacy-offset。初读/第二实例完整 deepEqual；保存前原主文件字节仍为 schema2；保存后原 schema2 backup 原字节；真实 packaged 重启再比对完整保存值和 backup 不覆盖。data-location.json seed 指向同默认 profile，验证原字节保全。`windows-installer-preflight.ps1` 仅给 Snapshot-Hashes 增加存在时位置配置 SHA；旧 snapshot*/marker、安装/重装/卸载、签名/PE 图标均保留，版本仍 .17-preview.1。本机仅 node --check 与源码核对，不称执行了 Windows installer/runner。

README 与 docs/ROUND1-DATA-SAFETY.md 已补实际位置、独立备份、手动哈希/空目录恢复、profile配置和旧preview6回滚限制。未覆盖已提交 round1 历史证据；本阶段统一 `acceptance/evidence/round1/p5-storage/`。

## 命令与结果（精确退出码）

全部 workdir `/Users/lihongwei/Desktop/晾念头 : Thoughtline/app`，shell `/bin/sh` login=false，PATH 前置 `/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin`。

| 命令 | 结果 / 证据 |
|---|---|
| `npm test -- tests/unit/storageLocations.test.ts` | stub RED exit1；green-attempt1 测试exit1（realpath断言，shell尾随cat exit0）；green-attempt2 exit0，10 tests。此后新增bak-only/权限与断连/fsync测试随全量覆盖，共12项新测试 |
| `npm run typecheck` | attempt1 exit1（测试adapter签名），attempt2 exit0 |
| `npm run build` | build-attempt1、build-attempt2 exit0 |
| `npm test` | unit-full-attempt1 exit0（173 passed /4 Windows-only skipped，后又新增2项） |
| `npm run verify` | verify-final.log exit0，175 passed /4 Windows-only skipped，typecheck/build均0 |
| `THOUGHTLINE_FAKE_CLIPBOARD=1 THOUGHTLINE_ATTEMPT=red node tests/electron/storage-workflow.cjs` | electron-red.log exit1：旧bridge缺storageInfo，正常关闭/stat清理 |
| 同上 `THOUGHTLINE_ATTEMPT=green1` | electron-green-attempt1.log exit1：切换后路径UI未刷新等待超时，正常关闭/stat清理 |
| 同上 `THOUGHTLINE_ATTEMPT=green2` | electron-green-attempt2.log exit0：实际路径/打开/取消/失败copy保旧位置/迁移restart/独立export/dirty flush/IME拒绝/实际restore两次restart/offline退出 |
| 同上 `THOUGHTLINE_ATTEMPT=final` | electron-final.log exit0：增加混合状态多条顺序及folder→retry恢复链路 |
| `npm run build` | build-ui-final.log exit0：仅最后结果路径footer换行样式 |
| 同上 `THOUGHTLINE_ATTEMPT=ui-final` | electron-ui-final.log exit0：真正点击导出按钮，断言UI结果路径和不换位置；全部业务/恢复链路仍完整执行 |
| `node --check scripts/windows-installed-preflight.cjs` / `node --check tests/electron/storage-workflow.cjs` | 各exit0 |
| `git diff --check` | exit0 |

早期失败不删、不重命名为通过。没有真实资金、真实用户目录、真实用户安装、旧 Electron PID30628 或其他树操作；没有 commit/push。

## 真实恢复与清理证据

纯模块真实恢复使用 manifest 全项校验→新空dir排他复制→FileRepository.load→新实例再load，完整 deepEqual。Electron fixture 从独立导出目录逐项校验 SHA256/size→COPYFILE_EXCL 至新的 restored→独立 restore-profile data-location.json→应用启动两次，完整 deepEqual 全部 Snapshot，包括 ID、正文、日期、状态、顺序、clips/currentId/position、draft/settings/revision。不是只导出hash便声称恢复。另模拟配置磁盘缺失，正常选择退出后无新空库/原配置原字节；再folder→恢复目录→retry真实读取。

每次 finally 先恢复 copy fault、正式 closeManage flush（如窗口存在）、记录全部自有 PID、await Playwright app.close（生产 before-quit），等待 PID 退出后才 cleanupIdleFixture 删除本 fixture root，再 fs.stat 明确 ENOENT，收据包含实际 dir/去重PID/normalClose。无 app.exit、TERM/KILL 或人工强退。startup无窗口退出用实际 app.quit，经child exit0。共5份 cleanup 收据，72个去重PID；额外独立 OS kill(pid,0)/目录存在检查全部退出/无目录，见 cleanup-audit.json。所有自建 source/target/backup/restored/profile/protocol-entry 位于这些root一并清理；截图、失败日志、收据保留。unit临时目录 afterEach rm 后 stat ENOENT。

## 输入冻结与未测边界

生产/测试输入完成，交父独立审查；未自行签署 Spec/Quality。当前仅 Mac source Electron、合成输入/composition/disk fault 和 pure module 实盘临时目录证据。没有 Windows runner实跑、物理 Windows/Mac 权限/离线硬盘/断电/IME、多屏、真实用户迁移、旧安装替换或最终冻结包验收。copy过程中外部改写导致归属无法核实的文件保留诊断；不是承诺每种失败目标都空。备份为操作时快照，不含后续修改；旧schema专用备份仍仅是升级前内容，旧preview6不能直接读schema3。

### 冻结前父静态反馈修正

断连测试的 `/source/` 子串匹配确有 Windows 分隔符缺口；改为 realpath(source)+dirname(path) 的平台原生路径比较。目录链接测试在 Windows 用 junction（其他平台dir symlink），数据文件链接使用无需 symlink 权限的 hardlink，仍验证 nlink 拒绝，未skip业务断言。`npm test -- tests/unit/storageLocations.test.ts` → unit-portability-final.log exit0，12 passed；`npm run typecheck` → typecheck-portability-final.log exit0；git diff --check exit0。没有重复全量/启动App。

恢复文档 Mac 独立启动改正常 `open --env` 路径，Windows JSON说明明确两个反斜杠。生产未变；最后生产构建/电子工作流仍由 build-ui-final/electron-ui-final 支持。

## P5 独立审查 R1 修复（第1轮，待限定复核）

父独立 Spec/Quality 发现真实时序缺陷：loadStorageDirectory 合法后、FileRepository 实际读取前数据目录失联，旧默认允许创建逻辑会生成空库。接受此发现；前述“configured绝不空库”原证据只覆盖预检之前失联，不足覆盖此时序。

限定修改：FileRepository 构造函数增加第三参数 `{allowCreate?:boolean}`，默认保持首次建库；`allowCreate:false` 在主快照和bak都缺失时直接返回IO，位于 mkdir/atomicWrite 之前，不写空快照。旧加载/缓存/备份/commit流程不改。storageLocations 新增 loadStorageLocation 同一次配置解析返回 directory 和 allowCreate：唯独无config为true，有config（即使指向profile本身）为false；原 loadStorageDirectory<string> 作为兼容lookup wrapper。main configured candidate将该策略显式传入实际repo。迁移/备份/恢复 copyVerified 的 prepared repository亦显式 allowCreate:false，不只是再加exists检查。

真实新增回归：loadStorageDirectory成功后分别rename整个source目录、或移走snapshot+bak；真正 existing-only repo.load必须失败，原路径不创建/空目录仍空，配置和离线保留的两文件原字节不变。repository另验证existing-only缺失不建库以及默认首次使用仍建库。新增 tests/electron/storage-startup-race.cjs 用自有protocol-entry替换fs.readFile边界，在预检读取完成后的第二次实际snapshot读取前rename源目录，生产启动真实进入恢复dialog→选退出→app.quit，自然exit0，未创建原路径/空库，config和原主/bak原字节保持。该测试无生产testIPC。

所有命令沿用前述workdir/bin/sh/login:false/Node24 PATH：
- `npm test -- tests/unit/storageLocations.test.ts tests/unit/repository.test.ts` → `r1-unit-red.log` exit1，3项真正失败（existing-only参数旧实现忽略，生成空库）。
- 同命令修复后 → `r1-unit-green.log` exit0，25 passed（storage14 + repository11）。
- `npm run typecheck` → `r1-typecheck.log` exit0。
- `npm run build` → `r1-build.log` exit0。
- `THOUGHTLINE_FAKE_CLIPBOARD=1 node tests/electron/storage-startup-race.cjs` → `r1-startup-green.log` 测试exit0；外层末尾cat退出0与实际child exit0分别记录。没有全量复跑或无关原生工作流。
- `git diff --check` exit0。

清理：本轮唯一Electron fixture正常恢复对话框退出，没有app.exit/KILL。r1-startup-cleanup.json记录真实root/进程PID/正常exit，cleanupIdleFixture等待PID全退出后删除整个自建root，再stat ENOENT。独立OS查PID和目录见r1-cleanup-audit.json，均退出、目录不存在。失败RED单测各自afterEach清理tmp，不留App。未碰真实数据/旧30628/其他安装，未commit/push。

R1生产/测试输入再次冻结供父限定复核；本轮不自行签署Spec/Quality。其余P5未测Windows/物理磁盘/安装包边界保持。
