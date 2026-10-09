# 独立只读报告归档

原件来自 `/Users/lihongwei/Documents/Codex/2026-10-09/task-2/qa-continuous-paper-preview`。报告、binding-check、boundary-check 源码/结果及原 review-sha256 均逐字节保留；未复制已在仓库的图片和生产源码。

原 `review-sha256.json` 是 QA 原目录的索引，并非本精简归档的完整文件清单。`archive-sha256.json` 校验本归档保留文件。

| QA 原目录输入 | 仓库固定输入（427a26e） |
| --- | --- |
| 四张 1x-*.png / manifest.json | ../curved-paper-review/preview/ |
| footer-result.json / group-footer-overall.png / evidence-sha256.json | ../curved-paper-review/ |
| ClipCard.tsx | d9a9cd0:src/renderer/components/ClipCard.tsx |

`boundary-check.py` 原样依赖上述输入及 QA 原目录同级 `qa-thoughtline` Git checkout，不能声称本精简目录可直接执行。复跑时把固定对象写入独立临时目录并提供 Git checkout；保留原脚本避免改写独立证据。报告中 binding/boundary 的相对链接在本归档有效。

范围为源码/固定图/证据算术，不继承最新原生、打包、Windows 或视觉验收。
