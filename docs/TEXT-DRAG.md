# 正文纯文本拖放的实施边界

0.0.7正文主体提供标准HTML text/plain拖放，保留完整换行、空格和Unicode，不加入Agent/项目/标题，不生成文件。拖夹排列仍使用夹子手柄，两种操作分开。参考[MDN标准拖放载荷](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_data_store)：在dragstart同步填写数据，拖动结束不是接收成功证明。

主进程只接受本机展示层主frame发来的有效挂着ID，独立text-drag锁维持源展示层，平台标准拖放处理Esc，不抢占夹子排列的全局Escape。dragend释放锁并抑制拖动后的误复制，取消不修改数据；失去结束事件时60秒兜底释放。睡眠/锁屏/换屏同样取消。销毁当前卡只释放自己的文本拖动。

text-drag-native.json证明实际Electron浏览器拥有的拖动载荷能到同页测试接收框，并检查合成取消、无文件、完整正文、不自动复制或改数据。它不是Mac/Windows向真实Codex、Claude或Cursor接收的验收；这三个目标目前均未测。保留点击复制作为明确基本入口，不宣传所有Agent兼容。
