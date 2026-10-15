# Thoughtline0.0.37：分类管理搜索焦点边框

负责人反馈Windows分组/标签搜索左边缺线，已移除搜索左右缺线；Mac同源渲染也复现。原因是2px outline+1px外偏移被classification-content的overflow:hidden裁掉；仅给分类管理的搜索框加outline-offset:-2px，完整焦点线改在框内绘制。保持颜色、2px线宽、框大小、搜索与其他面板样式，保原容器裁切保护。

包源码/tag为ea4b7223162d3b1738e1cde22126f220a1dad840，382冻结输入。双端实际包已定向验证并正式私有发布，负责人新增实际验收待反馈。

[下载0.0.37](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.37)：Mac Apple Silicon下载DMG，Windows x64下载EXE。先正常退出旧App再安装，原个人安装未被工具覆盖。

## 照操作验收

安装0.0.37→Thoughtline日历→右上更多→分组与标签。

| 入口与动作 | 预期结果 |
|---|---|
| 分组页点搜索框；再用Tab进入搜索框 | 左右上下与圆角焦点线连续完整，没有缺边；搜索框不跳动 |
| 标签页重复点选及Tab聚焦 | 左侧不缺线，整个焦点轮廓完整 |
| 已移除页重复点选及Tab聚焦 | 左右两边均完整，仍可读标签/分组两个区域 |
| 输入已有名称→输入无匹配文字→清空 | 正确筛选、空结果及恢复完整列表；不改变目录或念头数据 |
| 切浅/深色、中文/English；缩窄窗口再检查三页签 | 主题焦点色保持、各边不裁切，无横向溢出，按钮/列表可用 |

## 范围

24组合=三页签×中英×浅深×740/350宽；每组合核键盘/鼠标聚焦、绘制范围与所有裁切祖先、搜索正例/空/恢复、框尺寸和数据不变。Mac源码24例RED证实同类缺边，修复后24例GREEN；两个交付版本相关单测、类型和构建通过。原RED记录保留，不改为PASS。

Mac、Windows源码与实际包各24组合全部通过，共96组合；每组合包含键盘/鼠标、正/空/清空搜索与数据/尺寸保护。Windows实际NSIS安装、同版重装、普通卸载保数据和全部安装内out逐项匹配通过；包SHA、输入和私有Release附件读回完成。本次执行者最小diff与实际截图检查，没有新增独立review；真实Windows显示缩放/DPI、系统高对比及本人设备手感另待反馈，不以合成/Hosted环境当物理或正式验收。formalAcceptance/physicalAcceptance=false。

旧完整产品测试、删除功能矩阵及GIF不因本次局部CSS重跑或重录。已有保存/IME/IO/并发保护保持，个人App和真实笔记不用于测试；0.0.36及此前包/tag/附件不覆盖，当前VPN节点和预算不改。


## 交付绑定与审查

构建源码/tag `ea4b7223162d3b1738e1cde22126f220a1dad840`；双端382冻结输入，向量 `f41e3f32e609447fe8ca3b394025929b16b2e251a2d94cfd50df59cb45f020a5`。Windows窄任务38677865032/job116235474241 success；只派发一次，没有重跑完整verify/旧UI矩阵。版本相关单测双端各2项，类型/构建通过。产品变化只有manager内一条CSS偏移；其他变更为测试、窄工作流和版本交付绑定。

MacDMG SHA256：`730adab0d427b752596d993138b3f4f663dc2cf904a7bb1b41617c3c9a6d928f`。WindowsNSIS SHA256：`b16a78b6a94ec3af05700dcc06311d5da1f18af9dfd50984a74e4594106909f0`。双端main/preload/RendererJS逐字节一致，CSS仅精确核CRLF，HTML按真实派生名和行尾逐项核；原生插件单列，不能概称全部平台产物字节一致。Mac未改原生插件，其编译/包内原始摘要与036相同，仅复用原受限差异解释，当前实际DMG版本/asar/严格签名仍新核。

Release413402181，published_at 2026-10-15T03:57:50Z，draft=false、prerelease=false；10附件服务器SHA256/大小一致，旧036十附件ID/名称/大小/摘要不变。仓库仍私有，不加自动更新。后续文档main提交不改变包源码；最终推送/远端对象回执在delivery/v0.0.37/documentation-push-verification.json。

## 额度提醒与清理

负责人在任务进行中提供GitHub邮件：包含分钟已用2000/2000、11月1日重置。本轮唯一Windows任务当时已经成功结束；随后不派发或重跑任何Actions，不改预算、付费设置或VPN节点。净费用接口已报告0不证明有免费余量，也不能排除后续入账费用。本次后续只下载既有产物、本地核验及发布；已查全部工作流无release/tag构建触发，文档推送带[skip ci]并读回没有额外运行。后续若需新构建先核可行替代与必要费用决定，不能默认消耗超额分钟。

归属明确的重复App、解包、重复DMG、成功artifact本地重复提取和截图清理1085文件/1393868268逻辑字节（约1.30GiB）。本地3profile正常退出且不存在；Windows源码/实际包2profile已正常退出清理，安装保数据样本由独占Runner处置。保留2张RED缺边、Mac4张/Windows4张实际包关键图、原失败结论、正式037双端包及原036以前回滚、最新成功ZIP、冻结asar/native、依赖/原始截图/真实笔记；个人App036/PID26072/startOct15 08:01:27不触碰。没有按名称杀进程或清未知旧挂载。

文档交付点fcb7b6f9ddcf665faa3258c305c97846c482ee58已推送，58个本轮变化Git对象远端一致、无额外Actions；tracked推送回执保留该点。后续仅状态收口提交，最新main回执写在delivery/v0.0.37/documentation-push-verification.json，不与包源码ea4b722混用。
