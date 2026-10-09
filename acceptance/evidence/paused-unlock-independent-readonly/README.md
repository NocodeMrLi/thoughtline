# 独立暂停解锁只读复验归档

五原件逐字节来自 `/Users/lihongwei/Documents/Codex/2026-10-09/task-2/qa-paused-unlock-review`。review-sha256描述QA原完整目录；archive-sha256描述本精简归档。原脚本读取固定Git对象，并依赖QA目录布局/同级qa-thoughtline checkout；不要声称本精简目录直接可运行。复跑先读脚本，在独立临时目录提供原Git布局；固定旧54494df、新3e56454与36824b7原native证据都可从Git取出，不重复生产源码/日志。

独立运行是Node25.8.1的纯TS回放；75 unit/受控native是builder运行与QA审阅，非QA另跑窗口。本历史报告不包含后续796bbea字色修复，也不关闭G7或Windows物理矩阵。
