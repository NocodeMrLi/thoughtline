# TL 图标独立阶段：管线检查点

2026-10-09。状态：批准 v2 已明确；新增夹子变体由父线程制作、待用户选择。按最新指令暂缓最终替换、像素编辑、成套导出和打包。

## 隔离与批准输入

- 工作树：`/Users/lihongwei/Documents/Codex/2026-10-09/task-3/thoughtline-icons`
- 分支：`codex/thoughtline-icons-20261009`
- 基线：`fdbd4370f076f327b51497285aa72da4859300c3`，固定 0.0.15 归档；原 main 与输入窗脏改均未改动。
- 用户 2026-10-09 03:29:38 UTC 明确“可以就用这版”：暖白圆角底、独立清晰墨青 T L、T 左端珊瑚红块。新增夹子变体未撤销 v2 批准，也未获最终选择。
- 准确输入：`libfile_9aec8f5ac5bc8191bce9b8dc3ed596a2`，`thoughtline-tl-wordmark-v2.png`。

## 本机材料化阻挡

已读当前 Library 技能及 resolved-reference materialization 流程，取得当前 helper，在本次私有工作区重复使用。Library 两次准备均解析到准确文件（1,421,401 bytes），均未提供本机已落地文件；两次使用新准备凭据的本机官方 helper 下载均 HTTP 403。首次默认 Python 版本不兼容已改用本机 Python runtime；默认网络限制亦已使用批准的联网执行重试，仍 403。

所以批准图未 materialize 到 Mac、未实际看图，不能做像素编辑或导出。没有猜下载地址、把云路径当本地路径或静默重画替代。此处未保存下载凭据或签名地址。恢复需当前 Library 流程返回可在本机完成的材料化结果；恢复时重新 prepare，复用本次 helper。用户选择后也必须先在 Mac 实际看最终选择图。

## 固定基线管线现状（实际静态检查）

`package.json` 版本 0.0.15；Mac、Windows build.icon 都是 `assets/app-icon.png`。现有主图为旧绳/便签图案，PNG 1024×1024，有 alpha 通道。Mac tray 使用 `trayTemplate.png`，现有 22×22 / @2x 44×44 PNG；`src/main/index.ts:247` 不分平台统一 resize 为 22×22，Mac setTemplateImage(true)，Windows 用主图 PNG 作托盘。

当前 `assets/**/*` 纳入包资源，尚无独立正式 icns/ico 接入；单有 alpha 通道不证明外部白底、阴影或安全边距正确。实际 SHA 与尺寸记录在 [机器证据](evidence/icon-pipeline-checkpoint.json)。

## 用户选择后资源与验收范围（待执行）

保留批准原始预览字节及 Library 身份；去除预览外部底色/投影，保留暖白圆角主体、独立 TL 与珊瑚红定位。像素编辑必须用 imagegen，确定性尺寸/格式转换可用正常工具。安全边距先从实图确定，再以 16/32/64px 实际预览检查，不先杜撰裁切参数。

输出完整透明源图、PNG 多尺寸、Mac icns、Windows 多分辨率 ico。Mac 配置显式 icns、Windows 配置显式 ico，兼顾 NSIS 安装器资源。托盘与批准主体协调：Mac 单色透明 Template 与 @2x，Windows 单独的小尺寸 ico，不能继续直接缩小有圆角底的主图导致 TL 不清楚。保留独立 TL 的可读性，彩色主图的珊瑚红在 Mac 模板化后不能作为颜色识别承诺。

Electron 官方说明建议 Mac Template 成对 @2x、保留文件名并带正确 DPI，16×16 / 32×32@2x 可用；Windows 推荐 ico。最终 DIP 尺寸仍需根据实图和实际菜单栏检查确定。[Electron Tray 文档](https://www.electronjs.org/docs/latest/api/tray)

离线验证计划：源图/导出 SHA、尺寸/alpha、透明角与主体边界、icns/ico 子图条目和解码、32px TL 辨认、平台路径与资源包含、类型/构建检查。包内图标可做离线文件校验；本阶段不启动桌面实例，Mac/Windows 系统菜单栏、缩放、系统缓存与安装后外观必须记录未测。

## 本轮证据边界与交接

本轮仅完成准确 Library 输入解析、两次本机材料化尝试、隔离工作树建立及固定基线静态管线/SHA/PNG 元数据检查。没有新资产、构建、单测、图标真机渲染或桌面进程；不继承 0.0.15 历史测试为本轮图标通过。不替换/重装/发布，不合并 main。

下一步等父线程带回用户最终选择，并解决本机 Library 材料化 403；满足这两项后在此工作树继续资产、适配配置与离线测试。没有创建假便签或测试进程；当前 helper 留作本请求后续使用，无须清理用户数据或他人进程。

