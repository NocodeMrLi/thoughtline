# 第四轮发现

当前起点main975cc33，tag62d9302，版本0.0.24，工作树初始干净。用户真实App88971为0.0.24，其他QA34617；后续重新核身份。
挂绳样式小图使用长度65的几何，vineArtwork在区间<70时不产生枝叶；cotton/vine描边样式仅在.rope下定义，.rope-sample另定义通用三层线，导致材质丢失。还需真实页面红例确认。
详情第三轮CSS把标题/正文合成单一.reader-paper，子框border:0、同背景，编辑仅6px gap，视觉安全区与独立边框消失。还需真实页面红例确认。
UI/UX本地检索确认文字在窄窗保持可达的建议；使用现有桌面尺寸和动态布局，不按移动触控规则扩大范围。
初始工具错误：默认cwd已删除，改真实代码目录；旧不存在组件路径和mac-build-manifest路径搜索失败，按真实文件继续，未改产品。

首次新专项fixture缺少必须保留的general标签，App按数据保护契约显示读取失败对话，不算产品红例。修正测试数据；仅对已核PID90407的自有对话正常退出，保留失败证据。

Windows38187186237：源码/安装/本轮源和包71均通过；实际包round21仅calendar-bottom中文昼夜的一次“return before delay cancels dismissal”失败，其他23组通过且正常退出/清profile。生产ReaderMoreMenu180ms行为未改，旧测试跨Node wait70ms/RPC未记录浏览器实际间隔；是否迟到尚无证据，不能武断归因runner。保留失败原日志/回执；对该测试补真实指针事件时间诊断及保证及时返回的双CDP输入，再重测，不改产品180ms。

首个时间诊断测试用Promise.all并行发送两次真实CDP移动，Mac部分场景事件被合并，仅一个pointermove，属于fixture设计错误；原失败回执/截图保留。改逐次等待输入确认，去除Node70ms额外等待，记录实际两个事件时间，不降低180ms/跨间隙230ms/返回后230ms/外移关闭断言。失败Windows完整原始artifact已转存acceptance/evidence/round4/windows-failed-38187186237，临时下载目录不再保留。

第二次Windows38188584519在旧round2-arrange的manage.evaluate处TargetClosed（测试缓存warmViews的隐藏窗口，生产30s空闲回收）。未到新菜单诊断和实际包，不能冒充通过。只修测试：saveSettings前现有openSettings入口重新取得manage。Mac显式等待31s确认旧manage正常关闭，再完成全部7整理/动画/删除项目/重启断言，normalClose/dataRemoved通过；未修改生产回收机制。Windows失败artifact完整转存并删除临时下载目录。

第三次Windows38189326018并无断言失败，check-run正式注记“exceeded maximum execution time of20m0s”。全部源验证/构建/安装通过；包第三轮10/外观14/定制6/reader10/本轮71/round21新诊断24/容量4均通过，定位及上传被整体上限截断。保留通过与取消回执。CI新增显式package续验选择（默认full保持所有源回归），仍跑完整verify、本轮源71、指针源16、安装及全部实际包流程；不再重复未变且已通过的其余源流程，后续用产物指纹核复用。整体上限35分钟，安装包提前独立保存，以免晚期取消丢失构建。

R4-03真实Mac指针红例：枝叶按夹点间隔派生导致移动50DIP时根点位移17.5/25DIP；独立单测亦红。夹子层在绳SVG之后，可用前后遮挡保留固定枝叶，不引入数据变更。0.0.25两项用户明确认可。

新增阶段源码核对：标签全局agents已有；项目只保存在ideas/draft字符串中，必须增加可独立保存空分组的目录，兼容旧快照。Composer标签当前原生select，agentChange仅manage可信窗口；分类入口需要共用主进程变更并保护活动草稿。新建调用锁composer导致hidden悬停不能展开；应分开写作生命周期与挂绳展示，保持其他锁/暂停保护。旧标签管理位于Calendar的agents模式，后续替换为统一分类页。

用户最新批准：对称分组/标签搜索菜单；长按直接停用，不加右键小菜单；搜索提示含“ / 长按移除”。停用从新建选择/搜索隐藏，历史与活动草稿归属保留，统一管理页已停用可恢复/彻底删除。已同步第四轮14节和03/05；当前核心23条通过只是早期目录/展示锁验证，界面/两端新包未完成。继续原计划，不重做已认可0.0.25/26。

Windows材质只读核对：shared/composerMaterial将win32build>=22621且focused且无reduceTransparency/highContrast/forcedColors设acrylic，其余opaque；manage复用此策略。Electron44.7本地d.ts及官方BrowserWindow#setBackgroundMaterial确认11 22H2+支持。建议页签几何/高光/阴影双端统一，系统透明自适应并验证不透明降级；不宣称Win实际玻璃已验证。Anysearch提取官方页成功但截断50k未覆盖末段，用官方网页直接补读该段；shasum初次C.UTF-8 locale panic，改LC_ALL=C核四脚本成功。设置页三页签统一仅建议、尚未授权修改。

用户最新定稿：管理恢复入口统一“已移除”，按钮“恢复选用”；无30天期限/自动删除，长按保历史与草稿，管理“删除”仍确认永久删除分类。代码中英、第四轮及03/05同步，接下来验证实际移除→管理显示→恢复→新建可选，双端/实际包未完成。

隐藏原生窗口不能默认依赖Playwright的requestAnimationFrame轮询：Windows38238035947在另一份重启fixture第32行同样失败，正常退出/删profiletrue。两份fixture统一timer polling50ms并断言busy=false/原生不可见/完整重启读回；新Win38239196630第四轮源步骤已success，旧功能与实际包继续。生产代码不受此测试修正影响；Mac最终源/tag候选787a770，317输入，34输出/asar签名绑定，六组实际DMG11/18/71/13/14/10通过，DMG b95bd3ace3480a1d338209954c67a0080477134c826236bb797e6ebbaed7f533。
