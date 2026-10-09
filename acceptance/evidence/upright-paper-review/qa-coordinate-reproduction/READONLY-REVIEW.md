# 纸片中间预览：独立只读复验

本轮发现一项 **P2 布局回归**，未放行新候选。源码固定为 `84ea53782f16bc79e4a547c74aa1b0140a4b2726`，图证据提交 `587123b8cc14ca91ce88a533a668140be0ffa9f3`；只读 `git ls-remote` 确认指定远端分支当时准确指向后者。两提交的 src/tests/scripts/package/.github 无差异。没有启动 Electron、原生窗口、全局热键或构建；没有操作用户安装版、真实便签、构建者工作树或生产源码。

最新用户指令已将小圆角斜切方案替换为竖向接近 A4 缩略比例、轻微弯纸、下沿轻弧/角微翘而文字平整。因此本轮四图只保留为中间方案证据，不代表对最新纸形的验收，也不代表用户认可夹持真实感。

**P2：跨屏绳形后，主进程与 renderer 的夹子位置坐标域不一致。** `src/renderer/components/Shelf.tsx` 已用 viewport `info.width` 调用 `layoutClips`，拖动也用 viewport width 归一化；`src/main/index.ts:229` 的 `positioned()` 仍对 `fixedRope(width).length` 布局/归一化。新 rope.length 比 viewport 多 48 DIP。merge/move/split/splitAll 先调用此函数，因而会把其他夹子按错误宽度重新写入位置。稳定 dee1f2c 的 renderer 和 main 同用旧 rope.length；这项不一致属于新布局分支。

复现步骤与结果：

1. 从准确提交读取实际 `clipLayout.ts`、`ropeGeometry.ts`，并提取 main 中完整 `positioned()` 表达式；Node 25.8.1 仅擦除 TS 类型并执行，未运行 Electron。
2. 设 viewport=1440、三个同 Agent 的新夹 position=null。renderer 中心为 500/720/940 DIP。
3. 调用原 positioned()，按实际 mergeClips 的规则移除首夹、保留第二夹与其余夹。第三夹中心变为 **931.9018404907976**，无关夹左移 **8.098159509202446 DIP**。若主进程同用 viewport width，第三夹保持 940。
4. 另设 viewport=1040、五夹：renderer 实际可见 4，main positioned() 所用布局可见 5；溢出边界也不一致。

证据为 [coordinate-check.mjs](coordinate-check.mjs) 和 [coordinate-check.json](coordinate-check.json)。执行命令 `node qa-paper-preview/coordinate-check.mjs`，退出 0。该证据证明坐标数学问题，真实鼠标合并及屏幕跳动仍需构建者在其串行原生时段复验。建议 positioned() 与 renderer 统一使用 width，并新增合并/移动后无关夹中心保持、容量临界宽度的断言。现有 `tests/electron/clamp-interaction-review.cjs` 只验证取消 snapshot 不变、拖动后 revision 增长/某夹 position 非空、rope path 不变及文字/夹子尺寸；这些断言不能排除此漂移。

四图均已直接查看且独立核对 SHA256；四个 renderer 源文件也与 manifest 哈希匹配，见 [binding-check.json](binding-check.json)。总体图在 1440×340、DPR1、浅/深两场景各显示三张；绳线在左右画面边界继续出屏，未见可见端头。源码固定 path `M -24 32 Q 720 92 1464 32`，计数没有参与 fixedRope。当前图中的纸片和夹子命中区域都在 viewport 内。

细节图可见较宽的正面夹臂、右侧后臂轮廓、正面夹遮挡绳段及紙顶、夹底接触阴影；这些是相较旧方案的可见拓扑改善。源码分层为后夹→局部绳→纸→前夹，纸顶在绳下约 6 DIP、前夹覆盖纸顶约 5 DIP。纸色、极淡边线和小斜切可在图中观察到。**存在分层、5 DIP 覆盖或几何断言本身不能证明真实夹持感，也不能替代用户对正面朝向、夹口和材料进入关系的判断。** 4x 图通过 renderer CSS transform 获取，是局部检查图，不能算物理 4x/DPR2 桌面验证。

| 检查 | 本轮结论 |
| --- | --- |
| 固定远端 SHA、源码/图哈希绑定 | 通过，源码/图证据层面 |
| 两套总体/细节图、当前三夹的屏内范围 | 通过，限 DPR1/1440×340 |
| count-independent 绳形、屏外端点 | 源码确认；该宽度两图可见事实成立 |
| 主进程/renderer 布局坐标一致 | **失败，P2** |
| 主观夹持真实感与最终纸形 | 未放行，等待新候选与用户反馈 |
| 新竖向纸高度、其他宽度/DPR2、空/多夹 | 未测 |
| 新候选拖出/分组/编辑/分页全文、保存重启 | 未测；构建者正在负责其原生回归 |
| 编译产物哈希、打包一致性、退出/清理 | manifest 为构建者报告，本轮未独立构建/原生复验 |

后续新竖向弯纸候选需独立检查：paper/card/hit/ghost 的高度是否一致且保留在屏内；弯纸底边是否与有效点击边界一致；文字平整且不受夹臂遮挡；拖出/取消/锁释放、合并/拆分/撤销/容量边界、编辑与分页全文不退化。原生仍需串行协调。稳定 0.0.13/dee1f2c 既有功能结果不因这份中间视觉候选回归而撤回；G7 保持隔离和未放行。

本轮没有占用原生时段。P2 已即时通知构建者；本报告与静态复现均写入 QA 自己的目录，没有修改或推送仓库。
