# 连续弯纸：最新单纸真实UI预览，尚未视觉验收

2026-10-09。用户明确否定cc4f517/23164b3的平板纸感，之后仅改比例/底线亦不足。本轮固定源码 `d9a9cd013fb879a9f11065db8dabec73882c41df`，私有分支 `codex/thoughtline-clamp-20261009`。候选元数据0.0.14，未生成本机新安装包；稳定.13/dee1f2c的安装版、DMG/EXE/隔离入口不变。G7保持暂停。

先看正常尺寸，避免大放大图掩盖纸形：

| 实际UI | 文件 |
|---|---|
| 浅色全viewport/单纸 | [1x-light-1-overall.png](evidence/curved-paper-review/preview/1x-light-1-overall.png) |
| 浅色全纸1.1×小幅近景 | [1x-light-1-paper-detail.png](evidence/curved-paper-review/preview/1x-light-1-paper-detail.png) |
| 深色全viewport/单纸 | [1x-dark-1-overall.png](evidence/curved-paper-review/preview/1x-dark-1-overall.png) |
| 深色全纸1.1×小幅近景 | [1x-dark-1-paper-detail.png](evidence/curved-paper-review/preview/1x-dark-1-paper-detail.png) |

当前为真实隔离Electron renderer，假数据、中性背景，单张默认“通用”。已实际逐张查看，当前68项单测、类型/构建/单纸脚本exit0；几何断言仅证明160×226纸框、24×44夹子命中、18×38夹、绳下约6DIP、夹口覆盖约5DIP、屏内边界和固定绳形，不代替自然纸感判断。manifest绑定6份源码、5份编译文件及4图SHA。没有AI概念图、物理Windows/IME/键鼠/真实Agent通过。

## 形体变化和参考

纸框160×226约1:√2。上半部较平静，约y130起整张下三分之一连续缓弯，右边逐渐内收约8DIP，左下边随下沿回转，底缘轻扭且中段下垂。轮廓是一条连续SVG曲线；整体曲面宽幅柔和明暗从同一区域开始，局部约5–7%对比，末缘稍亮。去除孤立小折角和分带高光，边线0.4DIP；薄背缘与近纸轮廓影，夹口接触影继续独立覆盖纸顶。文字不扭曲，按钮上移30DIP，避开最翘的末缘，无空闲动画/随机变化。首轮只有一种受控轮廓，暂不扩大量多纸截图或变体。

实际查看[手作记录中真实夹挂画纸](https://hiramekinotane.theblog.me/posts/2687741/)：湿纸幅度较大，只参考整段受力曲率、侧边和底缘的连续关系，减幅用于普通纸。照片未复制进产品，临时参考下载已清理。首次view_image读取参考曾报exec-server transport closed，单次重试已成功，不是仍受阻。

## 功能与QA发现

主进程位置捕获已统一viewport宽度及Agent过滤，修复合夹后无关夹子漂移/容量不一致。新增3项先红后绿单测；独立QA也在cc4f517纯TS层核验48组。后续group回归增加自然解锁与renderer data-locked=false等待，再核对无关夹x及保存position；8393db1本机协议回归exit0，不把held旧布局当证据。

136DIP试纸的四个32DIP分组按钮确有溢出：原生renderer/实际IPC hit-layout先红，已改160DIP纸宽保留原按钮尺寸。8393db1绿，最新连续纸的四按钮/声明命中小范围复验exit0，四个完整按钮矩形均在article纸框及实际IPC发布的命中矩形内，不扩大为物理点击穿透或整个矩形位于绘制曲面内。

独立只读QA对427a26e初步核验四图、6源码哈希及28项证据索引一致；旧13DIP页脚溢出可在矩形/实际IPC范围关闭，自然解锁后的等待缺口也已在源码补齐，8393db1原生结论仍仅其阶段。两个非阻塞视觉边界：SVG底缘最大约226.7467DIP，比226DIP article/命中框多约0.75DIP装饰；全文按钮局部x119–151、y164–196在article与published hit矩形内，但右下角略超内收轮廓，其他三个按钮四角在轮廓内。这是静态曲线分析，不是物理点击或数据失败。保留待用户视觉反馈后的微调，本轮不修改曲面、不扩大native矩阵。

Agent是用户主动选择的归属；未选择的新记录默认为“通用”。成功提交后下次全新记录不继承旧Agent；恢复草稿保留当时的选择。实际Composer按钮/重启/再次全新提交回归在cc4f517通过。名称/找回标签（自由文本）和项目是另外的可选字段；截图里的Codex/Claude是测试主动选择，不自动判定内容。已保存记录可编辑归属；组中改归属会提示拆出。没有隐藏“通用”或删除原数据。

复制/拖出保留完整原文，纸面正文摘录3行，标题2行，分页/全文/编辑/合并拆分撤销等入口保留。较早中间版68unit、3组/6组DOM与协议结果是阶段证据，不能继承为本轮全部回归。当前先交单纸主观复核；用户接受形体后再完整宽度/数量/分组/拖出回归、冻结包/性能及独立QA。正式验收仍未放行。

## 清理

每次自有实例结束后即清理假数据；保留原始失败exit1。过期横纸未提交33张截图已清1.23MB，SHA和原因在prior-stage-functional-checks/intermediate-cleanup.json。已发布旧预览/历史审查证据保留可追溯Git检查点，稳定.13为必要回滚。不动用户便签/安装版/另一任务目录/依赖/Trash。
