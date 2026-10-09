# v0.0.17-preview.3 同源双端测试交付

当前状态：整个增量终审的I1／M1已修复并通过唯一限定复审，剩0Critical／0Important／1非阻断Minor。必须新源码同源双端重建后才发布；下方d9cf双包／24附件是旧候选历史，不含f809fe3并发提示修复。用户和物理双端验收未通过。原第一轮修复已交付preview.2；本增量加入完整中英界面及首层太阳／月亮滑动胶囊，保留绳、夹子、纸张的主界面。

| 平台 | 包 | 字节 | SHA256 |
|---|---|---:|---|
| macOS arm64 | Thoughtline-0.0.17-preview.3-mac-arm64.dmg | 133417388 | `9c33bd508978b12a6367941b079e995087fe68be2a1c54df69a658c56c3cd2ac` |
| Windows x64 | Thoughtline-0.0.17-preview.3-win-x64.exe | 113101708 | `ad5401e0cf3fb9489a6520efbc9d49fcaf7ae2a94bf6e3a358588ca7fbf71f89` |

两端实际构建源码与草稿target均为`d9cf75b425464589e6761abd8dff9954f3e2ad0c`，225输入canonical SHA256 `7b658b2d8a88b499c722bfe51a9bba0889b13673e0ee0661364f4eb5129764cc`。后续证据／README／文档提交不是安装包源码。Mac原始文件向量`c92393d605869b6f7003d315ca05414287eff24b98bd0f25c5218acd2c4a8992`；Windows原始向量`e10c8252a66687fa2533914f3a9a78eca474c560c6e5f5ea9f9115f2ad0f9ccb`，CRLF／LF规范Git对象相同。

Mac15.3.1 arm64／Node24.19／Electron44.7：216单测通过、4Windows专用跳过，类型／构建通过；实际挂载包6项数据及3项外观检查通过，正常退出和自建profile清理。Windows hosted Server2025 10.0.26100 x64：CI[37963724007 attempt1](https://github.com/NocodeMrLi/thoughtline/actions/runs/37963724007)成功，220单测、17主外观／11修复、原源端流程、NSIS实际安装schema2与备份／重启、实际外观3项、同版本重装和普通卸载保数据通过。Mac严格ad-hoc签名，未Developer ID或公证；Windows未签名。系统安全保护未关闭。

本地交付目录`/Users/lihongwei/Documents/Codex/2026-10-09/thoughtline-round1-repair/delivery/v0.0.17-preview.3`含24文件／23校验目标、ASCII Mac隔离启动脚本、Windows隔离脚本、实际事实QA指南、完整来源及结果。私有草稿ID408155486仍未发布；24远端附件名称／大小／digest与本地相同，新增和替换13文件实际重下载，其余11与原下载receipt和当前同assetID／digest对应。旧13附件checkpoint、3cb首次失败及原始日志保留。

实施与完整测试／清理见[Task2报告](evidence/appearance/task2-rebuild-d9cf75b/task-2-report.md)，独立测试见[英文与外观检查表](LOCALE-APPEARANCE-INDEPENDENT-QA.md)及[原第一轮检查表](ROUND1-INDEPENDENT-QA.md)。微信4.1.13.65、QQ浏览器豆包及WorkBuddy5.7.6仍只是用户反馈；真实接收框、双端物理输入法／DPI／多屏／焦点／动画与材质手感未测。纸保持哑光薄纸；额外玻璃材质只是双端评估，README宣传图／GIF按用户要求后置。

念头schema3与独立profile偏好保存／备份／回滚见[数据安全](../docs/ROUND1-DATA-SAFETY.md)。旧preview.2／v0.0.16-preview.6、真实安装／数据、原out／依赖、其他工作树和原Electron进程保护。当前记录不是用户验收通过声明。

## 最终源码修复复审（2026-10-10）

source`f809fe36b72bee8f8bdc9afe0607591c98013b23`，证据22d1ccc／报告修正a94f0ad，227canonical`0f0b1048ba136430216b731d51aa6b7db050f1c788c17d9299084e50efab3c7b`。语言／主题前一次成功不再隐藏最新失败提示；短期IPC提交来源按真实webContents投影，不改偏好文件或念头schema／revision。10focused、222单测／4平台跳过、type/build、实际Mac源20+11通过，全部227输入一致，35PID／5profile正常清理。详见[最终源修复报告](evidence/appearance/final-fix/report.md)和[限定复审](evidence/appearance/controller-final/final-scoped-rereview.md)。新实际包尚待Task2同源重建；旧d9cf候选不可直接发布。
