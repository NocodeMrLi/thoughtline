# 合成输入检查点 P2 修复

独立工作树 `/Users/lihongwei/Documents/Codex/2026-10-09/task-6/thoughtline-composition-safety`，私有分支 `codex/thoughtline-composition-safety-20261009`。源码与专项脚本固定提交 `3731dbc88424876838ce11c61d6e20a04b85a0d0`；从准确交接 `c3784976c5fc1877dfa337b0db4e79f3b9c8a423` 建立，未改原工作树。

名称、正文、项目现在统一暂停自动检查点。结束时先读结束事件的当前 DOM 完整值，再恢复并重置节流窗口；结束后的最终 input 可以覆盖结束值，不受已耗尽的 maxWait 提前持久化。无结束事件的失焦及项目浮层卸载回退该字段合成前值，保留其他字段，恢复普通输入保存。输入节点持有合成 ownership，A 的迟到 end 无法解除 B 的暂停；重复 start 保留原回退值，重复/过早 end 忽略，退休节点的迟到 change 忽略。合成期间普通和带 flag 快捷键、直接提交/关闭按钮、prepareQuit 均不能持久化中间值；退出失败不解除合成暂停。

`DraftAutosaver.flush()` 在暂停且有 dirty 值时拒绝；在途完整值可以完成，但之后不排空合成中间值，也不陷入忙等。Composer 以 session 为 React key，新会话重建状态/节点；卸载取消计时器、移除退出监听器，失效会话事件与异步续作不写新会话。主进程已有会话/单调序号/关闭写入会话保护保留。已有便签编辑仍无自动保存，取消保留原正文、新建草稿和 revision。

视觉冻结源 `4f8483af9e19883d1e5ed0ee76b6086f390d1135` 未改变：480×260、132 正文、名称轻量提示和铅笔、底部项目/Agent/挂上、默认通用。样式、主进程、窗口配置、package.json/package-lock 与该源逐字节一致。[源码及编译输出绑定](evidence/composition-safety/source-binding.json)含源码/专项/五编译输出快照及哈希。

## 红证据与新绿

原名称/项目 probe 红证据提交 `f45c45d435503d832208d653e6a31ce12609281d` 保留：[原红](evidence/name-affordance/composition-probe/result.json)，旧 source `7054e70a` 的红同样保留。本阶段增加[暂停 flush 单测红](evidence/composition-safety/red/flush-unit.log)：基于交接源码 exit1，直接暂停 flush 写中间值；在途 flush 继续写中间值导致测试超时。不是把红结果改成绿。

固定修复源 Node24.19.0：[102 单测/24 文件](evidence/composition-safety/unit.log)、[typecheck](evidence/composition-safety/typecheck.log)、[build](evidence/composition-safety/build.log)均 exit0。[最终原生专项](evidence/composition-safety/native/result.json) 20 个检查点 exit0：三字段各2.4秒负向等待/无flag键/直接按钮，end当前值，end后input；A→B迟到end；缺失end与重复start失焦恢复；取消end原值不写；浮层程序关闭；两次prepareQuit拒绝且错误不恢复；退出失败后end；renderer重载；关闭/重开/旧节点及旧会话拒绝；三点击提交仅一条；编辑取消；正常退出最终dirty字段写盘。初轮成功专项另存 attempt-1，未作为最终source结果。

最终原生结果只证明隔离 Mac Electron 源码的合成 DOM/IPC 与原生窗口可见/锁、磁盘结果，快捷键注册是 fixture 模拟。**物理 Mac/Windows IME、Windows 实机、真实 Agent 接收、G7 与完整设备矩阵未做；formalAcceptance=false。** 失焦回退只针对未收到 end 的未确认合成值，不承诺未ACK尾部输入/编辑崩溃/断电零丢失。

未修改的[原红 probe 复跑](evidence/composition-safety/original-probe/result.json) exit0：名称负向等待 revision 0→0、项目2→2，12项带flag/229键保护通过；旧红值0→1/3→4仍保留。[既有草稿安全回归](evidence/composition-safety/draft-regression/safety-native.json) exit0，11条记录含原生观察，涵盖初始化不写、合成、重载序号、失败重试、系统托盘查找/重开、三点击去重、编辑取消、正常退出重启。[独立清理审计](evidence/composition-safety/final-cleanup-audit.json)核26个记录自有PID全部ps查无，三个记录目录不存在；回归fixture也断言假数据已清。[旧85件证据校验](evidence/composition-safety/old-evidence-preserved.json)无字节变化。系统增强对比度/降低透明度全程1/1；无系统设置/权限更改，无生产数据、安装版、旧0.0.15、他人进程修改。

## Windows 新包的下一步

先由独立 QA 对本准确 source/evidence 复验；应用图标另线程已选 v11，但 Library→Mac 403 尚未解决，本阶段不重画、不绕过，也不声称已集成。收到可访问的批准图标并核验文件哈希后，在另一个包阶段集成资产、选定唯一预览版本，重新跑 verify，冻结打包 SHA。

当前 Windows workflow `.github/workflows/test-packages.yml` 允许 `workflow_dispatch`，本私有 P2 分支 push 不在自动触发白名单。届时明确对**打包冻结分支**执行 `gh workflow run test-packages.yml --repo NocodeMrLi/thoughtline --ref <打包冻结分支>`；查询该 run 的 headSha/结论，下载 `Thoughtline-Windows-x64-<headSha>`，核对 exe 与 SHA256SUMS，再由用户在 Windows 隔离数据入口验收名称/正文/项目真实IME、焦点、提交/取消/关闭/重开与窗口布局。CI 成功只证明构建，不是实机验收。本阶段未启动新包 CI、未构建/发布/安装新包、未 merge main。
