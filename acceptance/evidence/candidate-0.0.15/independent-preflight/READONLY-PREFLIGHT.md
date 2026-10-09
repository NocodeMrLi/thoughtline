# 0.0.15 冻结源只读预检

准确固定提交 `61a6837dbde290041a13226596baad5b21249fc1` 已从私有远端独立获取，package与lock版本为0.0.15。`src` 相对独立红绿通过的 `d2901894e243038fe9a18da9781c4837fe6cfc87` diff空；main继续把真实width/filter传给六参数move API。两个P2只沿用准确生产代码的纯源码结案范围，不继承任何旧冻结包/Windows CI/整体验收。

隔离固定源码副本：[qa-candidate-0.0.15-source](../qa-candidate-0.0.15-source/package.json)。从Git对象复制105个build/runtime/test输入（含assets/licenses），SHA见[source-binding](source-binding.json)。没有依赖安装、构建或源码Electron；构建者树没有修改或执行。未来在包窗口释放后使用自己的副本和依赖做独立五输出逐字节绑定。

相对d290的改动为版本与fixture/清理冻结。审阅差异见[fixture-review.diff](fixture-review.diff)：

- projection三组fixture是实际source main与自然解锁renderer：1440最小混合隐藏源merge、1440八夹6命令链+split/undo、1040八夹最后可见→右界。1040为screen适配器模拟。命令返回Promise被await；等待主修订/解锁、renderer订阅新修订与两帧后再读DOM；所有idea原字段和ownership全量核对。不是物理鼠标/真实过滤矩阵。
- package-acceptance依然直接指定冻结App，仅假数据fulltext/editCancel/edit/restart/settings；最新改为记录own PID并有界清理。该脚本本轮只读，未由QA执行。
- hidden-draft保留真正BrowserWindow.hide→31.5秒、重开、目录不可写阻止quit/显示原文、hidden quit持久化路径，新增PID退出与清理记录。未证明物理macOS Hide菜单或IME。
- source默认fixture完整模拟globalShortcut registry；只有明确realShortcuts选项会注册真实快捷键。package直接启动正常App仍会读假数据快捷键配置，QA将设独立罕用键且不会触发系统热键。
- cleanup等待所有指定PID消失后才rm，bounded等待后仍存活保留fixture并抛错，rm有ENOTEMPTY重试。声明清理通过仍需最终具体运行记录，不能只凭脚本结构。

构建者声明当前88unit/20files、type/build及11组串行source回归exit0；此处是声明记录，待最终固定归档核验。本预检没有独立重跑这些流程。

最新Mac待独立核验的构建者报告值：DMG `Thoughtline-0.0.15-mac-arm64.dmg` SHA `84deaaf72355af6b8c7f159a1e5fa752980d09182a07022bdd22f013b3766f90`；asar `3beefbd46cec2732d0ae1449faee43eee89b035499e8ee1967d07c3c4104ee59`。尚未由QA读取/hash/挂载/签名核验；当前构建者独占无调试120秒性能阶段，避免干扰。新隔离体验入口也未执行。Windows最新固定61a对应CI/EXE尚待结果，旧97f/764构建不是最终.15。

下一步见[NATIVE-INCREMENT-PLAN](NATIVE-INCREMENT-PLAN.md)。当前无QA原生实例/构建进程、无时段冲突；固定源预检通过不等于.15包/整体通过。用户图为暂定视觉基线，无主动样式扩展。物理Windows/IME/Agent/G7及焦点/穿透保持未测/不放行边界。
