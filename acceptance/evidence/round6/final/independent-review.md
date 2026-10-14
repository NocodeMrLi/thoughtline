# 独立审查原结论归档

审查者round6_review，审查当时base6cc830d→工作树全变更，只读，不运行GUI、CI、安装包，不修改文件。

本次只读审查结论：With fixes，当前不宜冻结发布。未发现Critical；发现4项Important。

实现优点：日历展示投影与真实叠放归属分离，搜索分档保持原始内容；复制/恢复反馈保留在Reader层，避免恢复按钮消失时丢失提示；新增Picker使用独立窗口及明确IPC信任范围。源码与实际包测试入口也已分别接入。

1. Important：屏外目标日历定位滚动被覆盖。Calendar.tsx当时74行定位效果调用scrollIntoView，77行随后scrollTop写回restoreScroll0，卡片加载和高亮但仍停列表顶部。最小修复：先恢复普通滚动，再消费一次定位请求并记录最终滚动；补首屏外断言。
2. Important：Picker搜索缩短后不能恢复多行高度。PickerHost.tsx7行测面板rect，classification.css45行受当前viewport限高；缩一行后增加内容只内部滚动，测不到自然高度。最小修复：测内容自然高度与六行上限，再按工作区约束native窗口；补多行→一行→多行→重开。
3. Important：分页边界拆分后刚拆出的念头被limit截断。Calendar.tsx145行onSplit只清selected和恢复scroll，9张投影拆末张双成员变10张，刚拆当前成员在index9需显示更多才能找。最小修复：成功携带拆分成员身份及提交后投影，扩可见加载范围但保日期/查询/状态/滚动锚点；末页拆当前及全拆回归。
4. Important：Picker首次加载失败后永久复用坏窗口。index.ts310行loadView失败只清pickerLoading，picker仍引用坏窗口，下次303行ensurePicker直接返回；ready超时也未清上下文/锁。最小修复：加载失败清空销毁所属window，ready失败只清仍属此session的上下文隐藏释锁；补首次失败再开成功。

Minor无单列。
Declined to judge：真实拖动/IME、外部焦点、多屏DPI和手感（禁止GUI）；新隐藏PickerCPU/RSS（无新测量，不能沿旧性能）；尚未交付双端新包/安装保数据/远端发布；本轮范围外G0–G8/公开发布/签名扩展。

修正四项并补定向回归后再进包验证发布，无需重跑全套。

执行者后续处理与红绿证据见round6-audit.md。此报告是修复前审查原结论，不将其改成修后新独立审查。
