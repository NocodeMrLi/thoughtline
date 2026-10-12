# 第四轮执行日志

2026-10-12：接续核main/tag/release/33附件摘要及工作树；本版未验收。新反馈已收到，读取图片、现有组件、专项工作流，当前仅计划/测试准备，未修生产源码。第四轮正式文件用户已创建为空，确认红例后填入，不覆盖第三轮历史。

红例baseline-red-fixture-corrected-WJTAmq：两个图形检查及40阅读/编辑场景、20焦点检查失败，内容/分组保留检查通过；记录62条失败断言，不是62个独立产品问题。正常退出并清理profile。第四轮文档已写入R4-01/02及修复合同。

最小修复：RopeSample长度120且共享.rope材质CSS，删除小图三层线覆盖；IdeaReader阅读独立框、编辑导航分离；共享CSS留12DIP安全区、同色独立边框和内描焦点环。fix-green-R6QfaE63/63通过，final-source-5jx2c1窄窗/标题独存补验67/67通过；均正常退出清理自有profile。Mac verify323通过/4Windows专用跳过、类型/构建通过。下一步补标签实际边框切换，Windows及实际包仍待验。

最终专项final-source-tag-color-tBzsls71/71通过。六个受影响源码流程全部exit0；profile正常清理。版本0.0.25，配套Windows启动器路径同版，CI新增双端第四轮专项并保留旧回归，未放松断言。Mac源码已核，可提交为双端验证候选；Windows/实际包/发布仍待完成。

已冻结并push源码bece988ad18817462a4c6fa9e15dac961f7f6dd1；Windows38187186237进行中。Mac实际0.0.25包visual71/reader10/customizer6/appearance14/round21共24项均通过，全部自有profile正常清理。34输出与asar逐项绑定，原生签名字节精确重放；DMG及check-only启动器哈希一致，未正常LaunchServices启动。自有Mac测试App/重复DMG/块图/空隔离目录及已转存日志已清理，du分配428.85MiB；未动用户88971或历史/最终包和共享out。

实际输入时间诊断Mac source-darwin-CORRECTED（见pointer-timing-source-sequential/）：16组合通过，浏览器真实返回间隔0.7–17.9ms，180ms产品阈值不变；并行输入候选发生coalescing失败，改顺序确认后通过。历史Windows失败确切时间无法追溯，原因仍未确认，不能把新稳定测试当成随机产品故障修复。冻结新测试输入后重跑同源Windows包流程。协作刷新hook旧目录不存在，按交接读取实际-codex两份当前协作参考，不写通用经验/记忆。

最终源ee7ea98076ae3fdbf70dcf62ad9dd884b428a95f已push，Windows38188584519执行中。Mac重新冻结包34输出/asar与bece完全一致，唯一变化输入tests/electron/more-menu-checks.cjs；前三轮/本轮有效同字节视觉证据复用，实际包round21新诊断24组重新通过，16指针返回0.6–17.6ms。最终DMG8a05fcca...及同版check-only启动器通过；自有最终测试App、重复包和空隔离目录另清428.85MiB，用户88971保留。

Mac受控隐藏窗口31s释放及当前入口重开，7项整理流程通过；为最终Windows回归更新旧fixture窗口生命周期，不改产品。保留38188584519失败完整证据，最终冻结另以新head记录。

最终Mac/source feac122、307输入，第三次打包与前候选34输出/asar相同，同版启动器check-only及最后包绑定通过。第三次自有App/重复DMG/块图/空隔离目录已清428.85MiB；三次合计1286.55MiB分配量，不承诺APFS净空间。源/包菜单诊断与31s隐藏窗口回收测试均正常退出清profile，所有新诊断目录的显式profile不存在已回读。最终Windows38189326018仍在执行。

最终package续验CI38191123624成功，source d898141716176e7a8f02008152f017e4db1184db；verify327/类型/构建、本轮源71/指针源16及全部实际包通过。Windows实际visual71、customizer6、appearance14、reader10、round3 10、round21 24、capacity4、positioning9、split4、appearance3通过；source及pkg指针各16返回1.8–16.5ms/4.2–15.6ms，正常退出/清profile均核。307输入对象/模式一致，280差异精确LF→CRLF；下载exe d32dacd6...与构建SHA一致。安装有效载荷9项回执下载读回中；正式发布尚未执行。
工具窄Range提取artifact尝试被接口忽略，1MiB缓冲正确阻止整包stdout（ENOBUFS，无本地文件产生）；改标准完整artifact下载。首次回执汇总引用旧packaged-split-menu文件名错误，按真实packaged-split路径重新核，未改测试或产品。

双端技术/证据/七语README/门禁文档收口提交8232c66cd298a15a767e09461b14b8a5d3c82364已push，产品/构建输入相对d898仍逐项相同，树干净。新tagv0.0.25已push并固定d898；32文件/31SUMS目标的私有draft上传中，尚未宣称正式发布。Windows启动器与Macraw比较首次失败确认为受验证的精确CRLF，改核Windows构建原始摘要并原字节交付；不归一化已发布历史附件。

正式私有发布410058311，v0.0.25源/tag d898141，2026-10-12北京时间09:54:42。32附件服务端大小/SHA256逐项一致，SHA256SUMS31目标；历史24(33)/23(31)/22(37)/21(32)原id/大小/摘要保持。源码/包/清理/文档均技术收口，完整物理/本版用户验收false，旧认可保留。发布前附件不重写，最终回执publication与当前项目报告为准。

R4-03追加：已按用户反馈保留0.0.25两项认可。共享枝叶按固定绳几何生成，茎线仍局部跟随夹口，分支根使用逆旋转衔接实际茎线；仅两生产文件改动。Mac新增13项真实指针流程通过：浅深×4/6/8、前后与穿过枝叶拖动、固定根/叶片/卷须、根连接误差<0.06DIP、夹口接触、取消保数据、保存与分组正文、重启。verify324通过/4Windows专用跳过。fixture初次设置IPC来自shelf被拒；改manage；新增主题验证揭示fixture序号非单调致偏好旧请求，被测试抓出，改严格递增并确认实际dark。记录所有红/fixture失败/绿例，自有profile均正常退出删除。版本及双端启动器/预检升级0.0.26，CI加入新源/包流程。

Mac受影响源码专项：本轮vine13、旧本轮visual71、第三轮appearance14均通过。附加尝试多年旧fixed-rope-workflow在首条创建因fixture使用已不存在的codex/claude标签被拒，未触及几何断言；该脚本还用过时SVG/日历选择器，不能计为产品回归失败/通过。不扩大修复范围：保留错误日志，其隔离App正常退出profile删除，以当前单测接触/独立枝叶矩阵和实际appearance4/6/8/拖动验证为对应证据。类型/单测324+4skip/构建通过，严格主题序号修正后的vine13绿例已保留。

冻结源码b76b5dc，Windows全量CI38201316521已过verify/第三轮/本轮源检查，继续执行其余源及实际包。Mac从实际只读DMG逐项绑定34构建输出、asar、原生签名精确重放；源/包vine13/visual71/appearance14全过，启动器check-only过。11profile退出清理、挂载弹出、自有App/重复DMG/块图/空隔离目录清428.85MiB，最终包、用户88971、所有失败/绿例原件保留。

Windows全量CI38201316521最终success，源b76b5dc；verify328通过，所有源/安装及实际包专项成功。正下载已测x64安装包113MB及45MB源/包回执，随后绑定SHA/308输入、清下载副本、发布新私有0.0.26，不覆盖历史。

0.0.26正式私有发布410153282，北京时间2026-10-12 12:19:11；32附件服务端大小/摘要逐项一致，31SUMS目标；历史25/24/23/22/21附件ID/大小/摘要保持。源/tag b76b5dc、308输入/281精确CRLF，Mac34输出与Win9载荷/安装时EXE摘要绑定。清536.84MiB分配量，下载源原件转存，不作为空间删除收益；实际用户88971仍运行。第四轮第13节/入口/进度/七语README/代码报告及门禁同步。0.0.25两项认可保留，新R4-03用户及完整物理待验。最终文档证据提交push与读回收口中，构建输入未变。
