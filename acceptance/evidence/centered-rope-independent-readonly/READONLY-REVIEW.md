# 居中淡端绳：固定提交独立只读 QA

**结论：视觉方向可作为用户暂定基线；81b7783 的位置捕获/重排存在 P2，当前不能作为最终功能通过。** 用户经父会话转述“目测截图还可以”，不等于功能或整体验收。缺陷原件已及时交构建者，构建者确认修复中，97f373c 的 Windows CI 即使构建成功也不能免除该 P2。无需主动改变当前视觉。

固定 source/tests `81b7783e330b0de85c26df0202ab260e5bfe637a`（src 与 `5d0986f` 一致）；evidence/docs `97f373cece22ff91b48b6180d1e79fe5a1d662fb`。从私有远端准确 SHA 获取 Git 对象，复制到本隔离目录，不修改/执行构建者树。本轮仅实际查看既有 PNG、纯 Node 读取/回放固定 TypeScript 函数，没有新 Electron、物理热键、安装器、系统剪贴板或真实便签操作。

## P2：混合 ratio/null 捕获非固定点，合夹或移动导致无关夹漂移/换入溢出

新 `layoutClips` 在读布局时，为靠右显式位置隐式向左 reflow 先前已排夹子。它可能在遍历早先 null 夹时把它标为 overflow，之后再移动前夹，却不重新计算早先 overflow。`captureClipPositions` 只写 visible 的比例，下一次 layout 对仍为 null 的 overflow 重新排入，导致展示身份和坐标改变。main 在 move/merge/split 前调用同一 capture，问题可到达实际业务路径。

最小纯源码复现（1440 DIP）：依次四个合法同 Agent 夹，position `[0.8,null,0.2,1]`。执行 `layoutClips` → `captureClipPositions` → `layoutClips`。

| 阶段 | 可见 ID@x | 溢出 |
| --- | --- | --- |
| 捕获前 | 0@712、2@884、3@1056 | 1 |
| 只捕获后 | 0@540、1@712、2@884、3@1056 | 无 |

无关夹 0 漂移 172 DIP。所有夹与便签仍保全，**不是数据删除/正文丢失**。旧 adf9c9b 在同样输入上捕获前后均 0@1096.8、1@1316.8，新阶段引入非固定点。证据：[复现脚本](capture-defect-repro.mjs)、[结果](capture-defect-repro.json)、[旧/新比较](capture-before-after.json)。

应用命令可达复现：从 8 个 `position:null` 同 Agent 夹开始，每一步按 main 实际顺序先捕获再调用固定 shared 命令：

1. 夹 1 移至左端、插在 0 前。
2. 夹 2 移至右端。
3. 夹 3 移至左端、插在 1 前。
4. 夹 4 移至左端、插在 3 前。
5. 夹 3 移至右端。
6. 合夹 4→1。

第 5 步可见 `[4@384,1@712,0@884,2@1056]`，移动夹 3 进入 overflow。第 6 步可见 `[1@540,0@712,2@884,3@1056]`，合夹前的无关 0/2 各左移 172；随后仅 capture 又变 `[1@540,0@712,5@884,2@1056]`，3 进入 overflow、2 右移 172。完整每步前后在 [实际命令链](command-reachability.json)，[回放脚本](command-reachability.mjs) 使用真实 shared commands/validator，未启动原生。不是物理鼠标复现，也不是随意未校验位置造例。

另作更严格可达性回放：[renderer 移动约束命令链](command-ui-constraints.json) / [脚本](command-ui-constraints.mjs)。移动点排除任何其他可见夹 ±30 DIP 的合夹目标区，beforeId 取 renderer 同样的右侧可见夹；从 8 默认夹经合法 move/merge/split 仍到达非固定点。最后可见1@540、4@712、3@884、2@1056，仅 capture 变1@540、4@712、5@884、3@1056，夹2进溢出。这加强了纯命令可达性，仍没有声称物理拖动已独立复现。

确定性 3000 个合法 ratio/null 纯场景中，991 个捕获前后身份或中心变化；这是所选压力分布的失败数，不代表真实用户发生率。只保留 5 个样例，见 [压力结果](ratio-stress.json)、[脚本](ratio-stress.mjs)。不能把该压力运行 exit0 当作测试通过：它收集反例，没有成功门禁语义。

构建者已接收最小例、真实命令链及压力证据，计划移除 layout 读取中的隐式回排，把必要邻夹让位作为 move mutation 持久化；修复尚未提供固定提交，当前 P2 **未结案**。不修改生产、不要求视觉重做。新修复应独立红绿验证 capture 固定点、移动可见身份、merge/split 无关中心以及 agent 过滤同域；后续冻结包再覆盖受影响原生路径。

## 已通过的有限检查

[绑定检查](binding-check.json)：18 源/测试 SHA、54 原证据索引 SHA 一致；81b src 等 5d，81b→97f 的 src/tests/scripts/package/.github 无差异；paperShape/ClipCard/Clothespin/agentInk/styles/motion hook 相对 adf 字节一致。原始 6 旧图+18 新图均保留，无图像加工。

[独立有限回放](layout-replay.json)/[脚本](layout-replay.mjs)：863 断言覆盖 11 宽×8数量=88 个默认/递增旧比例布局、9 个过滤捕获、3 宽有限 move/merge/split/restart，分区 ID 保全、纸宽边界、最小间距、默认舒适容量、比例归一化；18 场记录几何与实际函数一致，1440 三纸前后 6 卡 ID/variant/outline/正文/Agent 色一致。其输入没有上述混合压力条件，所以通过不推翻 P2。执行副本仅为 Node 解析把 shared 相对 import 加 `.ts`，原 fixed source 同目录 `source/` 不改。

默认 null-position 容量：1040/1440/1920 为 3/4/5；显式位置可按最小 172 间距达到更多夹，不能把舒适容量当绝对硬上限。18 场预览 count0/3/24 的实际可见数与函数一致；24 条全量记录/浏览入口和三宽重启是构建者脚本已断言的受控证据。独立纯回放确认 layout 的 visible+overflow 保全、merge/split 后全文不丢、序列化 validator 保持。未独立操作真实管理入口。

## 实际图与比例

独立实际查看 10 张新图：1440 空/三纸/满两主题六张；1040/1920 满两主题四张。正常三纸图：[浅](after/1440-light-3.png)/[深](after/1440-dark-3.png)。1440 满图：[浅](after/1440-light-24.png)/[深](after/1440-dark-24.png)。两端在屏内自然上扬渐淡，无显眼硬截断；三夹居中，Agent 蓝/暖赭和连续 A4 纸保留。剩余新图未逐张独立观图，哈希/记录已核验。

SVG 绳长 `.7*width`、左右 `.15*width`，固定 sag 18–30 DIP 随宽计算，不随数量/主题变；mask 四 stop0/.08/.92/1 透明度0/1/1/0 同时覆盖阴影、绳芯、高光；中间夹区为 rope 的 1/6..5/6，叠加纸半宽80+屏边12保护。主捕获/renderer拖动/归一化共同使用 shared 新 travel bounds，已无前期宽度域不一致；但共享函数内部上述隐式 reflow 仍破坏捕获稳定性。

1040/1920 是 screen adapter 模拟，DPR1；不是物理屏/缩放/穿透矩阵。用户暂定视觉基线覆盖旧屏外线头目标，不盲改纸/夹/色；当前图不替代轮廓命中、完整交互或真实焦点验收。

## 审阅测试证据与未测

构建者 82 unit/type/build、预览/三夹 group/text-drag exit0 是准确源的有限证据；group 左右界已 await 主进程 revision+解锁、renderer locked=false 和 peg实际矩形，合夹无关中心也在自然解锁后读。首轮 fixture ready/空绳锁错误和已确认左右界真实红分别保留。但该 group 只有三夹没有溢出/null混合，不能覆盖新 P2。

text-drag 为 DataTransfer/测试 textarea 与内存剪贴板，未验证真实 Agent 跨 App 接收。过滤共享捕获纯检查通过，未执行物理菜单筛选。构建者最终60PID退出/有界假数据清是归档记录，本轮 QA 无新原生实例。

97f 新 Windows CI run37871527546 由构建者收尾，当前未独立查询其最终状态；先前764 run37868192110/0.0.14 EXE **不含居中绳**。本固定源没有新最终 Mac 包。父会话已要求 P2 修复后新的明确版本冻结 Mac/Win 包；等待最终 source/package hash 后再协调独立原生增量（位置/容量、夹纸轮廓命中、数据/暂停恢复、退出清理），不与构建者原生/性能重叠、不触碰安装版。物理 Windows/IME/Agent/G7仍未测或未放行；.13只保留独立回滚范围。

交付索引 `review-sha256.json`，当前 `QA-CURRENT-STATUS.json` 已记录暂定视觉与 P2 未结案；没有文件访问阻塞。功能放行剩余阻塞是 P2 待修及最终冻结包增量，不能靠截图/CI解决。
