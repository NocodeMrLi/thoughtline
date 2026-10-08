# 本轮候选交付与独立验收报告

本轮形成0.0.11本地候选，已修复后台窗口资源占用与退出写入排空，移除常驻分类/筛选/查找整排控件，实现固定自然弧线及文档13木质弹簧夹。它尚未通过完整用户验收，原发布0.0.6与main没有变更。

原仓库：`/Users/lihongwei/Desktop/晾念头 : Thoughtline/app`，main保持`5f9f29302e8fe61edda5680b91b3753986f4c516`，未提交内容为空。
隔离树：`/Users/lihongwei/Documents/Codex/2026-10-09/task/thoughtline`。
工作分支：`codex/thoughtline-acceptance-20261009`，已按后续明确授权推送。独立QA另有隔离任务，本轮原生测量期间未主动并发运行其UI测试。
原始方案/UI目录：`/Users/lihongwei/安安的成长笔记📒/晾念头 Thoughtline`；00/03/04/05/10/11/12/13已同步，修改前版本保留在`历史版本/2026-10-09-隔离验收收口前`。原概念图已在本机查看，无上传；标注工具条的Library附件曾两次HTTP403，按父会话核实清单与实际UI完成移除。

| 阶段 | 固定提交 | 验证 |
|---|---|---|
| 惰性窗口、退出排空、穿透调用去重、临时入口 | c51ddf4887aa2cd4c8098b69cb33c5ad35ca874a | 54单测/type/build、8组Mac协议回归、Windows CI37812483244成功 |
| 固定绳形 | 21dc22073431a9c710e5131a1b3192c5202f3acc | 56单测/type/build、6组受影响回归、Windows CI37813522368成功；冻结0.0.9包CPU0.24%/RSS292MiB |
| 文档13弹簧夹与配色 | 6b14ada37f92fc06d582647d46cabf4d7ff81e9f | 58单测/type/build、12幅实际1×/2×浅深完整画面、5组受影响回归、Windows CI37814831441成功 |
| QA隐藏草稿与等待修复 | f99cdea07d28e03f112b405e36968c791fa10550 | 58单测/type/build、11组Mac回归、最终包恢复/120秒性能、Windows CI37816503313成功 |

最终源码以`f99cdea07d28e03f112b405e36968c791fa10550`冻结；后续报告/测试脚本提交不修改App生产代码。通用原生协议回归用测试侧模拟快捷键注册/菜单对象适配器；smoke和lifecycle单独使用真实OS注册，未增加生产测试IPC；结果不能替代物理菜单选择、跨应用焦点或输入法。

候选Mac arm64包：`dist/Thoughtline-0.0.11-mac-arm64.dmg`。
SHA256：`d32339a2338139de37d58067ef16bdc014d5e67ad17f3d7019009a0e164a72d7`。
包内app.asar SHA256：`f28fb0e46cc6c9d7e1eec0986acecc6144e86daddaebdc1f62fe7741eafcb700`。
构建App及DMG内App均通过`codesign --verify --deep --strict`，仅ad-hoc资源签名，没有Developer ID/公证。没有替换用户正在运行的`/Applications/Thoughtline.app`。
最终包确证启动仅一个隐藏展示窗；编辑取消不改原文，保存后即退出重启保留全文，新建草稿不被编辑覆盖，设置窗口按需创建。见`evidence/overnight-package-acceptance.json`。

夹子逐项对应见`../docs/CLOTHESPIN-DESIGN-PROPOSAL.md`。截图在`evidence/clothespin-{1x,2x}-{light,dark}-{0,3,24}.png`；测试背景为中性背景注入，不是实际壁纸验收。绳核2.2DIP配18DIP夹子，纸边与夹口重叠，阴影/高光克制；没有粗麻绳、便签倾斜和放大镜。新数据Codex蓝/Claude橙/柔紫Cursor，既有颜色全保留；Gemini/WorkBuddy未强制预置。

复验方法（使用独立工作树及临时数据，不与性能测量并行）：

1. 检出冻结提交；Node24.19.0，运行`npm ci --no-audit --no-fund`和`npm run verify`。
2. 顺序运行`npm run lazy`、`npm run hidden-draft`、`npm run lifecycle`、`npm run workflow`、`npm run groups`、`npm run motion`、`npm run rope`、`npm run clothespins`，再运行`node tests/electron/text-drag-workflow.cjs`及`clean-shelf-workflow.cjs`。这些是应用协议与原生对象测试。
3. 对本地冻结App设置THOUGHTLINE_EXECUTABLE后运行`node tests/electron/package-acceptance.cjs`；它使用独立种子数据并重启。
4. 关闭自己的交互测试实例，运行`package-idle.cjs`；无调试器，120秒采样，全部样本进程成员须一致，CPU≤2%、最后60秒最大RSS≤350MiB。保持物理指针不唤醒顶边，不修改阈值。对比asar哈希，不把旧包结果算给新包。
5. 用户验收从空绳开始：顶边250ms停留呼出，离开500ms收回；点击空白继续操作下层应用；快捷键唤出并用真实中文输入法选择候选词；Enter换行、平台提交键挂上、Esc存草稿后再开与重启。在新测试数据创建Codex/Claude/Cursor便签确认新版默认颜色与夹口连接；既有自选/旧默认颜色全部保留，可在原设置中手动更新；新增/归档/筛选/合夹时绳形不变。
6. 拖夹子调整/合夹，同Agent停留600ms后松手；提前松手及不同Agent不误合并；翻页不复制、拆分可撤销，全文和重启保全。正文分别拖入实际Codex/Claude/Cursor输入框，逐字比对中文/换行/空白、确认无文件附件、不自动发送；取消应保全。Windows必须在实际Windows执行，并记录系统、缩放与版本。

尚未通过的边界：Windows实机、Mac物理IME/穿透/跨App焦点、真实Agent接收、全屏/多屏/混合缩放/睡眠设备矩阵、用户主观真实性。全屏悬停抑制仍是实现缺口，现有托盘手动暂停不等于自动能力。Tendedero菜单栏点击抑制重开等系统专属细节仅研究，未称已实测/完整复制。CUA应用目标访问受到安全拒绝，因此本轮没有伪造物理操作证据。无需新账号/付费/签名权限；相关正式签名与发布留在授权边界外。


最终冻结包性能：120.174秒，全部样本进程成员一致；单核CPU0.1914%，最后60秒采样最大RSS265.78125MiB，CPU≤2%、RSS≤350MiB两项通过。没有把旧0.0.9/0.0.10结果算给新包；旧445MiB失败、穿透去重前4.70%CPU失败及干扰失效记录保留。本结果仅是空数据、隐藏启动、Mac无调试器进程树测量。

Windows冻结源码CI：[37816503313](https://github.com/NocodeMrLi/thoughtline/actions/runs/37816503313)成功，准确head=f99cdea。安装器已下载到`dist/windows-f99cdea/Thoughtline-0.0.11-win-x64.exe`，SHA256 `12dcd2f66c2f40d00db20e0035dd7870ee6c72143535b6c0e2a4dea3e50cdcc0`，与CI SHA256SUMS一致。仅核验，未在Mac执行安装器，没有Windows真机通过结论。

独立QA修复对应：Q1在实际BrowserWindow.hide+30秒释放路径先失败后通过；未确认隐藏保留当前输入，重开续原会话，隐藏退出保存失败时阻止退出并显示原文；物理OS Hide菜单仍未测。Q2取消编辑等待主进程锁释放及原生隐藏后，断言正文和revision不变。Q3协议fixture默认完全模拟快捷键注册，真实注册只在smoke/lifecycle顺序执行。Q4 gates现绑定0.0.11、冻结SHA、包哈希、58测试及最终性能，实际证据范围不扩大。

复验总证据为`evidence/final-verification.json`；包证据为`final-package-mac.json`/`final-package-windows.json`。本轮只删除了自己的未完成0.0.8临时DMG与失败Library辅助目录；保留正式阶段包0.0.9/0.0.10用于回滚、0.0.11 App/DMG、依赖、18张小截图和精简成功/失败证据。测试临时数据均由finally清理。没有覆盖原工作区、替换用户应用、终止其他进程、合并main、发布新版本或使用重置卡。测试与性能已全部结束，可分配独立原生QA窗口。
