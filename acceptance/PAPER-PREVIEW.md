# 纸片效果：第一轮真实 UI 预览

用户已明确批准“可以，我看看效果”。源码固定 `84ea53782f16bc79e4a547c74aa1b0140a4b2726`，在正面夹持 `aa0ac31` 上改进纸片。旧视觉检查点/28图原件仍保存于 `CLAMP-VISUAL-REVIEW.md`；其中“新纸形未授权”的段落是历史阶段，现被本次明确授权覆盖。

纸顶下移4DIP，绳下约6DIP留白，前夹口仍覆盖纸顶约5DIP；接触阴影同步缩短，未让纸悬空。暖白纸色、极淡1DIP细边、约2DIP小圆角、右下3DIP斜切、轻薄阴影；深色用独立低亮纸色。保留Agent夹子颜色/小字、标题、原复制/正文拖出/分组控件、24×44命中、18×38夹子、160×112纸框、屏外绳端和固定弧形。没有吊绳、折角或新装饰。

| 实际UI画面 | 文件 |
|---|---|
| 浅色正常整体 | [1x-light-3-overall.png](evidence/paper-review/preview/1x-light-3-overall.png) |
| 浅色夹口4× | [1x-light-3-clamp-4x.png](evidence/paper-review/preview/1x-light-3-clamp-4x.png) |
| 深色正常整体 | [1x-dark-3-overall.png](evidence/paper-review/preview/1x-dark-3-overall.png) |
| 深色夹口4× | [1x-dark-3-clamp-4x.png](evidence/paper-review/preview/1x-dark-3-clamp-4x.png) |

构建、类型检查exit0；预览脚本exit0，实际查看四图。manifest记录源码/编译文件及图SHA、命中/纸框/夹口几何，固定曲线保持。测试只用独立假数据与模拟快捷键；自有PID结束、临时数据删除。背景是中性测试背景，4×为renderer变换检查，不是AI概念图或物理缩放。

当前先交图等待用户视觉反馈；完整受影响回归、宽度/分组/拖动、冻结新包与独立QA随后继续，不把旧0.0.13的通过继承为新renderer通过。未生成新安装器，版本仍0.0.13；稳定DMG/EXE/隔离入口未改。G7仍暂停，Windows物理交互等原缺口保留。
