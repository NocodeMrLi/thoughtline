# 红夹 TL 正式图标资源与质量交接

2026-10-09。最终图标为暖白圆角主体、独立墨青 T 与 L、T 左端约 30° 正面红夹。旧 v2 及其他稿停止采用。用户在 05:55:26 UTC 明确批准按实际轮廓制作程序 alpha 蒙版；主图设计未重画。

## 固定提交与整合

基于 Windows 预检 HEAD `17823b064be8994e96e283edddea7515dc1dfc12`，包含输入安全源码 `4400f73d430256b5731840610b9f0ccfcd0b8147`。版本保持 0.0.16-preview.5。

- 正式资产与接入：`9bc6ef45856090f5e74a4dac63b2a00639770178`。
- 精确资产清单：`70c064981c2b26505e58a8dcc72d40e96839e3e6`。

这两项可依次 cherry-pick 到准确 Windows 基线，早期 Library/图片编辑拒收提交不是前置条件。父线程已交 Windows 线程继续整合构建；本交接不宣称后续安装包或系统真机测试已经通过。main、安装版、真笔记与他人进程未动。

## 原图、透明边缘与清晰度

用户桌面原图实际读取并看过：[批准原件](../assets/source/approved-TL-brand-logo.jpg)，1254×1254 JPEG、98,367 bytes，无截图/浏览器边框，无明显块状压缩。原件 SHA256：

`313485e59395e3165f6504964efd72f4a3811150ac337834be3e2759f279f778`

JPEG 是有损来源，不能称无损原稿；1254 原生尺寸足够导出 1024，不做图像放大。主图 [1254 透明源](../assets/source/thoughtline-tl-v11-transparent-1254.png) 每个 RGB 字节与原 JPG 解码后相同，仅增加 alpha。轮廓使用逐段人工锚点与平滑三次曲线，按 4 倍像素覆盖率生成窄抗锯齿边；不是颜色阈值抠图。暖白主体实心，外背景透明，只有边界 3,423 个像素部分透明。轮廓单连通，无内部孔洞或外部散点。

[轮廓规范](../assets/source/tile-contour-v11.json)与 [1440 透明留边母版](../assets/source/thoughtline-tl-v11-padded-master.png)保留。1440 是添加透明画布，不是提高原图清晰度。1024 应用图的主体约占画布 80%，四侧透明边距约 10%，避免平台贴边或阴影裁切。

两份 imagegen 输出因外部散点与主体部分透明被拒收；它们只作为历史失败证据保存，未混入正式资产。

## 平台资源与托盘

| 资源 | 规格与接入 |
|---|---|
| 主 PNG | 16 / 24 / 32 / 48 / 64 / 128 / 256 / 512 / 1024 px；[1024 主图](../assets/app-icon.png) |
| Mac 应用 | [app-icon.icns](../assets/app-icon.icns)，含 10 个逻辑/Retina 表示，实际像素覆盖 16–1024；build.mac.icon 显式指向此文件 |
| Windows 应用与 NSIS | [app-icon.ico](../assets/app-icon.ico)，7 帧 16 / 24 / 32 / 48 / 64 / 128 / 256；应用、安装器、卸载器、安装器标题图标显式使用此资源 |
| Mac 菜单栏 | [trayTemplate.png](../assets/trayTemplate.png) 16×16、72dpi；[trayTemplate@2x.png](../assets/trayTemplate@2x.png) 32×32、144dpi；单色透明，保留 Template 配对名，无统一 resize 破坏密度；运行时启用 template |
| Windows 托盘 | [tray-win.ico](../assets/tray-win.ico)，独立 7 帧；直接将 ICO 路径传入 Tray，由系统选择尺寸。简化 TL 与约 30° 红夹轮廓，暖白小背板保证深浅任务栏对比度 |

托盘遵循同一 TL 和夹子方向，但为了小尺寸辨认省略材质高光、内部投影等细节。Mac 模板由系统着色，不能承诺显示红色；16px 主图中红夹只是红色识别点，银带细节无法保持。32px TL 独立可辨；不声称微小尺寸与大图具有同样细节。

## 实际验证证据

[资源验证记录](../acceptance/evidence/icon-final/resource-verification.json)包含全部正式资源 SHA。实际完成：

- 源 RGB 完全一致；alpha 拓扑、主体实心与透明外圈验证。
- 两个 ICO 各 7 帧解码，Mac 原生 iconutil 解码 ICNS 的 10 个表示；各帧可见 RGB 和 alpha 与对应 PNG 完全一致。
- 模板单色、72/144dpi 与 1×/2×尺寸；打包配置路径与编译后的托盘资源路径验证。
- [16–256 深浅底](../acceptance/evidence/icon-final/app-sizes-light-dark.png)、512/1024 深浅底、[四角放大](../acceptance/evidence/icon-final/tile-corners-dark-2x.png)、[容器解码 16/32](../acceptance/evidence/icon-final/decoded-container-16-32.png)、[托盘深浅底模拟](../acceptance/evidence/icon-final/tray-sizes-light-dark-simulation.png)均已实际看图。放大图是明确标注的像素检查，不用于虚增清晰度。
- [离线回归日志](../acceptance/evidence/icon-final/verify.log)：类型检查和构建 exit 0，102 项单测通过 / 4 跳过，24 个测试文件通过 / 1 跳过。早先进度误报 103 已按日志更正。

最初系统 ICNS 编码器的 16/32 半透明边缘发生预乘转换；最终改用标准分离 RGB/alpha 的小图资源与大图 PNG 表示，原生解码后逐像素匹配。测试不是只检查文件存在。

这些验证证明资产和静态接入可用，**不替代**真实 Mac 菜单栏、Windows 任务栏、安装后图标缓存、多显示器缩放或最终包内图标验收。本线程未启动 native 窗口、安装、重装或发布；后续由父线程协调。

## 复现和清理边界

`scripts/export-icons.py` 使用 Python 3 / Pillow / numpy 从批准原件和轮廓规范导出；`scripts/verify-icons.py` 额外使用 Mac iconutil 做本机原生解码，并检查现有 out/main 编译结果。源/导出规格和 SHA 足以绑定后续构建；Windows CI 的新包应重新绑定自己的准确 HEAD 和资产清单。

临时 iconset/编解码探针目录随执行自动清理。没有创建假便签、独立测试用户数据或本轮桌面进程。只把本轮生成的两份重复失败编辑副本移到可恢复位置，提交中的原图及失败证据继续保留；共享依赖和他人进程不清理。
