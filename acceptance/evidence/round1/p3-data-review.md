# P3 数据底层独立审查

审查时间：2026-10-09。基线 `97875dda8d85201ff088218a347f7de2c301dc7e`；检查当前未提交数据层代码及新增测试。只读代码审查，未改实现、未提交、未启动 Electron、未触碰真人数据或已有 PID。采用 code-review 双轴检查；本文件承接审查计划、发现和验证记录。

## 结论

常规数据路径符合 brief，未发现 Critical / Important 数据层问题。发现 1 项 Minor 迁移日期边界 D1。全项目 typecheck 当前失败，唯一错误是 Manage 对 deleted 的类型集成缺口；列为后续集成转移项 T1，不能宣称全项目已通过。

## Spec

### D1 — Minor — 迁移补全创建日后未校验生成结果，可能返回无法再次读取的快照

- 位置：`src/shared/ideaHistory.ts:10-11`；`src/shared/ideaCommands.ts:24-25,33,43`。
- 复现：构造 schema 1 / 2 或缺省创建元数据的 schema 3，仅一条 archived 记录，`createdAt` 与 `updatedAt` 为 `+010000-01-01T00:00:00Z`，其它字段合法；调用 validateSnapshot，再将成功结果传回 validateSnapshot。
- 实际：首次 `{ok:true}`，生成 `createdDay='+010000-01'`；第二次 `{ok:false,code:'INVALID',message:'念头创建日或时区无效。'}`。Date.parse 接受扩展年份，但 toISOString().slice(0,10) 不再产生 YYYY-MM-DD；输入校验发生在补全之前，生成字段未复验。
- 预期：迁移输出必须满足真实 YYYY-MM-DD 契约；不支持的年份应明确 INVALID，保留原文件，不返回自相矛盾的成功快照。可在规范化后验证 dayOK 并增加重验不变量测试。
- 影响：仅异常扩展年份合成数据；正常 App 创建时间不会遇到。旧文件 load 可显示成功，但 commit 会拒绝，故不是正常用户流的发布阻挡。
- 证据：`acceptance/evidence/round1/p3-data-review-date-boundary.log`，schema 1/2/3 均复现。现有 p3Schema 测试覆盖输入 createdDay 的日期合法性，尚不覆盖自动生成字段重验。

已逐项确认：旧 schema 1/2 首次写前保存原始 JSON 字符串，已存在专用备份不覆盖；备份失败不写主文件；未知版本遇有效 bak 仍 fail closed；损坏主文件恢复后分别保存 corrupt 原文与旧 schema 原文。新建取本地创建日与 Intl 时区；正常旧偏移日期冻结；编辑与跨时区不改创建日。删除保留 ID/全文/归属/创建元数据并 prune 夹子，恢复原状态且挂着者独立成夹；永久删除仅允许 trash；edit/changeStatus 拒绝 deleted；removeProject 包含 trash 与草稿。CAS 比较 text/title/project/agentId，不因 unrelated revision/settings/其他记录变化冲突；findIdeas 和 calendarIndex 排除 trash、保留 archived。calendarBounds 校验有限坐标、正尺寸与 16384 上限。

## Quality

无独立 Critical / Important / Minor 质量发现。现有测试实际断言正文首尾/emoji、ID、创建字段、草稿、分组剩余成员、备份原始格式与失败前后文件，而非只检查 ok。原有 schema 迁移测试仅将预期版本 2 改成 3，原全文与草稿保护断言保留。备份失败注入位于专用备份写入，能保护先备份再升级顺序。

## 集成转移项

### T1 — Important integration gate — Manage 类型接入尚未完成

`src/renderer/components/Manage.tsx:12:266`：Idea.status 新增 deleted 后，setUndo 仍只接受 hanging/archived。独立 `tsc --noEmit` exit 1，当前仅此 TS2345 错误。父任务需接入并重跑全量 typecheck；这是 UI/main 集成范围，不归为数据层未完成，也不以数据单测代替集成验收。

## 独立验证与限制

- Node v24.19.0，显式项目 workdir、`/bin/sh`、login:false；未运行 Electron。
- `node node_modules/vitest/vitest.mjs run tests/unit/p3Schema.test.ts tests/unit/p3Repository.test.ts tests/unit/p3IdeaCommands.test.ts tests/unit/ideaHistory.test.ts tests/unit/repository.test.ts tests/unit/clipCommands.test.ts tests/unit/ideaCommands.test.ts tests/unit/ideaWorkflow.test.ts`：exit 0，8 files / 66 tests，见 `acceptance/evidence/round1/p3-data-review-unit.log`（19:16:44）。比初次实施者报告 64 多 2 项，以本次实际执行为准。
- `node node_modules/typescript/bin/tsc --noEmit`：exit 1，见 `acceptance/evidence/round1/p3-data-review-typecheck.log`，仅 T1。
- 日期边界复现只在进程内合成对象，esbuild 转译读取源码，无存储数据写入。
- 初次临时复现尝试使用 TypeScript JS API，该安装不暴露预期 ModuleKind，命令 exit 1；改用现有 esbuild 成功复现，此失败不属于产品问题。
- 实施报告在本审查最后读取时仍标注进行中；本结论根据代码、测试内容和独立执行证据，不依赖报告中的完成声明。
- 尚未覆盖 native UI、main IPC 接入、真实设备和真实用户数据；由父任务继续整合验收。

## D1 修复限定复核（2026-10-09，后续有效结论）

**D1 已关闭。数据范围 Spec / Quality 均无开放发现，未发现新增 Critical / Important。全工程集成未通过：T1 仍开放，由 UI 任务接续。以上初审记录与失败证据保留。**

- 已读最新实施报告、`p3-data-date-boundary-red.log` / `p3-data-date-boundary-green.log` 及修改后的实际源码、测试断言。RED 的 4 项失败分别是扩展正/负年份、真实 tmp 仓库拒绝加载并保留原文件、旧 typed schema2 新条目跨午夜 localday；不是编译错误或缺导出造成的假红。GREEN 为 10 files / 75 tests、exit 0（实施者证据）。
- `src/shared/ideaCommands.ts:33-34` 在规范化日期后逐条 dayOK 检查，扩展年份的截断结果不再作为成功快照返回；符合 D1 建议的 fail-closed 行为。
- `src/shared/ideaCommands.ts:48-50` 先规范化原 snapshot 为 schema3，再追加带 localday / Intl timezone 的新条目，最终完整校验；因此旧条目继续按旧偏移日期迁移，新条目不会被误标 legacy-offset。原 snapshot 输入没有被就地修改。正常正文、ID、创建时间和 clip 生成仍使用原逻辑。
- `tests/unit/p3Schema.test.ts:53-61` 覆盖旧 typed schema2 新建跨午夜与扩展正/负年份；`tests/unit/p3Repository.test.ts:53-57` 断言 load/commit 均 INVALID、主文件内容不变、目录没有产生其它文件。
- 独立限定重跑 p3Schema 与 p3Repository：exit 0，2 files / 28 tests，证据 `acceptance/evidence/round1/p3-data-review-d1-recheck.log`。没有为此次小修重复其它已经通过的测试。
- 最新 `p3-data-typecheck-after-review.log` 仍只有 `Manage.tsx(12,266)` 的 T1 类型接入错误；本复核不将数据层通过扩大成全工程 typecheck、native UI、main/IPC 或真实设备通过。
- 本次只追加审查报告和独立测试日志；未改实现、未提交、未启动 Electron、未操作真实数据与现有 PID。
