# 居中挂绳与柔和绳端：实际 UI 预览

用户2026-10-09 01:25:24明确批准：居中约70%屏宽、固定长度不随数量变、两端自然上扬后柔和渐隐，夹子集中绳中间约2/3。此决定覆盖旧屏外线头方案；旧固定checkpoint `adf9c9b` 可回滚。当前源/测试固定 `81b7783e330b0de85c26df0202ab260e5bfe637a`，生产与 `5d0986f` 一致；预览前旧编译文件逐一匹配796bbea的固定哈希。

绳长70%viewport、左右15%留白；固定抛物线的sag按本屏绳长决定（18–30DIP封顶），不随便签数量/主题/过滤变。左右最后8%绳段用静态SVG mask渐隐，绳芯/高光/接触投影一起淡出，中间84%保留原材质；无挂钩、圆点或新增常驻装饰。纸形、夹子、可辨Agent字色、标题正文样式、显隐motion hook逐字节保持。未新增rAF/计时器；既有显隐rAF只在短过渡内调度，本轮未重测120秒CPU/RSS。

| 正常1440×340/DPR1 | 浅色 | 深色 |
| --- | --- | --- |
| 空绳 | [空](evidence/centered-rope-review/after/1440-light-0.png) | [空](evidence/centered-rope-review/after/1440-dark-0.png) |
| 三纸 | [三纸](evidence/centered-rope-review/after/1440-light-3.png) | [三纸](evidence/centered-rope-review/after/1440-dark-3.png) |
| 24条数据／当前满舒适容量4纸 | [满](evidence/centered-rope-review/after/1440-light-24.png) | [满](evidence/centered-rope-review/after/1440-dark-24.png) |
| 旧满屏方案24条／6纸对照 | [旧满](evidence/centered-rope-review/before/1440-light-24.png) | [旧满](evidence/centered-rope-review/before/1440-dark-24.png) |

另拍1040／1920 DIP空、3、24数据两主题（12图），属于显示器适配器模拟，默认舒适容量3／5，不能称物理屏幕矩阵通过。全部18新图／6旧图是隔离Electron实际renderer截图，灰中性底由fixture提供，非AI图/拼贴/图像修改；fixture模拟顶部静止指针，不声称物理鼠标触发。已实际查看主1440空/三纸/满浅深与1040/1920满图，留白和渐隐可见；用户最终方向待确认。

当前1440夹中心允许384..1056DIP，中心活动区为绳长2/3；小屏进一步由纸宽160+屏内12DIP边距保护。默认舒适间距220、最低间距172，纸160×226不缩字。24条仅显示可容纳数量，其余仍通过浏览／查找全部可取，不删数据。保存比例0–1直接映射到新活动区，保持旧比例值、分组和正文，不改schema或原文件；在假数据原比例0..1的24夹/24便签上，三宽重启均核对记录逐字段保持，展示中心在新界内。

受影响验证：82 unit/19文件、类型、构建全绿；实际DOM/IPC左右界移动、右界给邻夹留最小间距、跨Agent拒绝、短停留不合夹、停留合夹后自然解锁的无关夹中心保持、分页/复制当前全文/标题列表、拆分撤销及重启通过。筛选与主进程捕获同域由共享helper及纯单测覆盖，未扩称本轮独立物理菜单过滤通过。正文DataTransfer拖出到测试textarea、原文空白/换行/emoji、copy-only与取消不改数据通过；真实Agent跨App接收未验收。

新窄活动区回归确实发现两项，红证据保留：右端移动可能挤入溢出（空间足够时现为邻夹让最小间距）；首夹比例0被虚拟起排间距推离左界（取消虚拟前夹约束，原生左右界绿）。首次screen访问早于app ready和空绳被过早锁定也是fixture错误，单独保留日志/cleanup，不当产品红。group首次立即读rect未等待渲染，后补DOM几何等待；再次红记录确认真正的左界缺陷而非只把其标成等待问题。

自己的最终60个被测PID在冻结时全部不存在，假数据有界清理完成；不终止其他开发进程、不碰用户安装版/数据/真实剪贴板或全局快捷键。详见[manifest](evidence/centered-rope-review/manifest.json)、before/after result/cleanup、regression日志及[evidence-sha256](evidence/centered-rope-review/evidence-sha256.json)。

本轮先交视觉预览，未打新Mac最终包，也未对居中绳源码再跑Windows CI。现有0.0.14 Windows EXE／run37868192110固定764bec9只包含先前满屏绳+字色修复，**不包含本轮居中绳**，不得继承为本轮通过。G7自动全屏、物理Windows／IME／焦点／穿透、完整候选矩阵和用户主观验收仍未完成。
