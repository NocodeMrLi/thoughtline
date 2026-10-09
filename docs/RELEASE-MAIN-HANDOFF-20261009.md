# main 收敛与双端预发布：接续检查点

2026-10-09（北京时间）。用户要求先保存检查点并结束本轮，父任务立即接续。尚未推送main、删除远端分支、创建tag/release或上传资产；不把本地通过写成已发布。

## 已完成

- 隔离树 `/Users/lihongwei/Documents/Codex/2026-10-09/task-7/thoughtline-windows-preflight`，仍使用现有 `codex/thoughtline-windows-preflight-20261009` 分支，没有新建分支。
- 实际13条远端tip经connector核对与本地完全一致，无开放PR，相关项目线程除本任务均idle；所有其他工作树clean且保留。原main为 `5f9f29302e8fe61edda5680b91b3753986f4c516`，是当前树祖先，可普通fast-forward推送。
- 本地整合源码检查点 `723356385af5518cddae65d2ae023707a0c804b6`：e5565d4保留icon/旧.15独立QA历史；95c7d52保留被替代Composer的QA并移除与canonical精确相同的历史重复JPEG；7233563保留草稿恢复独立QA。src/assets/scripts/tests/package/lock/.github/.gitattributes与Windows打包冻结 `aa23b210ce26de956f88c48851dc1681ab233f6b` 无diff。G7七项独有实验提交不合入。
- npm verify：102unit通过/4Windows-only跳过，type/build通过；20项composition合成检查、4项delayed-submit检查均通过；不是物理IME。
- macOS .6 arm64 DMG构建通过。原命令等待外部下载后，仅停止本轮builder；对现有Electron44.7.0缓存273个文件逐字节比对依赖，通过electron-builder原生electronDist参数离线构建，没有修改package/scripts或依赖。App和盘内App strict codesign均通过，未Developer ID/公证。
- 盘内App实际隔离启动、全文、编辑取消、编辑保存/重启、独立新建草稿保持和lazy settings通过；全部编译输出/assets、资源ICNS与本树/批准资产精确匹配。测试自有PIDs全部退出、假数据删除、DMG已detach。
- Windows .6 x64复用现有已独立QA的 run37893774452/artifact11598913007/source aa23b21；三份JSON与installer绑定通过。没有重建Windows，也没有继承物理Windows验收。

## 产物与证据

Mac：`/Users/lihongwei/Documents/Codex/2026-10-09/task-7/releases/v0.0.16-preview.6/Thoughtline-0.0.16-preview.6-mac-arm64.dmg`；SHA256 `dfe18f6ee4cb64df5cd61ed8268b12e534382636f2955d5f2810a7bcb57296c6`。

Windows：`/Users/lihongwei/Documents/Codex/2026-10-09/task-7/delivery/0.0.16-preview.6/Thoughtline-0.0.16-preview.6-win-x64.exe`；SHA256 `545bac65d545578653ca031861b98080d4e6ea46c94db51cd493565734289266`。

[本阶段证据](../acceptance/evidence/release-0.0.16-preview.6/)：branch-audit-before.json、remote-branch-check-before.json、releases-before.json、main-verify.log、composition/result.json、delayed-submit/result.json、electron-offline-cache-check.json、package-mac-offline.log、mac-signature-verification.json、mac-package-binding.json、overnight-package-acceptance.json、package-acceptance-cleanup.json。原package-mac.log保留被中断下载尝试，不是通过日志。Windows固定QA入口及原始独立报告保持不变。

## 当前状态及接续顺序

1. 执行连接此前连续initialize handshake失败，已恢复；本轮最后pwd及GitHub读请求成功。最新远端main仍5f9f293，目标v0.0.16-preview.6 release查询不存在，最近Windows CI37893774452已success/completed，没有本轮构建/测试进程待接管。运行/queued CI应接续时再核对。
2. 当前生成的out/dist保留给接续，不是需要重复构建的原因；只清理本轮已退出进程对应的临时数据。原安装版PID28102和原开发版PID30628实查仍运行，禁止替换/停止/读写真数据。
3. `docs/releases/preview6-notes.md` 和 `preview6-branch-cleanup-plan.json` 为未提交草稿；notes里Actions/最终main重建的描述是连接受阻时的备选方案，发布前须改成实际采用的来源。release-preview6.cjs和release-preview6.yml未落盘、未执行，不能声称已建立新流水线。
4. 更新README、acceptance/gates.json和正式发布报告为.6准确阶段，同时保留旧记录；不要沿用当前历史.15页当最新入口。提交发布文档/证据，再从现有隔离树普通推送HEAD到main，不重置原main工作树。main push可能自动触发现有Windows流程，检查实际结果，勿重复dispatch。
5. 为最终main SHA建立双端production input Git对象一致性证明：Windows来源aa23b21、Mac实际构建来源7233563，最终main若仅文档/证据变化可复用两包，manifest明确各来源和release commit；若生产输入变化则重建受影响端。不能把tag指向旧源码而声称最新main已发。
6. 核对tag/release不存在后创建 `v0.0.16-preview.6` 私有prerelease，先draft上传两包、合并SHA256SUMS及双端manifest，核验服务端size/digest与本地精确匹配后publish；不clobber历史资产，不公开仓库，不启用自动更新。
7. [11条远端清理草案](releases/preview6-branch-cleanup-plan.json)：发布通过后重查tip、开放PR和工作使用状态；仅删除准确tip已可从main恢复的分支，用删除lease防并发新提交。保留main/G7和所有他人工作树/本地checked-out branch，不强删脏树。G7未来有效实验还需产品集成/验收，不能仅为清爽而丢失。
8. 同步项目笔记新一期，阶段commit/push并复核main/release/branch列表。最后清理本树冗余out及dist/App、缓存临时文件和自有进程，保留最终双端包/证据、正常依赖、旧.15/.5包及真数据。

用户最终不要下载地址，只要main SHA、release/tag、版本架构、分支处置、测试和残留风险。formalAcceptance=false；签名/公证、同appId覆盖与完整备份、物理Windows/IME/焦点/穿透/Agent/G7/旧版升级回滚边界必须如实记录。无需追加发布或main合并授权。
