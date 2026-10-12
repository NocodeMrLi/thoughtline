# 第四轮执行日志

2026-10-12：接续核main/tag/release/33附件摘要及工作树；本版未验收。新反馈已收到，读取图片、现有组件、专项工作流，当前仅计划/测试准备，未修生产源码。第四轮正式文件用户已创建为空，确认红例后填入，不覆盖第三轮历史。

红例baseline-red-fixture-corrected-WJTAmq：两个图形检查及40阅读/编辑场景、20焦点检查失败，内容/分组保留检查通过；记录62条失败断言，不是62个独立产品问题。正常退出并清理profile。第四轮文档已写入R4-01/02及修复合同。

最小修复：RopeSample长度120且共享.rope材质CSS，删除小图三层线覆盖；IdeaReader阅读独立框、编辑导航分离；共享CSS留12DIP安全区、同色独立边框和内描焦点环。fix-green-R6QfaE63/63通过，final-source-5jx2c1窄窗/标题独存补验67/67通过；均正常退出清理自有profile。Mac verify323通过/4Windows专用跳过、类型/构建通过。下一步补标签实际边框切换，Windows及实际包仍待验。

最终专项final-source-tag-color-tBzsls71/71通过。六个受影响源码流程全部exit0；profile正常清理。版本0.0.25，配套Windows启动器路径同版，CI新增双端第四轮专项并保留旧回归，未放松断言。Mac源码已核，可提交为双端验证候选；Windows/实际包/发布仍待完成。

已冻结并push源码bece988ad18817462a4c6fa9e15dac961f7f6dd1；Windows38187186237进行中。Mac实际0.0.25包visual71/reader10/customizer6/appearance14/round21共24项均通过，全部自有profile正常清理。34输出与asar逐项绑定，原生签名字节精确重放；DMG及check-only启动器哈希一致，未正常LaunchServices启动。自有Mac测试App/重复DMG/块图/空隔离目录及已转存日志已清理，du分配428.85MiB；未动用户88971或历史/最终包和共享out。

实际输入时间诊断Mac source-darwin-CORRECTED（见pointer-timing-source-sequential/）：16组合通过，浏览器真实返回间隔0.7–17.9ms，180ms产品阈值不变；并行输入候选发生coalescing失败，改顺序确认后通过。历史Windows失败确切时间无法追溯，原因仍未确认，不能把新稳定测试当成随机产品故障修复。冻结新测试输入后重跑同源Windows包流程。协作刷新hook旧目录不存在，按交接读取实际-codex两份当前协作参考，不写通用经验/记忆。
