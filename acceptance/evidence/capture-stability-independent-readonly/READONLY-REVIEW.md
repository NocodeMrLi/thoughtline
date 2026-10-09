# 夹位置捕获与满容量移动：独立源码红绿复验

结论：两个 P2 在固定 `d2901894e243038fe9a18da9781c4837fe6cfc87` 的独立纯源码范围已修复；未做独立原生/冻结包验收。用户认可的 70% 淡端绳、连续纸、正面夹和可辨 Agent 字色保持暂定视觉基线。此结论不继承旧 Windows/0.0.13 功能通过，不允许用纯回放替代最终包验证。

本轮按授权读取构建者已提交 Git 对象，导入自己的 QA repository 并复制固定源到本目录。`3e4277993667427906adca7e2e7c7538bba997e7` 和 `d2901894e243038fe9a18da9781c4837fe6cfc87` 当时为本地固定提交；没有据此声称远端已推送或 CI 执行。没有运行/修改构建者工作树、生产代码、安装版或真实数据，没有 Electron/原生/真实热键/系统剪贴板操作。

## P2-A：混合比例/null 的捕获不是布局固定点——源码范围已修

原 `81b7783` 的只读布局隐式向左 reflow，使 overflow 夹在捕获后重新入场，无关中心漂移。原 [98文件红报告](../qa-centered-rope-review/READONLY-REVIEW.md) 保持原判定及哈希。

`3e427799` 删除布局读取中的回排，把邻夹让位改为 `moveClip` 的实际持久化 mutation；main 明确传 `width,shelfAgentId`。独立复验始终使用六参数 main 语义，未沿用旧四参数 API 制造假失败。`normalizedPosition` 对极窄合法 travel span 按真实分母归一化，退化 span 返回0。

独立同种子 `314159`、同 3000 混合 ratio/null 场景：81b 失败991，3e及d290失败0。最小1440四夹 `[.8,null,.2,1]` 捕获前后固定；原6命令和排除合夹目标±30DIP的严格12命令链，每步捕获后的展示身份、overflow身份、中心及全文均保持。见 [固定提交源码绑定](fixed-d290189/source-binding.json)、[最小及命令复验](fixed-d290189/independent-fix-replay.json)、[3000压力](fixed-d290189/ratio-stress-fixed.json)。执行副本只把相对shared import补`.ts`，原 fixed source 在 `source/` 原样保存。

## P2-B：满容量移动夹被隐藏夹抢位——另行发现并在d290修复

3e 的捕获固定点虽通过，满容量移动仍有残留：1040 DIP、8个默认null同Agent夹，旧可见0@300、1@520、2@740。按 main 先capture，调用 `moveClip(s,'2',1,null,1040,'all')`，结果可见0@300、1@520、3@740，移动夹2进overflow。到右界762.666667不碰其他夹±30DIP，renderer真实beforeId为null，是正常移动意图；QA只做纯命令复现，不声称物理拖动。

原因是 `beforeId=null` 将移动夹插在全数组末端，原隐藏tail提前抢占显示位；3e仅写旧visible比例，没有保存visible lane在hidden tail之前的顺序。8条原文都保持，**不是便签/正文丢失**。[最小红复现](moved-overflow-repro.json) / [脚本](moved-overflow-repro.mjs)已即时交构建者。

该问题不是3e新引入：旧adf满屏绳1040宽8默认夹，将最后可见3移右后，显示0/1/2/4、3进overflow。[旧基线核验](moved-overflow-old-baseline.json)明确归因，避免把旧缺陷误报为本次修复新增回归。

`d290189` 只在move mutation中保存当前filter的旧可见lane排在该filter hidden tail前；其他Agent字段和相对顺序保持。没有恢复 renderer 隐式reflow，不改schema，不修改视觉。

| 独立纯复验 | 3e结果 | d290结果 |
| --- | --- | --- |
| 1040满8最后可见→右端 | 夹2被替换并隐藏 | 原0/1/2仍可见，2@762.666667 |
| 同种子150×40命令压力中的移动夹隐藏 | 763次 | 0次 |
| 同种子压力中的捕获稳定性 | 6000检查通过 | 6000检查通过 |

压力分布并非用户发生率，旧脚本收集反例exit0不算通过。d290脚本加真实失败断言，Node运行exit0才表示此分布的移动保全通过。因状态分支变化，3e执行4875 mutation/3083 move，新版4883 mutation/3146 move；随机种子、150轮、每轮40步与宽1040/1440/1920一致。每步实际六参数move，避开其他夹30DIP合夹目标区，beforeId与renderer取右侧可见夹一致，merge/split使用固定shared commands。见 [旧压力红](move-chain-stress.json)、[新压力绿](fixed-d290189/move-chain-stress.json)及各同名脚本。

## 最新d290独立通过范围

- 最小捕获与旧6/严格12链、14宽/左右界场景、8过滤场景共122断言通过；main实际width/filter接线已读确认。
- 满8最后可见移右的精确原反例在1040/1440/1920三宽均保持原可见集合，移动夹各到762.666667/1056/1408。见 [精确绿结果](fixed-d290189/moved-overflow-fixed.json)。
- 独立seed45014、2000混合比例/filter场景，七宽含184.5极窄span；1978次实际move、3978捕获检查通过，旧visible身份保留、其他Agent字段及相对顺序不变、输入不可变、全文保持、移动后投影固定、JSON序列化往返保持。见 [过滤压力结果](fixed-d290189/filtered-move-stress.json)。这仍是纯函数/协议域，不是物理菜单或鼠标矩阵。
- renderer和ropeGeometry相对97f字节diff空，见 [视觉源绑定](fixed-d290189/visual-source-diff.json)。没有新截图，不重评用户已暂定的视觉，不扩大为新的visual pass。
- 审阅新增clipProjection测试：包含最小混合旧ratio、确定性捕获压力、原命令链、右端让位、满容量hidden tail、filter移动保全。vitest `include: tests/unit/**/*.test.ts` 将旧归档测试副本排除，避免误跑旧源；构建者报告88 unit/typecheck通过，本轮QA未独立重跑整套unit/build/native。

## 未测与下一步

源码纯复验两个P2结案，最终候选仍待构建者串行适用原生回归、新明确版本Mac/Windows冻结包、签名/hash及可控性能证据。旧97f373c Windows CI37871527546为含P2的中间构建，不据其成功放行最终包。

收到最终冻结source/SHA/包后，按父会话授权先核包及asar/编译绑定，再在明确释放的串行时段，用独立假数据验证：满容量/overflow移动与重启位置、合夹拆分和过滤解释、夹纸轮廓与32DIP按钮published hit矩形、全文/草稿及暂停解除恢复、退出与有界清理。保留所有历史红记录，不操作用户安装版；交互结束后与构建者性能时段继续互斥。物理Windows/IME/真实Agent/G7和系统焦点/穿透不靠截图或CI代替，继续明确未测或未放行。

本轮无原生实例或时段冲突，无读取/计算阻塞。当前交付索引 `review-sha256.json`；3e中间源码/红与d290固定绿分目录，未覆写81b原98文件证据。
