# Plain-text drag acceptance

源码0.0.7起提供标准text/plain正文拖动，与夹子排列分离；已发布0.0.6没有此入口。0.0.8候选继承该入口。完整中文/换行、无文件载荷、取消保全在Electron协议/同页接收中检查，见evidence/text-drag-native.json。

| 目标 | macOS真实跨App | Windows真实跨App | 落成文本/附件、逐字一致 |
|---|---|---|---|
| Codex桌面 | 未测 | 未测 | 未核实 |
| Claude桌面 | 未测 | 未测 | 未核实 |
| Claude网页 | 未测 | 未测 | 未核实 |
| Cursor输入框 | 未测 | 未测 | 未核实 |

G6仍未验收。Electron DragEvent、同页textarea、DOM dragend、txt附件均不能证明目标Agent接收。复制全文为已实现基础路径；复制/拖入不自动发送或收起。
