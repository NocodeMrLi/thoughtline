# 核查发现
- 2026-10-23：main HEAD 00a79ea，42 tracked 修改 + 新 settings.ts 与 round7 evidence 未提交。版本0.0.38。已有托盘/设置36项/窗口9项收据，但未绑定当前全部源码，待重新验证。
- 旧 root plans 均为历史；.planning 活跃指针原属 Store 素材任务。新建独立本轮计划，未覆盖旧计划。
- storage-workflow 部分引用改到 settingsPage，备份状态仍误读 manage.footer；生产 storageOperation 目前只 prepareWindow(shelf/settingsWin)，漏了仍独立存在的 manage 编辑保护，需复现核实。
- Node 默认25.8.1，与 package.json >=24.19<25 不符，优先定位可用24运行时。

- Red 复现：UI 备份/迁移被自身 busy guard 拦截、设置未保存阻断新建、manage 输入法保护遗漏、托盘 busy 未禁用。修复后新9项 Mac green，storage 原11项通过。round5-settings33/36失败均为 settings 未加入 info 白名单；preferences同漏，新增red复现后一起补齐。
- 远端 ae6027e 新增 GPL 许可证且仓库目前为 public；完整备份 .git/handoff-backup-20261023 后无冲突 ff/pop。保持远端更新，本轮上传 draft 测试包，不改可见性、不重提 Store。
- 原 red storage 的 IME 失败进入 finally 后被退出保护保留而超时；CDP核验合成profile后仅TERM归属PID53470，5个PID均退出并清理合成目录。

外观截图核查发现独立类未继承manage公共材质/字体；新red-material失败，恢复原manage样式类后新11项green。未重画UI。Node24.19通过；远端GPL更新完整保留。

2026-10-23 用户要求不再新建桌面安装包目录，沿用仓库 app/dist。桌面 8 文件中两安装包、两构建记录已在 dist；4 配套文件待移入。dist 旧 0.0.22/23/36 三 DMG 与旧版本 blockmap 待按明确授权移废纸篓。仅本地范围，微软商店材料及已发布远端版本不动。
