# ICC 像素分析更正

764bec9原始八图、22证据索引与旧pixel-observation逐字节保留。原PNG带非sRGB Google/Skia ICC，旧脚本Image.convert('RGB')未颜色管理，把raw编码当sRGB，故原对比5.886/5.830/4.885/4.870偏高并撤回。

修tests/electron/agent-ink-pixels.py，以ImageCms只在内存转sRGB后采样同ROI。新after代表对比浅蓝4.611394/暖赭4.609097、深蓝4.636183/暖赭4.654414，六Agent/theme结果与独立QA原件逐字段/浮点一致。脚本完整before+after运行exit0，不改图、不重跑原生。仅代表文字内部样本与附近合成上部纸面，不是AA每像素最低/显示器测量。独立QA同时实际查看8图并确认正常尺寸可辨蓝/暖赭；主观最终视觉等待用户。

此分析脚本校正在Windows CI764bec9之后，不在该次CI执行范围；src/unit/package/.github均未变，不扩大CI为物理Windows验证。使用bundled Pillow12.3.0与ImageCms，复跑需相同原始证据目录。
