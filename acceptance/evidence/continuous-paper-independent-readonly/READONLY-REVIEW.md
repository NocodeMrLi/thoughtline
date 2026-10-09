# 连续缓弯单纸：独立只读复验

固定源码 `d9a9cd013fb879a9f11065db8dabec73882c41df`，原图/证据提交 `427a26e99ab79a53bc9db561d8bacf9ff53419be`。首次远端查询准确指向证据提交，随后确认文档说明提交 `3c637c1d95f21b7e8e81f8820ea94e3511d48328` 已推送，src/tests/scripts/package/.github 与源码固定提交无差异，curved-paper-review 图和证据也与原件无差异。

**本轮只读范围未确认新增功能阻断；旧页脚 P2 与冻结布局测试等待缺口已修正。自然纸感仍未放行，等待用户方向反馈。** 未独立启动 Electron、浏览器、热键、剪贴板、真实 Agent 或新打包，没有修改构建者工作树、生产源码或安装版。未扩展大矩阵。既有 0.0.13 的结果没有继承给新候选。

四主图均直接查看、独立核对 SHA256，manifest 六份源码哈希匹配；28 项 evidence-sha256 索引全部通过 Git 固定对象核验，见 [binding-check.json](binding-check.json)、[boundary-check.py](boundary-check.py) / [boundary-check.json](boundary-check.json)。编译哈希为构建者报告，本轮未独立重建；68 unit/type/build/单纸与 footer exit0 亦为构建者运行证据。额外查看了组页脚原始截图和先红记录，没有执行其测试。

**旧分组页脚 P2 关闭于明确范围。** 136 DIP 原生红记录中，全文按钮 right=801，article right=788，差 13 DIP；实际 published hit 矩形也缺少超出部分。这与独立静态预测一致。新纸框 160×226，可容纳四个 32 DIP 按钮、gap 与 padding 的 158 DIP 最小需求；页脚 bottom:30 上移避开末缘。最新 footer-result 中 article x640..800/y68..294，四按钮 y232..264，横向最外 x649..791。四个完整按钮矩形均包含于该 article 及 main 捕获的真实 IPC published rect，独立重新计算 containment 成立。因此原先越 article/声明命中 13 DIP 的原因已消除。这个结论不是物理鼠标点击穿透或系统命中行为验收。

**post-unlock 假阳性缺口关闭于测试源码/阶段证据范围。** group-workflow 在来源夹 detached 后先 await main `!interactionLocked && snapshot.revision > oldRevision`，再 await renderer `data-locked === false`；Shelf 此次 render 在锁 false 时刷新 held layout，随后才比较 unrelatedAfter.x。另检查保存的 unrelated.position 非 null，后续手工 dragLock(false) 位于断言之后，没有用测试主动释放代替自然释放。这排除了原先“新 snapshot 移除来源夹而 remaining 仍按 held 旧坐标显示”的假阳性路径。8393db1 原生 group exit0 是此前阶段证据；最新 d9a9cd0 没有完整 group/native 结果，本轮不把它继承成最新完整通过。坐标 helper 仍按 viewport/Agent 过滤，原坐标静态修复范围保持。

新轮廓在正常大小的浅/深图均可见：上部相对平直，下三分之一出现连续右侧内收、左下回转、底缘浅扭和大幅面柔和明暗；文字仍平面。相比前版只是矩形拉长/极浅底弧，形体与明暗变化确实增加。此为观图事实，不能据此宣布真实办公室夹纸感成立，也不能替用户选定方向。仅 1.1× 全纸细节，无 4× 图用作主证据；当前四图为 1440×340/DPR1 的单纸浅深场景。默认“通用”可见，但相关 Agent 行为完整验证属于此前阶段。

**两个非阻塞形体边界说明，避免将矩形通过解释为曲面通过：**

- 对实际 SVG 轮廓密集采样得到底缘最大 y≈226.7467。article/声明命中高226，因此约 **0.75 DIP 装饰性底缘在框外**，阴影另有外延。最坏固定绳高度加6DIP纸顶空隙和4DIP组叠片，绘制底缘约298.7467，仍低于340；没有据此发现越屏或数据问题。
- 全文按钮局部矩形 x119..151/y164..196 全部在 article 和 published rect 内；其右下角略超向内收的**绘制轮廓**，其他三个按钮四角在轮廓内。按钮矩形的 right=151 与内收侧边关系不等同于矩形 article containment。该部分仍在已发布命中区域，不等于旧不可点缺陷；若用户选定该形体后细调，可稍向左/上收。当前不为这个小差异扩原生矩阵或判新增功能失败。

源上 paper/card/ghost 的宽高同步160×226，peg 24×44、视觉夹18×38，中轴偏移对齐；纸顶仍在绳下6、夹前臂覆盖约5DIP。拖动提示改到312，位于纸下；固定绳端继续跨左右屏幕裁切边界、形状不由数量驱动。复制和拖出完整文本路径未改，分页/全文/编辑入口保留。后续形体如果改变，仍需重新核页脚、ghost、命中与纸轮廓关系。

| 项目 | 当前结论 |
| --- | --- |
| 远端/源码/四图/28证据索引/文档补充不改源与证据 | 只读核对通过 |
| 旧136页脚越article/IPC矩形13DIP | 已修复，静态与 builder 最新 renderer 证据一致 |
| 合并坐标 post-unlock 等待缺口 | 测试源码已修复；prior-stage native 证据范围明确 |
| 新轮廓高度、peg/纸/ghost尺寸、页脚矩形范围 | 源与现有图/geometry 内通过；保留非阻塞轮廓差异 |
| 自然纸感、夹持观感 | 等待用户方向反馈，未放行 |
| 最新完整宽度/数量/交互/Windows/IME/系统剪贴板/Agent/包 | 本轮未测，不继承历史结果 |

构建者已把两个非阻塞说明补入文档，独立复核该文档提交没有改源码、脚本或28项证据原件。QA 没有占用原生时段，G7 仍暂停。待用户决定视觉方向后，再按最终形体安排必要增量复验。
