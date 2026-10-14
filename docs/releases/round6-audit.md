# 第六轮审查与定向验证

基线6cc830df771df176dce8a79a5f9bdc38f39a8c65；源码候选0.0.33。

## 独立审查边界
一名新独立审查者只读检查全变更与计划、源码、协议和工作流，禁止GUI/CI/安装。结论With fixes：0Critical、4Important，无单列Minor。四项均由执行者先做针对性失败复现再修复，修后不宣称又做一次独立审查。

| Important | 修复及证据 |
|---|---|
| Calendar定位scrollIntoView被随后scrollTop=0覆盖 | 先恢复再一次性消费locate，记录滚动；dateedge首屏外13张用例RED→GREEN |
| Picker受当前viewport高度上限约束，缩小后无法扩大 | 在自然高度测量时临时解除限高，监听内容刷新，仍限制六行并按工作区裁定native尺寸；多行→一行→多行RED→GREEN |
| 分页末尾拆分第10张被limit9截断 | 成功携带原完整成员身份和已提交Snapshot，按同原查询/日期投影扩加载范围，保滚动；splitedge RED→GREEN，splitalledge GREEN |
| 首次Picker加载失败复用坏窗口，ready超时未清会话 | 失败销毁所属窗口，ready失败只退役相应session并释锁；真实loadFile受控失败→重开RED→GREEN |

审查者未判断真实拖动/IME、多屏DPI、外部焦点/手感、新窗口CPU/RSS、尚未生成的双端包与发布，以及本轮范围外全量G0–G8/公开发布/签名扩展。不能沿用旧性能数字当新窗口性能通过。

## 范围
本次仅新六项与共享Reader、分类Picker、日历、叠放保存/撤销、窗口复用/权限和新包安装；不重跑verify。12文件81项定向单测通过，源码type/build通过；源码新reader/picker正反例、受影响stack/merge/FAST/pager已取得记录。新版实际包和远端发布仍待执行，不能预填。失败工具/夹具及真实RED记录保留于acceptance/evidence/round6。
