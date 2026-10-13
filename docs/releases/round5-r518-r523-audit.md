# 第五轮追加：两轮合同对照审查

最新依据为正式第五轮文档R5-18至R5-27，26/27覆盖历史候选。当前阶段：第一轮源码对照及独立review修复完成；第二轮最终实际包/双端读回待执行。既有0.0.31验收不覆盖新增WIP。

| 合同 | 实现与正反例 | 当前证据 |
|---|---|---|
| R5-18分组底座、独立纸张与旧数据 | clipModel/ideaCommands/clipCommands；同组跨标签正例、跨组与未分组异标签反例、schema3原字节保护、旧混组删除恢复 | round5Grouping、round5MergeTargets、repository/storageLocations单测；group-filter原生 |
| R5-21独立筛选、交集、展示投影 | ideaVisibility与Shelf；匹配隐藏成员，全文复制/拖动按当前成员，退出筛选不改真实叠放 | round5ShelfFilter、group-filter与filter-ui原生 |
| R5-22顶部轻搜索/全部标签/六行与动态高度 | ShelfFilterPicker/CompactPopover；输入法、键盘、外部关闭、屏内与大量长名 | filter-ui8场景；picker-style8场景 |
| R5-19分组优先与三页签 | ClassificationManager/Calendar/元信息；已移除独立滚动与默认保护 | 原R5/R4分类回归、group-filter |
| R5-20同屏避让与手动位置 | manageGeometry/index；真实纸张障碍、16/12DIP、小屏适配、有效跨屏保存位置/断屏 | round5ManageBounds；window4项及31秒回收；物理多屏单列 |
| R5-23真实ready与复用 | session/request首帧确认，重复打开coalesce，保留30秒回收/保存/IME | window原生及此前同环境15例性能；最终样本待核 |
| R5-24/25正文后pager、铃铛首位、标题跳转 | Detail/CalendarStackReader/IdeaReader/ReminderControl；单张隐藏、浏览编辑同位、18px操作图标 | pager8场景、reminder12项、visual71项；IO/IME反例 |
| R5-26完整目标/单入口/三列/目标落位 | stackCommands/ShelfMergePicker；全成员搜索去重、旧溢出和筛选显露目标、长名省略、当前源仅一张 | MergeTargets单测、merge-picker7项；picker-style8场景 |
| 日历持久叠放、拆分与整体挂上/换上 | archivedClips/capacityOverflow；重启/全拆/删除恢复/改组确认，连续换上ID唯一 | stack14类原生；Placement/Grouping/MergeTargets正反例 |
| R5-27单有效撤销与菜单分流 | index有效记录，一级hang/swap与整理四动作不重复，普通打开/复制/筛选不生成 | stack原生、旧merge/split/capacity/native-menu回归；真实Mac菜单截图 |
| 保存/IME/IO/后续合法修改保护 | owner-scoped undo、页码generation、原编辑和草稿guards、CAS拒绝旧修订 | 单测红绿；stack/pager/inline/settings原生；旧失败保留 |
| 全链统一设计语言 | 原生Menu仅两级，两个搜索面板共用中性轻量菜单基座，功能槽位与密度可不同 | picker-style：两面板computed样式与8场景；真实Mac一级/整理截图 |

## 独立审查与一次修复

只读独立review：0Critical、8Important、0Minor。重要项为：撤销覆盖后续日历拆分、整叠换上UI与后端不一致、连续换上ID碰撞、容量owner遗漏、筛选显露目标落位错判、跨屏手动位置丢失、旧混组恢复误套新合并规则、owner全局身份/状态校验缺失。均已用独立单测或原生红例复现并修复；最终verify398通过/4Windows专用跳过，typecheck/build通过。日志见acceptance/evidence/round5/group-filter/review-*-red.log与review-final-verify.log。

不存在未处理的独立review重要项或延期minor。review未独立判断的包/Windows/物理环境/整体视觉/最终性能由执行者按本计划完成；低层证据不升级为设备或用户验收。

## 第二轮

待最终冻结后填写：Mac实际DMG、Windows完整源/NSIS/安装重装普通卸载保数据；菜单与文档一致性；源/tag、构建输入、包SHA256和远端Release读回；清理归属与回滚材料。
