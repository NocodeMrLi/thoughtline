# 竖向轻弯纸：已批准方案的真实UI预览

用户明确批准“行，那就执行”，覆盖上一轮斜切角横纸。源码 `cc4f517fb6ea91ad85f617176427fbbbe03f308c`，独立私有分支 `codex/thoughtline-clamp-20261009`。候选元数据0.0.14；未生成新安装包。

136×188DIP接近A4缩略比例，纸顶保持绳下6DIP/夹口覆盖约5DIP，正面夹、后臂、绳片段、接触阴影关系保留。文字面平整；只在下沿做约数DIP浅弧和右下角轻微抬起，没有斜切或夸张折角。淡暖纸色，深色用低亮纸色，细边与轻阴影。Agent小字和夹子色保留，标题最多2行、正文摘录最多3行；复制与拖出仍为完整原文，不混入标题或Agent。底部页数/翻页/全文入口继续可用，无新功能或常驻装饰。

| 画面 | 文件 |
|---|---|
| 浅色正常整体 | [1x-light-3-overall.png](evidence/upright-paper-review/preview/1x-light-3-overall.png) |
| 浅色全纸细节 | [1x-light-3-paper-detail.png](evidence/upright-paper-review/preview/1x-light-3-paper-detail.png) |
| 浅色夹口4× | [1x-light-3-clamp-4x.png](evidence/upright-paper-review/preview/1x-light-3-clamp-4x.png) |
| 深色正常整体 | [1x-dark-3-overall.png](evidence/upright-paper-review/preview/1x-dark-3-overall.png) |
| 深色全纸细节 | [1x-dark-3-paper-detail.png](evidence/upright-paper-review/preview/1x-dark-3-paper-detail.png) |
| 深色夹口4× | [1x-dark-3-clamp-4x.png](evidence/upright-paper-review/preview/1x-dark-3-clamp-4x.png) |

真实Electron截图，使用假数据与中性背景，细节图为renderer变换放大，不是AI概念图或Windows实机。manifest绑定源/编译/图SHA。类型检查、构建与预览exit0。136×188纸框、24×44夹子命中、固定曲线及屏内边界已断言；共享高度校验纸底+分组叠片不超过340DIP。三组基础回归exit0：实际renderer鼠标合夹、翻页/全文/拆分撤销与重启、正文拖放、编辑/草稿；明确断言无关夹子x不漂移。复制路径用内存clipboard适配器，不读取或改用户剪贴板，不扩大为系统剪贴板验收。后续完整宽度/深浅/数量、交互回归与新冻结包仍待完成，主观视觉由用户复核，不自称正式验收。

QA发现的坐标域问题也修复：主进程操作前捕获位置改用与renderer相同的viewport宽度及Agent筛选，不再把48DIP屏外绳段计入归一化。旧表达式提取为共享helper时三项先红，修正后通过；覆盖无关夹中心不漂移、renderer容量一致、过滤隐藏Agent位置不改。不是只检查revision增长。

旧稳定0.0.13/dee1f2c安装包、安装版、隔离入口不改，G7暂停。真实Windows/物理IME与键鼠/跨应用Agent等原缺口保留。每回合自己的实例退出后清理假数据；不操作别的实例或真实便签。
