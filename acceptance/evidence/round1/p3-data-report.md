# P3 数据底层实施报告

## 结果与范围

数据底层已完成，最后覆盖单测 10 files / 75 tests passed（exit 0）。全项目 typecheck 仍 exit 1，仅旧 Manage.tsx 的撤销状态类型不含 deleted；此文件属于父/UI 集成范围，未越权修改。

- 从 main HEAD 97875dda8d85201ff088218a347f7de2c301dc7e 开始；未 commit/push，提交由父任务统一处理。
- production ownership：src/shared/contracts.ts、src/shared/ideaCommands.ts、src/shared/ideaHistory.ts、src/main/store/repository.ts。
- tests：新增 p3Schema.test.ts、p3Repository.test.ts、p3IdeaCommands.test.ts、ideaHistory.test.ts；只把已有 repository.test.ts/clipCommands.test.ts 的 schema1 迁移版本预期 2 改为 3，其余内容保护断言保留。
- 未修改 main index、bridge、renderer、窗口或 Electron tests；现有 UI/Electron 草稿未当作已接入实现。
- 未启动已有 App、未读写真数据、未停止 PID 28102/30628 或其他现有进程。所有 repository 测试用系统 tmp 下独立 mkdtemp 合成数据，并由 afterEach 清理。
- 读取父 AGENTS、产品/验收/设计依据及 TDD 技能；使用 planning-with-files，以本报告集中记录本子任务计划与证据，避免改父共享计划。

## 计划与进度

1. RED：迁移/原字节备份/日期/设置、删除恢复/CAS/日历，预期失败已保留。完成。
2. GREEN：schema3、迁移与共享命令实施。完成。
3. 复核：父 D1 扩展年份缺陷与旧 typed schema2 新建日期各先红后绿修复；覆盖单测、typecheck 与 diffcheck 已记录。数据子任务完成。

## 数据契约

- initialSnapshot 与 validator 输出、所有新提交均为 schema3。Snapshot 类型允许 2|3 仅供旧 typed fixtures 兼容；运行时版本只接受数字 1/2/3，未知数字或字符串版本 fail closed，已有有效 bak 不覆盖未知主文件。
- schema1 保留原迁移的稳定创建时间排序与逐张独立 clip；schema2 保留 clip ID、成员/currentId/position。首次提交前保存完全原始 snapshot.schema1.backup.json 或 snapshot.schema2.backup.json；已有文件不覆盖，备份保存失败时主文件不改。损坏主文件恢复后继续保留 snapshot.corrupt-*.json 原文。
- 新建记录按给定 createdAt 对应创建瞬间的系统本地日期 + Intl timezone 写 createdDay/creationTimeZone，原 createdAt 和正文首尾/换行/emoji 保持不变。旧 typed schema2 进入 newIdea 时先规范已有 snapshot，再追加新记录，避免把新记录误当 legacy 日期。
- schema1/2 按原 createdAt 字符串明确偏移的日期段冻结，无明确偏移按 UTC 解释，标记 creationTimeZone=legacy-offset；即使旧版本附带其他日历字段，也按此旧版本规则重建。迁移不按今天或当前系统时区重分日期。
- schema3 已存创建日跨时区、编辑、状态变化、删除恢复保持不变。兼容旧 typed fixture 时，两项创建元数据均缺省可补原日期；部分缺省、非真实 YYYY-MM-DD 或空时区拒绝。规范化后的日期再次校验；扩展年份无法表示成四位年份日历日时返回 INVALID 并保留原文件，不截断为错误日期或今天。
- Idea.status 增加 deleted，类型中的 deletedAt/deletedFrom/创建元数据可选；运行时 status=deleted 的记录必须带有效 deletedAt 和 hanging|archived 的 deletedFrom，以保证恢复可复核。
- deleteIdea 软删除全文、ID、创建日与归属，prune 物理 clips。restoreIdea 只恢复 deleted，按原 status；挂着的恢复独立成夹，保留原组和现有夹子位置。permanentlyDeleteIdea 只允许 deleted，不自动清空其他条目；独立确认由父/UI 实现。
- editIdea/changeStatus 不能绕过 restoreIdea 直接操作 deleted。removeProject 清除挂着、已收起、trash 和草稿的项目归属，恢复不复活已删除项目；父负责撤销结构。
- editIdeaIfUnchanged(s,id,draft,expectedDraft,now) 只逐字段比较 text/title/project/agentId；不以无关 revision、其他记录、设置位置或状态变化判断冲突。旧回调返回 CONFLICT 且不覆写；仍通过 editIdea 保留 ID/status/createdAt/创建日，Agent 变化沿用独立 clip 规则。
- ideaDay(idea) 返回冻结 YYYY-MM-DD（旧 fixture 回退原偏移日）；calendarIndex(snapshot, filters?:Partial<IdeaQuery>) 返回 Map<string,Idea[]>，日期递增，同日保留稳定创建顺序，默认包括 hanging+archived，永不计 deleted，支持现有 query/agentId/status 过滤。
- settings.calendarBounds?:Rect 校验有限 x/y、正 width/height 且各不超过 16384，缺省旧数据兼容。多屏可见约束与窗口保存接入由父完成。

## 命令与实际证据

所有测试使用 Node v24.19.0，显式 workdir=/Users/lihongwei/Desktop/晾念头 : Thoughtline/app、/bin/sh、login:false。PATH 为 /Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin。

所有日志位于 acceptance/evidence/round1/，没有删除失败记录：

| 日志 | exit | 事实 |
|---|---:|---|
| p3-data-schema-red.log | 1 | 14 failed / 24 passed；其中缺备份读取的 ENOENT 改为缺失结果断言后再确认 RED |
| p3-data-schema-red-confirmed.log | 1 | 20 failed / 18 passed，schema版本/迁移日期/设置/原始备份等预期行为失败 |
| p3-data-schema-green.log | 0 | 4 files / 38 tests passed |
| p3-data-commands-red.log | 1 | 16 failed，delete/restore/CAS/ideaDay/calendarIndex 未实现与 trash validator 预期失败 |
| p3-data-commands-green.log | 0 | 8 files / 64 tests passed；命令包含不存在的 projectCommands.test.ts，被 Vitest 忽略，后续已改为实际 projectDeletion.test.ts |
| p3-data-legacy-date-red.log | 1 | 2 failed / 14 passed，schema1/2附带其他日历字段未按旧日期规则重建 |
| p3-data-covered-green.log | 0 | 10 files / 71 tests passed |
| p3-data-final-unit.log | 0 | 测试 helper 移除缺导出的过渡检查后，10 files / 71 tests passed |
| p3-data-date-boundary-red.log | 1 | 4 failed / 24 passed：扩展年份validator/真实tmp仓库保留，以及旧typed schema2新建localday |
| p3-data-date-boundary-green.log | 0 | 修复后最终覆盖 10 files / 75 tests passed |
| p3-data-typecheck-initial.log | 1 | Manage 旧状态类型 + 本次两处 TS narrowing/index 错误，后两处已修 |
| p3-data-typecheck-final.log / p3-data-typecheck-refactor.log / p3-data-typecheck-after-review.log | 1 | 只剩 Manage.tsx(12,266) 的 undo 状态类型不接受 deleted |
| p3-data-diff-check.log | 0 | 已有所有授权 tracked 文件 git diff --check 无错误 |

最终覆盖命令：

```sh
PATH='/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin' node node_modules/vitest/vitest.mjs run tests/unit/p3IdeaCommands.test.ts tests/unit/ideaHistory.test.ts tests/unit/p3Schema.test.ts tests/unit/p3Repository.test.ts tests/unit/repository.test.ts tests/unit/clipCommands.test.ts tests/unit/ideaCommands.test.ts tests/unit/ideaWorkflow.test.ts tests/unit/projectDeletion.test.ts tests/unit/agentPalette.test.ts
PATH='/Users/lihongwei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/opt/homebrew/bin:/usr/bin:/bin' node node_modules/typescript/bin/tsc --noEmit
```

## 未完成与验证边界

- 数据 ownership 内无已知未完成项。全项目 typecheck 未通过；父/UI 必须处理 Manage 状态类型并在集成后重跑。
- 没有运行 build、Electron workflow、现有安装 App、原生交互或物理双端验收。单测验证纯命令与真实临时文件原子存储，不证明 IPC/window/renderer 接入或用户真数据迁移。
- 父任务后续 main/renderer/bridge/窗口接入、独立永久删除确认、撤销与原生窗口/交互测试、阶段提交/push 保持开放。
