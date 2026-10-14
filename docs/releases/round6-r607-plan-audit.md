# R6-07通用叠放效果
Spec：正式Thoughtline第六轮修复优化.md末尾R6-07。Base a719841/已发布0.0.33；0.0.34候选，不覆盖33。

产品变更仅auxiliary.css中calendar-stack的一个box-shadow声明：原3px/6px两层底纸，改统一3px一层底纸及低对比边。数字、跨日期提示、布局、模型、IO/IME/CAS/撤销均不改。

真实渲染RED：多张背面有2个平面，2!=1；GREEN检查1/2/5/9张、中英/浅深/740/350八组合，单张无底纸，多张外观一致；实际数字、日历14/3、跨日tooltip、1/5详情及返回4卡、全部纸数据和叠放归属保持。14相关unit/type/build退出0。截图已查看。没有新增镜像CSS字符串单测或重跑全套。

交付输入变更：版本/lock/Windows隔离启动器与preflight034绑定；new manual17min workflow仅4相关unit、source stack visual和新NSIS安装/重装/普通卸载保数据、实际安装app stackvisual。preflight可选StackVisualOnly只替换无关UI矩阵，其版本、图标、旧数据迁移、实际启动和保数据门禁全部保留；默认老入口不变，未执行无关UI不写PASS。

审查：本次执行者检查最小diff及实际渲染，不宣称新独立review。Mac/Windows实际新包及source/input/hash/install/release读回待执行。负责人上一版基本没问题按范围保留，仍不扩大完整物理验收。

连接：本机GitHub TLS/EOF连续失败，HTTP1/直连/同已有代理SOCKS均不能访问；没有改网络设置。GitHub插件只读比对main与a719841一致。异步请求负责人检查连接，本地工作继续。

本次继续刷新：本地HEAD2600d798（文档），371项冻结输入/Git对象及Mac最终DMG/归档asar与9cb8c19构建manifest逐项一致。GitHub命令行、替代单命令HTTPS/SOCKS/SSH443及插件连接仍失败；Apple HTTPS控制200，仅支持连接存在局部故障，不猜根因或额度。负责人当前不在电脑，不能操作网络。没有改系统配置、创建tag/发行、触发Actions或重跑已过检查。新增connection-refresh.json与归档R6-07操作报告草稿，双端NSIS来源核对工具已适配034/371并待实际Windows成功run及包，不以准备代替执行。剩余push/Windows/来源核对/发行继续保持未完成。

R607 online continuation: user requires current VPN node unchanged and authorizes remaining connection fixes. No node/network configuration changed. Git push/readback main8a35474 succeeded; build source9cb8c19 remains separate. API intermittent TLS persists, bounded credential-preserving curl API readback obtains run38535760114 (one manual dispatch, no duplicate). Before build billing Actions61items net0 read; budget404/current remaining minutes unknown. Windows job115758119866 has relatedunit/type/build/sourcevisual success and package currentlyrunning; installed gate/finalpublication not yet complete. Prior offline status is retained as chronological history.

### R6-07最终技术交付（0.0.34，2026-10-14）

已按批准方案完成：单张保持原样，2张及以上统一一层约3DIP淡底纸，真实数量仍以“2张/5张”等表示，跨日期提示继续“当日1张/共2张”。仅一个日历叠放CSS声明改变，未重做前六项。

Mac和Windows各14项相关单测、类型及构建通过；双端源码和双端实际包各八组合（中英/浅深/740与350），核单张/2/5/9张、原文及叠放关系、14/3月历计数、跨日期提示、1/5详情及返回4卡片，正常退出与自有profile清理通过。Windows38535760114 success，实际NSIS安装、重装及普通卸载保数据通过；作业墙钟324秒不等于计费分钟。旧四套无关UI和完整产品测试均未重跑，不记为本轮PASS。

源码/tag9cb8c190d289b38498c4c6c938152064c8ee9b4c，工作流执行提交8a354742f2943e9634584b757b075890301f5b7c，371冻结输入一致。最终NSIS全部out读回匹配；双端main/preload/Renderer JS字节一致，CSS/HTML仅精确核实的行尾及两项派生文件名差异，原生插件分列。MacDMG SHA256 e8560971185b786fb3fd0d48292f419052714f7756b5f5640f9fde8283084dd4；WindowsNSIS SHA256 902631b560dc7ccd470978fa68af2d721581c1edac4dccdfd7108593277e6fe4。

[私有正式下载0.0.34](https://github.com/NocodeMrLi/thoughtline/releases/tag/v0.0.34)：Release412509686，published_at2026-10-14T09:16:54Z，draft=false/prerelease=false，10附件大小/服务端SHA256一致。0.0.33十附件ID/大小/摘要不变，0.0.32与0.0.31当前十附件亦与各自保留包一致。后续文档提交不是包源码。完整[操作报告](</Users/lihongwei/Desktop/晾念头 : Thoughtline/app/docs/releases/round6-v0.0.34-delivery.md>)。

照操作：安装0.0.34→日历→有叠放的日期；单张普通纸，多张只露一层淡底纸，张数与跨日提示真实；点开翻页再返回列表，切浅深/缩窄窗口检查。负责人上一版“基本上没问题”只按其反馈范围保留，新外观实际验收待反馈；本次执行者最小diff及实际截图审计，没有新增独立review，physicalAcceptance/formalAcceptance仍false。

当前VPN节点始终未更换，未改系统代理/DNS/预算。间歇TLS/HTTP2/空响应原记录保留，部分命令使用HTTP1.1、有界只读重取，并在写入结果不确定时先核服务器，未把未知当成功或覆盖附件；不宣称已消除所有网络故障。只触发一次窄Windows构建；构建前后账单接口Actions净额0，预算404和剩余分钟未确认，邮件余190仅旧快照，清存储不恢复分钟。

自有重复清理合计1,388,875,836逻辑字节（约1.29GiB）。保留最终双端包、最新成功CI ZIP与关键UI/JSON、冻结Mac asar/原生插件、历史失败和0.0.33/32/31回滚。3个Mac合成profile均不存在，2个Windows源码/实际包profile清理且正常退出，安装保数据样本在临时Runner读回后由任务回收。个人0.0.28 App68573、未知源码Electron95997及个人旧DMG挂载保留，没有按名称杀进程或清未知对象。
