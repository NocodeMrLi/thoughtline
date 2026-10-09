# 独立 Agent 字色只读 QA：精简原件归档

10份原件逐字节来自 `/Users/lihongwei/Documents/Codex/2026-10-09/task-2/qa-agent-ink-preview`。原完整56文件的review-sha256索引均已核验；archive-sha256只描述本精简目录。原报告不修改，历史图片/重复源代码和日志不再次复制。

本目录报告中的旧相对链接按下面映射读取：

| 原 QA 路径 | 仓库已有证据 |
| --- | --- |
| before/、after/图片与result/旧错误像素/cleanup | [原图及22项证据](../agent-ink-review/) |
| agent-ink-icc-correction/ | [ICC校正输出](../agent-ink-icc-correction/) |
| binding-check/review-check/icc-aware/final-binding/windows-ci | 本精简目录同名原件 |

两个独立脚本依赖原QA完整目录布局，不声称本精简目录直接运行。若复跑，在临时目录重建before/after原数据和准确796bbea的agentInk.ts（可从Git固定对象读取），保持脚本原件不变；ICC需Pillow/ImageCms，源码函数需支持TS原生加载的Node。原QA未启动Electron或执行安装器。

结论仅为实际8图观图、准确源函数/同ID字段、ICC复算、固定Git/CI及EXE只读hash。用户主观验收待反馈；CI只对764bec9，327e64c的ICC更正不在其执行范围；物理Windows/IME/G7/完整.14矩阵仍未验收。待确认居中绳长方案没有实现。
