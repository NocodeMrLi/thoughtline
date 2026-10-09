# 轻量 Composer 冻结预览：独立只读 QA

已实际查看四张原图并审阅源码/基础安全证据。当前正常尺寸中，正文成为主层，Agent 选择、查找入口、名称/项目的折叠入口仍可达；浅深展开态没有可见裁切。**未发现本次只读范围内阻挡先看效果的新 P1/P2 产品问题。** 主观视觉仍等用户反馈，不代表新包或整个输入流程验收通过。

固定源 `6638ce14a4aefc9f3a13e2fbb36b7710f722c55f`，证据 `566cce05680189f03c94925960bc4646bd72f848`，版本 `0.0.16-preview.1`，基于冻结 `61a6837`/0.0.15。已从私有远端获取准确对象。没有启动原生、构建、读取真实便签/Agent/剪贴板，也没有修改任何生产文件。

## 绑定与实际观图

7 个声明源码 SHA、原 17 项证据索引全部独立匹配；只读核对构建者当前 preview 的 5 个编译文件 SHA 与固定绑定一致，**不是独立重建/源到包等价证明**。源与证据提交的 src/tests/scripts/package/.github 没有差异。旧 0.0.15 两图及元数据与自己的原件逐字节相同。结果见 [绑定复核](readonly-binding-check.json)；原报告见 [原预览说明](COMPOSER-PREVIEW-original.md)。

四图都是实际 Mac 源码 Electron、530×520 DIP、DPR2、PNG1060×1040。没有新 DMG/EXE，不能写成 Windows 图或冻结包实测。

| 原图 | 独立观察及记录 |
|---|---|
| [默认浅色](evidence/default-light.png) | 空正文获焦点；正文框 488×297.5 DIP；Agent 紧凑选择器、查找、可选折叠与挂上均可见 |
| [展开浅色](evidence/options-light.png) | 两行假正文及 emoji，名称/项目两列完整；正文框高 234 DIP，页脚不移动 |
| [默认深色](evidence/default-dark.png) | 已填正文、可选信息折叠；正文框高 297.5 DIP，无可见裁切；焦点在先前点击的 summary，不据此误报重开失焦 |
| [展开深色](evidence/options-dark.png) | 正文、选择器、名称/项目及提交按钮完整可见，正文框高 234 DIP |

四个记录的页脚底缘为501、status底缘为455，均在520视口内。这仅覆盖当前尺寸/内容，不推成低工作区或长文矩阵。默认浅色为空、默认深色已有正文，也不是完全同内容的浅深像素对照。窗口相对旧包530×440增加80 DIP；“轻量”在本阶段指主层控件收敛，不表示窗口更小。

## 可达性与安全路径审阅

- 正文保留关联 label；Agent 使用具名原生 select，从全部 snapshot agents 生成 option，自定义 Agent 没有被隐藏。原生 details/summary 提供名称和项目入口，两个 input 各有 label，长度限制保持原值。
- 新“查找 / 已收起”按钮先 `await close(draft)` 保存草稿，只在成功后调用 `openManage`；失败保留当前文字并显示错误。静态路径可达，但此次专项没有实际点击这条新入口链。
- 编辑模式、取消编辑标签、同组更换 Agent 的拆夹确认仍在；新布局没有移除确认。此次原生专项是新建场景，未覆盖完整编辑/迁移/取消矩阵。
- `inFlight` ref 在 submit/close/prepareQuit 入口同步设置，补强同一 React 事件批次重复点击；finally 或退出错误解除。输入、Agent、可选字段与按钮在 busy 时禁用，名称/项目折叠开关本身仍可操作。
- composition ref 与原生 isComposing、229 防护一起使用；repeat提交被挡；select上的Esc交给选择器，其他非组合Esc保存草稿/取消编辑。源码符合声明方向，真实系统 IME 未测。
- 首轮焦点错误日志是在磁盘保存失败后等待正文焦点超时。修正源码把 focus 放到 `[error,busy]` effect 的提交后阶段，busy解除后再聚焦；绿专项包含该实际等待和恢复可写后重试。不是把首轮失败日志改绿。
- 主进程和创建窗口统一使用530×520常量，contextIsolation/nodeIntegration/sandbox仍保持原安全设置。新增nativeTheme listener在窗口closed时移除。旧overlay CSS作为完整前缀逐字节保持，新增规则限于Composer，绳/纸/夹/Agent颜色源码未改。

可访问性结构可读，不等于屏幕阅读器或完整键盘导航验收；原生select弹出、长Agent名称、系统焦点仍待实际设备。详细边界见 [范围审计](scope-audit.json)。

## 基础证据可靠性及未测范围

审阅构建者日志：20文件/88单测、typecheck、build通过；实际新Composer专项声明完整exit0，首轮refocus timeout红日志保留。专项关闭重开后核对正文/名称/项目/自定义Agent，目录chmod只读保存失败后核对正文及真正焦点恢复，恢复可写后同批三次点击只得到一条便签。成功后核对正文、Agent、名称及draft清空；提交后的项目字段没有另作断言。清理记录为5个自有PID退出、假数据删除，并使用先确认PID不存在再有界删除的helper。本人未独立重跑这些原生检查；[原机器结果](evidence/result.json)、[清理](evidence/cleanup.json)、[红日志](evidence/error-refocus-red.log)、[绿日志](evidence/native.log)均原样保留。

有三个 **P3 证据/覆盖边界**，不误报为已复现产品失败，也不要求改动冻结预览：

1. `compositionGuardsSubmitAndClose` 在合成composition/keydown批次后立即查询主进程revision和正文；未单独检查原生window仍可见、锁未释放，也没有观察延迟IPC不存在的边界。这次可结合正确的同步ref源码解释合成防护，不能把一次立即的负结果扩大成完整异步等待或物理IME证明。后续安全矩阵宜加明确的窗口/锁、在途调用计数及正向提交检查。
2. `draftCloseReopenAllFields` 是同一进程隐藏后重开，不是App重启恢复。新的dirty正常退出与busy退出路径未在这个专项中单独证明；原来的捕获草稿退出协议仍在，但0.0.15通过不自动覆盖新版renderer。本预览明确没有未保存输入的自动持久化/异常退出恢复承诺，下一独立draft recovery阶段不能沿用本次关闭重开绿作崩溃绿。
3. 新查找入口以及编辑/组内Agent迁移只有结构/源码可达性，本次没有实际完整操作链。低工作区/长文、自定义长Agent名、多屏缩放、屏幕阅读器、物理IME/焦点/热键、Windows与新冻结包矩阵仍未测。

通过项：固定绑定/原件SHA、实际四图观察、当前尺寸可见布局及源码可达性审阅。失败项：构建者首轮refocus专项exit1已保留、后续修正专项exit0；没有新增独立产品失败。未测项如上。用户视觉反馈待定，formalAcceptance=false；0.0.15仍保持原冻结包，独立preview不继承其验收。

本目录全部原件、审阅源码和报告 SHA 见 [evidence-sha256.json](evidence-sha256.json)。
